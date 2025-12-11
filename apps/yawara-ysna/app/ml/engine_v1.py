"""
Módulo Y-TSE (Yawara Topological Scoring Engine) - Versão 1.

Este módulo implementa a lógica determinística de avaliação de candidatos.
Diferente de modelos estocásticos (IA), esta engine opera baseada em regras matemáticas
estritas (álgebra linear simples), garantindo transparência e rastreabilidade total
nos primeiros ciclos do processo seletivo (Cold Start).

Conceitos Chave:
    - **Topological Scoring:** O candidato é tratado como um vetor de notas. O núcleo é um vetor de pesos.
      A elegibilidade é o produto escalar projetado sobre um limiar de corte.
    - **Dynamic Baseline:** A nota de corte não é fixa. Ela é calculada dinamicamente como
      uma porcentagem do potencial máximo do núcleo. Isso permite adicionar matérias ao núcleo
      sem "quebrar" a régua de aprovação.

Exemplo de Uso:
    ```python
    engine = YTSE_TopologicalEngine()
    results = engine.process_candidate_eligibility(historico, regras_nucleos)
    ```
"""

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
    Engine de Avaliação Topológica (v1).
    
    Responsável por cruzar o histórico acadêmico de um candidato com os requisitos
    de múltiplos núcleos e determinar a elegibilidade baseada em um Piso de Competência (Rigor).
    """

    def process_candidate_eligibility(
        self, 
        candidate_history: List[SubjectRecord],
        nuclei_contexts: List[NucleusRequirementsInput]
    ) -> List[NucleusEligibilityResult]:
        """
        Processa a elegibilidade de um candidato para uma lista de núcleos alvo.

        O método primeiro otimiza o histórico do aluno (removendo reprovações e normalizando nomes),
        e então itera sobre cada núcleo aplicando a função de avaliação vetorial.

        Args:
            candidate_history (List[SubjectRecord]): Lista bruta de disciplinas extraídas do PDF.
            nuclei_contexts (List[NucleusRequirementsInput]): Lista de regras de núcleos (pesos e configurações).

        Returns:
            List[NucleusEligibilityResult]: Lista contendo o veredito (Aprovado/Reprovado) 
            e o detalhamento de pontuação para cada núcleo solicitado.
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
        Realiza o cálculo vetorial determinístico para um único núcleo.

        Lógica do Baseline Dinâmico:
        O campo `nucleus.baseline_score` vindo do banco é interpretado como uma **Porcentagem de Rigor**
        (ex: 60.0 significa 60%). O Score de Corte (Cut-off) é calculado multiplicando essa
        porcentagem pelo Score Máximo Possível daquele núcleo.

        Args:
            student_grades (dict): Mapa otimizado { 'materia_canon': nota }.
            nucleus (NucleusRequirementsInput): Regras do núcleo (pesos e rigor).

        Returns:
            NucleusEligibilityResult: Objeto contendo o score total, o baseline calculado,
            o veredito booleano e a memória de cálculo (breakdown).
        """
        
        total_score = 0.0
        max_possible_score = sum(nucleus.weights.values()) * 10.0
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
        
        # --- LÓGICA DO PISO DINÂMICO (Database Driven) ---
        # Usamos o valor do banco (nucleus.baseline_score) como a PORCENTAGEM DE CORTE.
        # Ex: Se no banco está 60.0, significa que exigimos 60% do potencial máximo.
        # Isso permite ajustar a régua (50%, 70%) pelo Supabase sem mexer no código.
        
        rigor_percentage = nucleus.baseline_score / 100.0
        
        # Trava de segurança: Se o banco estiver zerado/nulo, assume 50% (0.5)
        if rigor_percentage <= 0:
            rigor_percentage = 0.5

        # O Score de Corte (Cut-off) se adapta ao tamanho do núcleo
        dynamic_cut_off = round(max_possible_score * rigor_percentage, 2)

        is_eligible = total_score >= dynamic_cut_off
        
        logger.info(
            f"Y-TSE Verdict | Nucleus: {nucleus.nucleus_name} | "
            f"Score: {total_score}/{dynamic_cut_off} | "
            f"Eligible: {is_eligible}"
        )

        return NucleusEligibilityResult(
            nucleus_id=nucleus.nucleus_id,
            nucleus_name=nucleus.nucleus_name,
            is_eligible=is_eligible,
            total_score=total_score,
            baseline_score=dynamic_cut_off,
            breakdown=breakdown
        )

# Instância exportada
y_tse = YTSE_TopologicalEngine()