"""
Módulo Y-TSE (Yawara Topological Scoring Engine) - Versão 1.

Core matemático determinístico para avaliação de candidatos baseada em vetores de competência.
"""

import logging
from typing import List, Dict

# Importamos os schemas
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
    Engine de Avaliação Topológica (Determinística).
    
    Conceito:
        Trata o histórico escolar e os requisitos dos núcleos como vetores no espaço R^n.
        A elegibilidade é calculada via produto escalar ponderado (Dot Product) comparado
        a um limiar dinâmico (Dynamic Threshold).
    
    Features:
        - Otimização de Histórico (escolhe a maior nota entre repetições).
        - Baseline Dinâmico (Régua de corte baseada em porcentagem do total possível).
    """

    def process_candidate_eligibility(
        self, 
        candidate_history: List[SubjectRecord],
        nuclei_contexts: List[NucleusRequirementsInput]
    ) -> List[NucleusEligibilityResult]:
        """
        Processa a elegibilidade de um candidato contra múltiplos núcleos.

        Args:
            candidate_history: Lista bruta de disciplinas vindas do PDF.
            nuclei_contexts: Lista de configurações/pesos de cada núcleo.

        Returns:
            List[NucleusEligibilityResult]: Resultados detalhados por núcleo.
        """
        
        # 1. Otimização: Transforma List[SubjectRecord] em Dict[str, float]
        # Remove reprovações antigas e mantém a maior nota.
        student_grades_map = optimize_student_history(candidate_history)
        
        results = []

        # 2. Loop de Avaliação Vetorial
        for nucleus in nuclei_contexts:
            try:
                result = self._evaluate_single_nucleus(student_grades_map, nucleus)
                results.append(result)
            except Exception as e:
                logger.error(f"Erro ao calcular núcleo {nucleus.nucleus_name}: {e}")
                # Em caso de erro matemático em um núcleo, pulamos para não invalidar o candidato todo
                continue

        return results

    def _evaluate_single_nucleus(
        self, 
        student_grades: Dict[str, float], 
        nucleus: NucleusRequirementsInput
    ) -> NucleusEligibilityResult:
        """
        Calcula o Score Topológico para um único núcleo.

        Lógica do Baseline Dinâmico:
            O `baseline_score` do núcleo é tratado como uma Porcentagem de Rigor (0-100).
            O corte real (Cut-off) é: (Soma dos Pesos * 10) * (Porcentagem / 100).
            Isso permite adicionar disciplinas ao núcleo sem precisar recalcular a nota de corte manualmente.

        Args:
            student_grades: Mapa { 'disciplina_normalizada': nota }.
            nucleus: Objeto contendo os pesos e o rigor do núcleo.

        Returns:
            NucleusEligibilityResult: Veredito e memória de cálculo.
        """
        
        total_score = 0.0
        # O Score Máximo é se o aluno tirasse 10 em todas as matérias exigidas
        max_possible_score = sum(nucleus.weights.values()) * 10.0
        breakdown = []
        
        for subject_needed, weight in nucleus.weights.items():
            # Normalização da chave (lowercase, strip) para garantir o match
            subject_key = subject_needed.lower().strip()
            
            # Busca nota (0.0 se não cursou / não encontrado no histórico otimizado)
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
        
        # --- CÁLCULO DO PISO DINÂMICO ---
        # Rigor do Banco (Exemplo): 60.0 -> 0.6 (60%)
        rigor_percentage = nucleus.baseline_score / 100.0
        
        # Safety: Rigor mínimo de 50% se vier zerado
        if rigor_percentage <= 0:
            rigor_percentage = 0.5

        dynamic_cut_off = round(max_possible_score * rigor_percentage, 2)

        is_eligible = total_score >= dynamic_cut_off
        
        return NucleusEligibilityResult(
            nucleus_id=nucleus.nucleus_id,
            nucleus_name=nucleus.nucleus_name,
            is_eligible=is_eligible,
            total_score=total_score,
            baseline_score=dynamic_cut_off,
            breakdown=breakdown
        )

# Instância Singleton exportada
y_tse = YTSE_TopologicalEngine()