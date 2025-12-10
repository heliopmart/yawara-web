import logging
from typing import List

# Importamos o schema oficial
from app.schemas.historic import SubjectRecord

from app.schemas.engine_v1 import (
    NucleusRequirementsInput, 
    NucleusEligibilityResult, 
    ScoreBreakdownItem
)
from app.utils.academic_math import optimize_student_history

logger = logging.getLogger("yawara.ml.engine_v1")

class YTSE_TopologicalEngine:
    """
    Y-TSE (Yawara Topological Scoring Engine) - Engine v1
    """

    def process_candidate_eligibility(
        self, 
        candidate_history: List[SubjectRecord],
        nuclei_contexts: List[NucleusRequirementsInput]
    ) -> List[NucleusEligibilityResult]:
        """
        Avalia um único candidato contra todos os núcleos disponíveis.
        """
        
        # 1. Otimização: Transforma List[SubjectRecord] em Dict[str, float]
        student_grades_map = optimize_student_history(candidate_history)
        
        results = []

        # 2. Loop de Avaliação
        for nucleus in nuclei_contexts:
            try:
                result = self._evaluate_single_nucleus(student_grades_map, nucleus)
                results.append(result)
            except Exception as e:
                logger.error(f"Erro ao processar núcleo {nucleus.nucleus_name}: {str(e)}")
                continue

        return results

    def _evaluate_single_nucleus(
        self, 
        student_grades: dict, 
        nucleus: NucleusRequirementsInput
    ) -> NucleusEligibilityResult:
        """
        Cálculo vetorial determinístico.
        """
        total_score = 0.0
        breakdown = []
        
        for subject_needed, weight in nucleus.weights.items():
            subject_key = subject_needed.lower().strip()
            
            # Busca nota (0.0 se não cursou)
            student_grade = student_grades.get(subject_key, 0.0)
            
            partial_score = student_grade * weight
            total_score += partial_score
            
            breakdown.append(ScoreBreakdownItem(
                subject=subject_needed,
                candidate_grade=student_grade,
                nucleus_weight=weight,
                partial_score=partial_score
            ))

        total_score = round(total_score, 4)
        is_eligible = total_score >= nucleus.baseline_score
        
        logger.info(
            f"Y-TSE Verdict | Nucleus: {nucleus.nucleus_name} | "
            f"Score: {total_score}/{nucleus.baseline_score} | "
            f"Eligible: {is_eligible}"
        )

        return NucleusEligibilityResult(
            nucleus_id=nucleus.nucleus_id,
            nucleus_name=nucleus.nucleus_name,
            is_eligible=is_eligible,
            total_score=total_score,
            baseline_score=nucleus.baseline_score,
            breakdown=breakdown
        )

# Instância exportada
y_tse = YTSE_TopologicalEngine()