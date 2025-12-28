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

# ML Logger
from app.utils.ml_logger import ml_logger

# ORQUETRAL
from app.services.base_engine_service import BaseEngineService

# Serviços
from app.services.selection_data import data_service
from app.ml.engine_v1 import y_tse
from app.utils.db import db_update

logger = logging.getLogger("yawara.services.engine_v1_service")

# --- CONTROLE DE CONCORRÊNCIA ---

# Define quantos processos pesados podem rodar simultaneamente.
MAX_CONCURRENT_TASKS = 3 

class EngineV1Service(BaseEngineService):
    def load_context(self, ps_edition_id: str):
        """
        Carrega as regras UMA VEZ antes de processar a fila.
        Isso evita queries repetidas no banco.
        """
        nuclei_rules = data_service.get_nuclei_configuration(ps_edition_id)
        if not nuclei_rules:
            logger.error("Abortando: Nenhuma configuração de núcleo encontrada.")
            return None
        return nuclei_rules

    async def evaluate_candidate(self, user_id, candidate_input, history, context, edition_id):
        try:
            nuclei_rules = context

            if not nuclei_rules:
                return False

            # [C] Math: Engine 1
            eligibility_results = y_tse.process_candidate_eligibility(
                candidate_history=history,
                nuclei_contexts=nuclei_rules
            )

            # Envia os dados para ml_logger para treino futuro da engine v2.
            ml_logger.log_decision_batch(
                candidate_id=user_id,
                ps_edition_id=edition_id,
                history=history,
                results=eligibility_results,
                nuclei_configs=nuclei_rules
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
                filters={"user_id": user_id, "edition_id": edition_id}
            )
            
            logger.info(f"User {user_id} OK. Aprovado: {len(approved_nuclei)} núcleos.")
            return True
        except Exception as e:
            logger.error(f"Erro crítico User {user_id}: {str(e)}")

engine_v1_service = EngineV1Service()

if __name__ == "__main__":
    import asyncio
    # Teste manual
    asyncio.run(engine_v1_service.run_batch())