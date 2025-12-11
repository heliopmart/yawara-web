"""
Módulo Orquestrador do Processo Seletivo (Selection Process Orchestrator).

Este módulo é o coração da execução do processo seletivo do Yawara.
Ele atua como um maestro, coordenando a recuperação de dados, o download de arquivos,
a inteligência artificial e a persistência dos resultados.

Principais responsabilidades:
1.  **Gerenciamento de Fila:** Busca candidatos pendentes no banco de dados.
2.  **Controle de Concorrência:** Usa semáforos (`asyncio.Semaphore`) para evitar sobrecarga de I/O e CPU.
3.  **Integração de Serviços:** Conecta Storage (PDF), Ingestão (OCR/NLP) e Engine de Avaliação (Y-TSE).
4.  **Resiliência:** Tratamento de erros por candidato para que uma falha não pare o lote inteiro.

Exemplo de Uso Manual:
    ```bash
    python -m app.services.selection_process "UUID-DA-EDICAO"
    ```
"""

import logging
import asyncio
from typing import Optional
import json

# Serviços
from app.services.selection_data import data_service
from app.services.storage import storage_service
from app.services.ingestion import ingest_academic_record_from_pdf 
from app.ml.engine_v1 import y_tse
from app.utils.db import db_update

logger = logging.getLogger("yawara.services.orchestrator")

# --- CONTROLE DE CONCORRÊNCIA ---

# Define quantos processos pesados podem rodar simultaneamente.
MAX_CONCURRENT_TASKS = 3 

