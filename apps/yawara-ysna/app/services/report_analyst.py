import logging
from typing import List, Dict, Any

from app.schemas.report import CandidateReportBundle, NucleusReportContext
from app.schemas.xai import XAIAnalysisResult

logger = logging.getLogger("yawara.services.analyst")

class ReportAnalystService:
    """
    Serviço de Análise Pedagógica e Consolidação de Relatórios.

    Responsabilidade:
        Receber os dados técnicos brutos das Engines (V1/V2) e transformá-los
        em um 'Bundle' narrativo e visual para o candidato.
    
    Funcionalidades:
        1. Cálculo de Afinidade Global (Média Ponderada).
        2. Definição de Arquétipo (Ex: "Analista em Potencial" vs "Estudante em Formação").
        3. Normalização de dados para o Template.
    """

    def create_bundle(
        self, 
        candidate_data: Dict, 
        engine_result: Dict
    ) -> CandidateReportBundle:
        """
        Fábrica principal do relatório.
        """
        try:
            candidate_id = candidate_data.get("user_id", "Unknown")
            # Tenta pegar nome do input, senão usa ID
            candidate_name = getattr(candidate_data.get("input_obj"), "name", f"Candidato {candidate_id[:8]}")

            # Recupera os relatórios XAI gerados pela Engine
            xai_reports_dicts = engine_result.get("xai_reports", [])
            
            # Converte de dict para objetos Pydantic se necessário
            nuclei_contexts: List[NucleusReportContext] = []
            
            total_affinity = 0.0
            
            for report in xai_reports_dicts:
                # O XAIAnalysisResult já herda de NucleusReportContext, então a conversão é direta
                # Se vier como dict, instanciamos. Se já for objeto, usamos.
                if isinstance(report, dict):
                    context = NucleusReportContext(**report)
                else:
                    context = report
                
                nuclei_contexts.append(context)
                total_affinity += context.affinity_percentage

            # Cálculo do Diagnóstico Global
            avg_affinity = 0.0
            if nuclei_contexts:
                avg_affinity = total_affinity / len(nuclei_contexts)

            overall_obs = self._generate_overall_diagnosis(avg_affinity)

            return CandidateReportBundle(
                candidate_name=candidate_name,
                candidate_id=candidate_id,
                overall_observation=overall_obs,
                nuclei_reports=nuclei_contexts
            )

        except Exception as e:
            logger.error(f"Erro ao criar bundle para {candidate_data.get('user_id')}: {e}", exc_info=True)
            # Retorna um bundle de erro para não travar o frontend
            return self._create_error_bundle(candidate_data.get("user_id", "Unknown"))

    def _generate_overall_diagnosis(self, avg_affinity: float) -> str:
        """Gera o texto do 'Diagnóstico do Sistema' baseado na média global."""
        
        if avg_affinity >= 80.0:
            return (
                f"O candidato apresenta um perfil classificado como ANALISTA EM POTENCIAL. "
                f"Possui base teórica sólida, com média global de afinidade técnica de {avg_affinity:.1f}%. "
                "Recomendado para desafios de alta complexidade nos núcleos aprovados."
            )
        elif avg_affinity >= 50.0:
            return (
                f"O candidato apresenta um perfil classificado como DESENVOLVEDOR JUNIOR. "
                f"A média global de {avg_affinity:.1f}% indica bom potencial, mas existem lacunas "
                "técnicas pontuais que exigirão dedicação extra no onboarding."
            )
        else:
            return (
                f"O candidato apresenta um perfil classificado como ESTUDANTE EM FORMAÇÃO. "
                f"Ainda em fase inicial de construção de competências (Média: {avg_affinity:.1f}%). "
                "O foco deve ser o fortalecimento das disciplinas de ciclo básico antes de avançar "
                "para especializações técnicas profundas."
            )

    def _create_error_bundle(self, candidate_id: str) -> CandidateReportBundle:
        return CandidateReportBundle(
            candidate_name="Erro na Geração",
            candidate_id=candidate_id,
            overall_observation="Não foi possível processar os dados deste candidato devido a uma inconsistência técnica.",
            nuclei_reports=[]
        )

report_analyst_service = ReportAnalystService()

# --- ALIAS DE RETROCOMPATIBILIDADE ---
report_analyst = report_analyst_service