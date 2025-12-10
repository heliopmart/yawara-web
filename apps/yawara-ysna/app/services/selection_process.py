import logging
import asyncio
from typing import List

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
    Maestro do Processo Seletivo.
    Usa Semáforos para controlar o fluxo de processamento pesado.
    """

    async def run_batch_screening(self, ps_edition_id: str):
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
        return {"processed": success_count, "total": total_candidates}

    async def _bounded_process_candidate(self, task, nuclei_rules, ps_edition_id, semaphore):
        """
        Wrapper que respeita o semáforo.
        Só executa se conseguir permissão do semáforo.
        """
        async with semaphore:
            # Aqui dentro só entram MAX_CONCURRENT_TASKS por vez.
            return await self._core_process_logic(task, nuclei_rules, ps_edition_id)

    async def _core_process_logic(self, task, nuclei_rules, ps_edition_id) -> bool:
        """
        A lógica pesada (Download -> NN -> DB).
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
                candidate_history=candidate_history,
                nuclei_contexts=nuclei_rules
            )

            # [D] DB Update
            approved_nuclei = [r.nucleus_id for r in eligibility_results if r.is_eligible]

            db_update(
                table="ps_user_cards",
                data={
                    "nuclei_eligible": approved_nuclei,
                    "updated_at": "now()" 
                },
                filters={"user_id": user_id, "edition_id": ps_edition_id}
            )
            
            logger.info(f"User {user_id} OK. Aprovado: {len(approved_nuclei)} núcleos.")
            return True

        except Exception as e:
            logger.error(f"Erro crítico User {user_id}: {str(e)}")
            return False

selection_orchestrator = SelectionProcessOrchestrator()