class SelectionProcessOrchestrator:
    """
    Classe orquestradora responsável pela execução em lote (batch) da triagem de candidatos.

    Atributos:
        semaphore (asyncio.Semaphore): Controle de concorrência para limitar tarefas paralelas.
    """

    async def run_batch_screening(self,  ps_edition_id: Optional[str] = None):
        """
        Inicia a triagem em lote para uma edição específica do Processo Seletivo.

        O método busca a fila de candidatos pendentes, baixa seus históricos,
        submete à IA e salva o veredito de elegibilidade.

        Args:
            ps_edition_id (Optional[str]): UUID da edição do processo seletivo. 
                                           Se não informado, busca a edição ativa no banco.

        Returns:
            Dict[str, Any]: Resumo da execução contendo:
                - `processed` (int): Número de candidatos processados com sucesso.
                - `total` (int): Total de candidatos que estavam na fila.
                - `status` (str): Status final da operação (ex: "finished").

        Raises:
            Exception: Erros críticos de conexão com banco ou configuração ausente são logados, 
                       mas não interrompem a execução se for possível continuar.
        """

        if not ps_edition_id:
            ps_edition_id = data_service.get_ps_edition_active()
        
        logger.info(f"--- INICIANDO TRIAGEM (SEMAPHORE MODE) PARA EDIÇÃO {ps_edition_id} ---")

        # 1. Busca Regras
        nuclei_rules = data_service.get_nuclei_configuration(ps_edition_id)
        if not nuclei_rules:
            logger.error("Abortando: Nenhuma configuração de núcleo encontrada.")
            return
        
        # 2. Busca TODA a fila de trabalho
        work_queue = data_service.get_pending_candidates_queue(ps_edition_id)
        total_candidates = len(work_queue)

        if total_candidates == 0:
            logger.info("Nenhum candidato pendente.")
            return {"status": "finished", "total_processed": 0}

        logger.info(f"Fila carregada: {total_candidates} candidatos. Iniciando processamento com concorrência={MAX_CONCURRENT_TASKS}...")

        # 3. Cria o Semáforo 
        semaphore = asyncio.Semaphore(MAX_CONCURRENT_TASKS)

        # 4. Prepara as tarefas (Tasks)
        # Cada tarefa vai tentar adquirir o semáforo antes de rodar
        tasks = [
            self._bounded_process_candidate(task, nuclei_rules, ps_edition_id, semaphore)
            for task in work_queue
        ]

        # 5. Executa tudo e aguarda (Parallel Execution controlada)
        # return_exceptions=True garante que se um falhar, os outros continuam
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Contagem de sucessos
        success_count = sum(1 for r in results if r is True)
        
        logger.info(f"--- FIM DA TRIAGEM. Sucessos: {success_count}/{total_candidates} ---")
        
        await self._trigger_management_alert(ps_edition_id)
        
        return {"processed": success_count, "total": total_candidates}

    async def _bounded_process_candidate(self, task, nuclei_rules, ps_edition_id, semaphore):
        """
        Wrapper que executa a lógica de processamento respeitando o limite do semáforo.

        Args:
            task (Dict): Dicionário contendo dados do candidato (`user_id`, `file_id`).
            nuclei_rules (List): Lista de configurações dos núcleos.
            ps_edition_id (str): ID da edição.
            semaphore (asyncio.Semaphore): Objeto de controle de concorrência.

        Returns:
            bool: `True` se processado com sucesso, `False` caso contrário.
        """
        async with semaphore:
            # Aqui dentro só entram MAX_CONCURRENT_TASKS por vez.
            return await self._core_process_logic(task, nuclei_rules, ps_edition_id)

    async def _core_process_logic(self, task, nuclei_rules, ps_edition_id) -> bool:
        """
        Núcleo lógico do processamento de um único candidato.

        Fluxo de Execução:
        1.  **Download:** Baixa o PDF do histórico escolar do Storage.
        2.  **Ingestão (IA):** Usa `ingest_academic_record_from_pdf` para extrair texto e classificar matérias.
        3.  **Avaliação (Engine):** Usa `y_tse` para calcular scores de elegibilidade baseados nas regras.
        4.  **Persistência:** Salva os núcleos aprovados na tabela `ps_user_cards`.

        Args:
            task (Dict): Dados do candidato.
            nuclei_rules (List): Regras de avaliação.
            ps_edition_id (str): ID da edição.

        Returns:
            bool: Sucesso ou falha da operação.
        """
        user_id = task["user_id"]
        file_id = task["file_id"]

        try:
            logger.info(f"Processing User: {user_id}...")

            # [A] Heavy I/O: Download PDF
            pdf_bytes = storage_service.get_file_bytes(file_id)
            if not pdf_bytes:
                logger.warning(f"Falha download User {user_id}")
                return False

            # [B] Heavy CPU: Neural Network Inference
            candidate_history = ingest_academic_record_from_pdf(pdf_bytes, user_id, ps_edition_id)

            if not candidate_history:
                logger.warning(f"Histórico vazio/ilegível User {user_id}")
                return False

            # [C] Math: Engine 1
            eligibility_results = y_tse.process_candidate_eligibility(
                candidate_history=candidate_history.subjects,
                nuclei_contexts=nuclei_rules
            )

            # DEBUG LOGGING
            
            # print("\n\n🧮 [DEBUG] Eligibility Results:")
            # results_dict = [
            #     res.model_dump() if hasattr(res, 'model_dump') else res.__dict__ 
            #     for res in eligibility_results
            # ]
            # print(json.dumps(results_dict, indent=2, ensure_ascii=False, default=str))

            # [D] DB Update
            approved_nuclei = [r.nucleus_name for r in eligibility_results if r.is_eligible]

            db_update(
                table="ps_user_cards",
                data={
                    "nuclei_eligible": approved_nuclei,
                    "updated_at": "now()" ,
                    "is_eligible": (True if len(approved_nuclei) > 0 else False)
                },
                filters={"user_id": user_id, "edition_id": ps_edition_id}
            )
            
            logger.info(f"User {user_id} OK. Aprovado: {len(approved_nuclei)} núcleos.")
            return True

        except Exception as e:
            logger.error(f"Erro crítico User {user_id}: {str(e)}")
            return False
        
    async def _trigger_management_alert(self, ps_edition_id: str):
        """
        [PLACEHOLDER] Alerta de Gestão para Núcleos Vazios.
        
        Objetivo:
        Verificar no banco se algum núcleo teve 0 aprovados nesta edição.
        Se sim, disparar notificação (Slack/Email) para a banca decidir:
        1. Baixar a régua no banco (ex: de 70% para 60%) e rodar de novo?
        2. Fazer repescagem manual?
        
        Isso garante que não alteramos a lógica da Engine automaticamente,
        preservando a consistência dos dados para a IA futura.
        """
        logger.info(f"🔔 [MANAGEMENT ALERT] Verificando saúde dos núcleos da edição {ps_edition_id}...")
        
        # TODO: Implementar query: 
        # SELECT nucleus_id, count(*) FROM ps_user_cards 
        # WHERE edition_id = ... AND nucleus_id = ANY(nuclei_eligible)
        # GROUP BY nucleus_id
        
        # Por enquanto, apenas logamos que a função foi chamada.
        pass

selection_orchestrator = SelectionProcessOrchestrator()

if __name__ == "__main__":
    import asyncio
    logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    print(f"🚀 Iniciando execução manual...")
    asyncio.run(selection_orchestrator.run_batch_screening())