import logging
import asyncio
from typing import Optional, Dict, Any

# settings
from app.core.config import settings

# 
from fastapi.concurrency import run_in_threadpool

# Serviços Comuns
from app.services.alert_service import alert_service, AlertLevel, AlertSource
from app.services.selection_data import data_service
from app.services.storage import storage_service
from app.services.ingestion import ingest_academic_record_from_pdf 
from app.services.report_analyst import report_analyst
from app.services.html_report_service import html_report_service
from app.services.report_analyst import report_analyst
from app.utils.db import db_update

# Schemas
from app.schemas.candidate import CandidateInput
from app.schemas.report import CandidateReportBundle

logger = logging.getLogger("yawara.services.base_engine_service")
class BaseEngineService:
    """
    Classe base que gerencia o ciclo de vida do processamento em lote.
    Filhos devem implementar o método `evaluate_candidate`.
    """

    def __init__(self, max_concurrent_tasks: int = 3):
        self.semaphore = asyncio.Semaphore(max_concurrent_tasks)

    async def run_single(
            self, 
            candidate_id: Optional[str], 
            ps_edition_id: Optional[str] = None,

            # Create Example Y_SNA
            task: Optional[Dict[str, Any]] = None,
            pdf_bytes_example: Optional[bytes] = None,
            is_example: bool = False
        ) -> Dict[str, Any]:
        """
        Processa um candidato específico sob demanda (Modo 'Uber').
        """
        self.is_example = is_example

        if not ps_edition_id:
            ps_edition_id = data_service.get_ps_edition_active()
        
        logger.info(f"--- INICIANDO SINGLE RUN ({self.__class__.__name__}) para {candidate_id} ---")

        context = self.load_context(ps_edition_id)
        if context is None:
             raise ValueError("Contexto de avaliação não carregado.")

        if (task is None) and (self.is_example is False):
            task = data_service.get_candidate_task_data(candidate_id)
        
        if not task:
            logger.warning(f"Candidato {candidate_id} não encontrado ou sem dados pendentes.")
            return {"status": "error", "message": "Candidate data not found"}

        result = await self._process_single_candidate(task, context, ps_edition_id, pdf_bytes_example)
        
        if result.get("success"):
             result = self._handle_xai_processing(result, task)
        else:
            logger.error(f"Erro ao processar candidato {candidate_id}: {result.get('error')}")
            return {"processed": 0, "success": False, "xai": result, "candidate_id": candidate_id}
        
        pdf_bytes = await self._generate_report_bundle(result)

        upload_success = False
        if pdf_bytes and self.is_example is False:
            upload_success = await self._upload_report_pdf(candidate_id,  task.get("user_id", None), pdf_bytes)

        logger.info(f"--- SINGLE RUN FINALIZADO. Sucesso: {result.get('success')} ---")
        return {"processed": 1, "success": upload_success, "xai": result, "pdf_bytes": pdf_bytes, "candidate_id": candidate_id}

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
            
            user_id_safe = task.get("user_id") or task.get("candidate_id") or "Unknown"

            candidate_info = {
                "user_id": user_id_safe,
                "input_obj": CandidateInput(
                    name=candidate_data.get("name", f"Candidato {user_id_safe[:8]}"),
                    course=candidate_data.get("course", "N/A"),
                    semester=candidate_data.get("semester", 1),
                    subjects=[]
                )
            }
            
            report_bundle = report_analyst.create_bundle(
                candidate_info, 
                result 
            )
            
            result["report_bundle"] = report_bundle.model_dump()
            return result

        except Exception as e:
            logger.error(f"Erro ao gerar bundle XAI: {e}")
            return result

    async def _generate_report_bundle(self, result: Dict) -> Optional[bytes]:
        """
        Gera o bundle de relatório XAI a partir dos dados brutos.
        """
        report_data = result.get("report_bundle")

        if not report_data:
            logger.warning("Tentativa de gerar PDF sem 'report_bundle' disponível. Pulando etapa.")
            return None

        try:
            bundle = CandidateReportBundle(**report_data)

            pdf_bytes = await run_in_threadpool(
                html_report_service.generate_pdf_bytes,
                bundle
            )

            return pdf_bytes
        except Exception as e:
            logger.error(f"Erro ao gerar PDF do bundle XAI: {e}")
            return None

    async def _upload_report_pdf(self, candidate_id: str, user_id: str, pdf_bytes: bytes) -> bool:
        """
        Upload do PDF para o cloud e update do registro gerado para o Storage.
        """
        
        try:
            remote_name = f"{settings.CLOUDINARY_DOCS_FOLDER_NAME}/ps/{user_id if user_id else candidate_id}/yawara_sna_report.pdf"
            url = await run_in_threadpool(
                storage_service.upload_bytes, 
                pdf_bytes, 
                remote_name
            )
            
            if not url:
                raise Exception("Falha ao obter URL do Cloudinary")

            await run_in_threadpool(
                db_update,               
                "ps_user_cards",           
                {"final_result_doc": url}, 
                {"id": candidate_id}      
            )
            
            return True
        except Exception as e:
            logger.error(f"Erro ao fazer upload do PDF para {candidate_id}: {e}")
            return False

    def load_context(self, ps_edition_id: str) -> Any:
        """Pode ser sobrescrito para carregar regras ou pesos."""
        return {}

    async def _bounded_process(self, task, context, edition_id):
        async with self.semaphore:
           result = await self._process_single_candidate(task, context, edition_id)
           await self._trigger_management_alert(edition_id, result)
           return result

    async def _process_single_candidate(self, task, context, edition_id, pdf_bytes_example: Optional[bytes] = None):
        """
        Realiza o trabalho pesado comum (I/O) e chama o método de avaliação específico.
        """
        user_id = task.get("user_id") or task.get("candidate_id")
        file_id = task.get("file_id")

        extra_data = task.get("data", {})
        course = extra_data.get("course")
        semester = extra_data.get("semester")

        try:
            if(self.is_example and pdf_bytes_example):
                pdf_bytes = pdf_bytes_example
            else:
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
            
            if(self.is_example is False):
                await self._trigger_management_alert(user_id, result)

            return result

        except Exception as e:
            logger.error(f"Erro no pipeline base para {user_id}: {e}")
            return {"success": False, "error": str(e)}

    async def evaluate_candidate(self, user_id, candidate_input, history, context, edition_id):
        """
        MÉTODO ABSTRATO: Cada Engine implementa sua lógica aqui.
        """
        raise NotImplementedError("As subclasses devem implementar isso!")

    async def _trigger_management_alert(self, candidate_id: str, result: Dict[str, Any]):
        """
        Alerta de Gestão Simplificado (Foco no Candidato).
        
        Regras:
        1. Se success == False -> Alerta CRÍTICO (Erro técnico).
        2. Se success == True mas approved == False -> Alerta WARNING (Candidato Rejeitado).
           Isso permite que a gestão tenha uma lista rápida de quem 'rodou' para eventual repescagem.
        """
        try:
            if not result.get("success"):
                error_msg = result.get("error", "Erro desconhecido na avaliação")
                await alert_service.create_alert(
                    title="❌ Falha na Avaliação",
                    message=f"A Engine não conseguiu avaliar o candidato {candidate_id}. Motivo: {error_msg}",
                    level=AlertLevel.CRITICAL,
                    source=AlertSource.BACKEND_ENGINE,
                    metadata={"candidate_id": candidate_id, "raw_result": str(result)}
                )
                return

            is_approved = result.get("approved", False)
            
            if not is_approved:
                score = result.get("predictions_raw", {}).get("global_score", 0.0)
                
                await alert_service.create_alert(
                    title="🚫 Candidato Não Selecionado",
                    message=f"O candidato {candidate_id} completou o processo mas não atingiu os critérios de corte (Score: {score:.2f}).",
                    level=AlertLevel.WARNING,
                    source=AlertSource.BACKEND_ENGINE,
                    metadata={
                        "candidate_id": candidate_id,
                        "global_score": score,
                        "report_url": result.get("report_url")
                    }
                )

            return 
        except Exception as e:
            logger.error(f"Erro ao criar alerta para {candidate_id}: {e}")