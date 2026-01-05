import logging
import asyncio
from typing import Optional, Dict, Any

# Serviços Comuns
from app.services.selection_data import data_service
from app.services.storage import storage_service
from app.services.ingestion import ingest_academic_record_from_pdf 
from app.services.report_analyst import report_analyst

# Schemas
from app.schemas.candidate import CandidateInput

logger = logging.getLogger("yawara.services.base_engine_service")

class BaseEngineService:
    """
    Classe base que gerencia o ciclo de vida do processamento em lote.
    Filhos devem implementar o método `evaluate_candidate`.
    """

    def __init__(self, max_concurrent_tasks: int = 3):
        self.semaphore = asyncio.Semaphore(max_concurrent_tasks)

    async def run_single(self, candidate_id: str, ps_edition_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Processa um candidato específico sob demanda (Modo 'Uber').
        """
        if not ps_edition_id:
            ps_edition_id = data_service.get_ps_edition_active()
        
        logger.info(f"--- INICIANDO SINGLE RUN ({self.__class__.__name__}) para {candidate_id} ---")

        context = self.load_context(ps_edition_id)
        if context is None:
             raise ValueError("Contexto de avaliação não carregado.")

        task = data_service.get_candidate_task_data(candidate_id)
        
        if not task:
            logger.warning(f"Candidato {candidate_id} não encontrado ou sem dados pendentes.")
            return {"status": "error", "message": "Candidate data not found"}

        result = await self._process_single_candidate(task, context, ps_edition_id)
        
        if result.get("success"):
             result = self._handle_xai_processing(result, task)

        logger.info(f"--- SINGLE RUN FINALIZADO. Sucesso: {result.get('success')} ---")
        return {"processed": 1, "xai": result, "candidate_id": candidate_id}

    async def run_batch(self, ps_edition_id: Optional[str] = None):
        """
        Método Mestre (Template Method). Não precisa ser alterado pelos filhos.
        """
        if not ps_edition_id:
            ps_edition_id = data_service.get_ps_edition_active()
        
        logger.info(f"--- INICIANDO BATCH ({self.__class__.__name__}) ---")

        context = self.load_context(ps_edition_id)
        if context is None:
             logger.warning("Abortando: Contexto de avaliação não carregado.")
             return

        work_queue = data_service.get_pending_candidates_queue(ps_edition_id)
        
        total = len(work_queue)
        if total == 0:
            logger.info("Fila vazia.")
            return

        logger.info(f"Processando {total} candidatos...")

        tasks = [
            self._bounded_process(task, context, ps_edition_id)
            for task in work_queue
        ]
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        success_count = sum(1 for r in results if r is True)

        await self._trigger_management_alert(ps_edition_id)
        logger.info(f"--- BATCH FINALIZADO. Sucessos: {success_count}/{total} ---")
        
        return {"processed": success_count, "total": total}


    def _handle_xai_processing(self, result: Dict, task: Dict) -> bool:
        """
        Handler responsável por gerar o contexto visual (PDF Bundle) a partir dos dados brutos.
        """
        if not result.get("xai_reports"):
            return result

        try:
            logger.info("📊 Processando camada visual de XAI...")
            
            candidate_data = task.get("data", {})
            candidate_info = {
                "id": task.get("user_id"),
                "name": candidate_data.get("name", "Candidato")
            }
            
            report_bundle = report_analyst.generate_report_bundle(
                candidate_info, 
                result["xai_reports"]
            )
            
            result["report_bundle"] = report_bundle.model_dump()
            return result

        except Exception as e:
            logger.error(f"Erro ao gerar bundle XAI: {e}")
            return result

    def load_context(self, ps_edition_id: str) -> Any:
        """Pode ser sobrescrito para carregar regras ou pesos."""
        return {}

    async def _bounded_process(self, task, context, edition_id):
        async with self.semaphore:
            return await self._process_single_candidate(task, context, edition_id)

    async def _process_single_candidate(self, task, context, edition_id) -> bool:
        """
        Realiza o trabalho pesado comum (I/O) e chama o método de avaliação específico.
        """
        user_id = task.get("user_id") or task.get("candidate_id")
        file_id = task.get("file_id")

        extra_data = task.get("data", {})
        course = extra_data.get("course")
        semester = extra_data.get("semester")

        try:
            if not file_id:
                logger.warning(f"User {user_id} sem arquivo associado.")
                return False

            pdf_bytes = storage_service.get_file_bytes(file_id)
            if not pdf_bytes:
                return False

            record = ingest_academic_record_from_pdf(pdf_bytes, user_id, edition_id) 
            if not record:
                return False

            candidate_input = CandidateInput(
                name="Candidato",
                course=course or getattr(record, 'course', "ENGENHARIA_INDEFINIDA"), 
                semester=semester or getattr(record, 'semester', 1),
                subjects=[]
            )

            result = await self.evaluate_candidate(user_id, candidate_input, record.subjects, context, edition_id)
            
            # 4. CORREÇÃO: Chama o alerta ao final do lote
            await self._trigger_management_alert(edition_id)

            return result

        except Exception as e:
            logger.error(f"Erro no pipeline base para {user_id}: {e}")
            return False

    async def evaluate_candidate(self, user_id, candidate_input, history, context, edition_id):
        """
        MÉTODO ABSTRATO: Cada Engine implementa sua lógica aqui.
        """
        raise NotImplementedError("As subclasses devem implementar isso!")

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