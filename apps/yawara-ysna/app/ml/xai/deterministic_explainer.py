import logging
from typing import List, Dict
from app.schemas.engine_v1 import NucleusEligibilityResult, ScoreBreakdownItem
from app.schemas.xai import XAIAnalysisResult, FeedbackItem

logger = logging.getLogger("yawara.xai.deterministic")

class DeterministicMathematician:
    """
    Explicador para a Engine V1 (Baseada em Regras/Topológica).
    Traduz vetores e produtos escalares em feedback pedagógico.
    """

    @staticmethod
    def explain(result: NucleusEligibilityResult) -> XAIAnalysisResult:
        """
        Converte o resultado bruto da Engine V1 em um relatório XAI rico.
        """
        
        # 1. Cálculo de Afinidade (Porcentagem do Score obtido vs Score Máximo Possível)
        # O baseline_score é o corte, mas queremos saber o quão longe ele foi no total.
        # Max Score = Soma dos pesos * 10.
        # Estimamos o max score reverso baseando-se no breakdown.
        total_weight = sum([item.nucleus_weight for item in result.breakdown])
        max_possible = total_weight * 10.0
        
        affinity = 0.0
        if max_possible > 0:
            affinity = (result.total_score / max_possible) * 100.0
        
        # Trava visual
        affinity = min(max(affinity, 0.0), 100.0)

        # 2. Status Visual
        status_label = "APROVADO" if result.is_eligible else "EM DESENVOLVIMENTO"
        status_color = "#166534" if result.is_eligible else "#DC2626" # Verde ou Vermelho Yawara

        # 3. Construção do Roadmap (Feedback)
        roadmap: List[FeedbackItem] = []
        chart_labels = []
        chart_values = []
        full_telemetry = []

        # Ordenar por impacto (maior peso primeiro)
        sorted_breakdown = sorted(result.breakdown, key=lambda x: x.nucleus_weight, reverse=True)

        for item in sorted_breakdown:
            # Gráfico de Radar (Labels e Valores)
            # Normalizamos a nota (0-10) para o gráfico
            chart_labels.append(item.subject[:15]) # Corta nomes gigantes
            chart_values.append(item.candidate_grade)

            # Telemetria (Tabela Completa)
            telemetry_status = "NORMAL"
            impact_score = item.partial_score
            
            # Lógica de Feedback: Se nota baixa em matéria de alto peso
            if item.candidate_grade < 6.0:
                telemetry_status = "WEAKNESS"
                
                # Feedback Pedagógico
                msg = f"Nota {item.candidate_grade:.1f} abaixo do esperado para o peso {item.nucleus_weight}."
                roadmap.append(FeedbackItem(
                    subject=item.subject,
                    message=msg,
                    type="WEAKNESS",
                    icon="alert-circle"
                ))

            full_telemetry.append({
                "feature_name": item.subject,
                "input_value": item.candidate_grade,
                "importance_score": impact_score,
                "status": telemetry_status
            })

        # 4. Observação Geral (Main Observation)
        if result.is_eligible:
            obs = (f"Candidato atingiu os critérios topológicos do núcleo com {affinity:.1f}% de afinidade. "
                   "Perfil compatível com as exigências técnicas atuais.")
        else:
            obs = (f"Afinidade técnica de {affinity:.1f}%. Necessário reforço nas disciplinas listadas "
                   "abaixo para atingir o limiar de corte dinâmico.")

        return XAIAnalysisResult(
            nucleus_name=result.nucleus_name,
            status_label=status_label,
            status_color=status_color,
            affinity_percentage=int(affinity),
            main_observation=obs,
            study_roadmap=roadmap,
            chart_labels=chart_labels,
            chart_values=chart_values,
            chart_colors=["#DC2626"],
            full_telemetry=full_telemetry
        )