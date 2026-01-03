from typing import List, Dict
from app.schemas.xai import FeatureImpact, XAIAnalysisResult
from app.schemas.engine_v1 import NucleusEligibilityResult

class DeterministicMathematician:
    """
    Responsável por extrair insights matemáticos da Engine V1 (Baseada em Regras).
    Converte o cálculo linear simples em métricas de explicabilidade.
    """

    @staticmethod
    def explain(result: NucleusEligibilityResult) -> XAIAnalysisResult:
        """
        Analisa o resultado de elegibilidade e gera um relatório matemático de impacto.

        A lógica determinística permite calcular com precisão exata o 'Gap' (o quanto faltou)
        para cada matéria, algo impossível de fazer com certeza em redes neurais.

        Args:
            result (NucleusEligibilityResult): O objeto cru retornado pela engine_v1.

        Returns:
            XAIAnalysisResult: Estrutura padronizada de XAI pronta para renderização.
        """
        
        features: List[FeatureImpact] = []
        
        # 1. Calcular o peso total para normalização (Relative Influence)
        # Na V1, a soma dos pesos dita o universo total do núcleo.
        total_weight_mass = sum(item.nucleus_weight for item in result.breakdown)
        
        # Evita divisão por zero
        if total_weight_mass == 0:
            total_weight_mass = 1.0

        for item in result.breakdown:
            # Cálculo de Potenciais
            current_contribution = item.partial_score  # Nota * Peso
            max_potential = item.nucleus_weight * 10.0 # Se tirasse 10
            gap = max_potential - current_contribution
            
            rel_influence = item.nucleus_weight / total_weight_mass

            # Classificação Semântica (Heurística Simples)
            status = "NORMAL"
            grade = item.candidate_grade
            if grade >= 8.0:
                status = "MUITO BOM"
            elif grade < 5.0 and item.nucleus_weight > 1.0:
                status = "MELHORAR"

            feature = FeatureImpact(
                feature_name=item.subject,
                input_value=grade,
                importance_score=current_contribution,
                relative_influence=round(rel_influence, 4),
                potential_gain=round(gap, 2),
                status=status
            )
            features.append(feature)

        # Ordenar: As maiores fraquezas primeiro (para o aluno ver onde estudar)
        # Ordenamos por GAP decrescente (onde ele perdeu mais ponto)
        features.sort(key=lambda x: x.potential_gain, reverse=True)

        return XAIAnalysisResult(
            engine_type="V1_DETERMINISTIC",
            target_nucleus=result.nucleus_name,
            final_score=result.total_score,
            threshold=result.baseline_score,
            features_analysis=features
        )