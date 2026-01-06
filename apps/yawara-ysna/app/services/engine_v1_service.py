import logging
import asyncio
from typing import Optional, List, Dict, Any
from fastapi.concurrency import run_in_threadpool

# ML Logger
from app.utils.ml_logger import ml_logger

# Classe Base
from app.services.base_engine_service import BaseEngineService

# Serviços e Utils
from app.services.selection_data import data_service
from app.utils.save_engine_predictions import save_classification_result

# Engine Lógica (Math Core)
from app.ml.engine_v1 import y_tse

# XAI
from app.ml.xai.deterministic_explainer import DeterministicMathematician
from app.schemas.xai import XAIAnalysisResult

logger = logging.getLogger("yawara.services.engine_v1_service")

class EngineV1Service(BaseEngineService):
    """
    Orquestrador da Estratégia Determinística (V1).
    
    Responsabilidade:
        Executar a avaliação de candidatos baseada estritamente em regras matemáticas (álgebra linear).
        Ideal para fases de 'Cold Start' ou para auditoria de compliance.

    Inherits From:
        BaseEngineService: Fornece a interface padrão `run_single`.
    """

    def load_context(self, ps_edition_id: str) -> Optional[List[Any]]:
        """
        Carrega as regras de negócio (pesos dos núcleos) do banco de dados.
        
        Args:
            ps_edition_id (str): ID da edição do processo seletivo.

        Returns:
            Optional[List[NucleusRequirementsInput]]: Lista de regras ou None se falhar.
        """
        nuclei_rules = data_service.get_nuclei_configuration(ps_edition_id)
        if not nuclei_rules:
            logger.error(f"Abortando V1: Nenhuma configuração de núcleo encontrada para {ps_edition_id}.")
            return None
        return nuclei_rules

    async def evaluate_candidate(
        self, 
        user_id: str, 
        candidate_input: Any, 
        history: List[Any], 
        context: List[Any], 
        edition_id: str
    ) -> Dict[str, Any]:
        """
        Executa a avaliação de um único candidato.

        Fluxo:
        1. Cálculo Matemático (Y-TSE) -> CPU Bound.
        2. Explicação (XAI) -> CPU Bound.
        3. Persistência (Logs/Resultados) -> IO Bound (Threadpool).

        Args:
            user_id (str): ID do candidato.
            candidate_input (Any): Dados cadastrais (não usado na V1, mas mantido pela interface).
            history (List[SubjectRecord]): Histórico escolar estruturado.
            context (List[NucleusRequirementsInput]): Regras dos núcleos carregadas via load_context.
            edition_id (str): ID do ciclo seletivo.

        Returns:
            Dict[str, Any]: Dicionário com flags de sucesso, núcleos aprovados e relatórios XAI.
        """
        try:
            nuclei_rules = context
            if not nuclei_rules:
                return {"success": False, "error": "Contexto vazio (sem regras)"}

            # 1. Math Core: Processamento Vetorial (Rápido, mas CPU-bound)
            # Como é álgebra simples, pode rodar na thread principal, mas
            # se o histórico for gigante, considere run_in_threadpool.
            eligibility_results = y_tse.process_candidate_eligibility(
                candidate_history=history,
                nuclei_contexts=nuclei_rules
            )

            # 2. XAI: Gerar Explicação Matemática
            xai_reports: List[Dict] = []
            for result in eligibility_results:
                analysis: XAIAnalysisResult = DeterministicMathematician.explain(result)
                xai_reports.append(analysis.model_dump())

            # 3. Persistência (IO Bound - OTIMIZAÇÃO AQUI)
            # Logging e Salvamento no BD não devem travar a resposta da API.
            await run_in_threadpool(
                ml_logger.log_decision_batch,
                candidate_id=user_id,
                ps_edition_id=edition_id,
                history=history,
                results=eligibility_results,
                nuclei_configs=nuclei_rules
            )

            # Filtra aprovados
            approved_nuclei = [r.nucleus_name for r in eligibility_results if r.is_eligible]
            
            await run_in_threadpool(
                save_classification_result,
                user_id, 
                edition_id, 
                approved_nuclei
            )
            
            logger.info(f"V1 Verdict | User {user_id} | Approved: {len(approved_nuclei)} nuclei.")
            
            return {
                "success": True,
                "approved": approved_nuclei,
                "xai_reports": xai_reports
            }

        except Exception as e:
            logger.error(f"Erro crítico na Engine V1 para User {user_id}: {str(e)}", exc_info=True)
            return {"success": False, "error": str(e)}

engine_v1_service = EngineV1Service()

if __name__ == "__main__":
    # Teste manual rápido via CLI
    asyncio.run(engine_v1_service.run_batch())