import logging
import tensorflow as tf
import numpy as np
from typing import List, Dict, Any

from app.schemas.xai import XAIAnalysisResult, FeedbackItem

logger = logging.getLogger("yawara.xai.neural")

class NeuralMathematician:
    """
    Explicador para a Engine V2 (Deep Learning).
    Utiliza Análise de Gradientes (Saliency Maps) para explicar o 'Black Box'.
    """

    @staticmethod
    def explain_prediction(
        model: tf.keras.Model,
        inputs: List[tf.Tensor],
        target_nucleus_index: int,
        target_nucleus_name: str,
        subject_names_list: List[str]
    ) -> XAIAnalysisResult:
        """
        Gera explicação baseada na sensibilidade da rede (Gradientes).
        """
        
        # 1. Cálculo do Gradiente (Sensitivity Analysis)
        # Queremos saber: d(ScoreNucleo) / d(Notas)
        # Os inputs[1] são os metadados das matérias (Nota, Carga).
        
        with tf.GradientTape() as tape:
            # Observamos o tensor de notas
            tape.watch(inputs[1]) 
            
            # Roda a predição
            predictions = model(inputs)
            
            # Pega o score do núcleo alvo
            target_score = predictions[0][target_nucleus_index]

        # Calcula o gradiente do score em relação às notas
        # Isso nos diz o "Feature Importance" local para este aluno
        grads = tape.gradient(target_score, inputs[1])
        
        # O tensor de grads tem shape (1, 100, 2). Queremos apenas a dimensão da Nota (índice 0)
        # grads[0, :, 0] -> Vetor de importância das notas
        note_importance = grads[0, :, 0].numpy()
        
        # Recupera as notas originais do input
        original_grades = inputs[1][0, :, 0].numpy() # shape (100,)

        # 2. Construção dos Dados XAI
        affinity = float(target_score) * 100.0
        status_label = "RECOMENDADO" if affinity >= 50.0 else "EM ANÁLISE"
        status_color = "#166534" if affinity >= 50.0 else "#64748B" # Verde ou Cinza
        
        # Baixa afinidade
        if affinity < 30.0: status_color = "#DC2626" 

        chart_labels = []
        chart_values = []
        full_telemetry = []
        roadmap = []

        # Iteramos sobre as matérias válidas (que têm nome)
        for i, name in enumerate(subject_names_list):
            if not name or name == "": continue
            
            grade_0_1 = original_grades[i] # Normalizado 0-1
            grade_real = grade_0_1 * 10.0
            importance = float(note_importance[i])
            
            # Adiciona ao gráfico
            chart_labels.append(name[:10].replace("_", " "))
            chart_values.append(grade_real)
            
            # Lógica de Diagnóstico Neural
            # Se a importância é alta (>0.01) e a nota é baixa (<0.6), é um gargalo
            status_feat = "NORMAL"
            
            if importance > 0.001 and grade_0_1 < 0.6:
                status_feat = "WEAKNESS"
                msg = "Matéria crítica para este núcleo. A rede indica alta sensibilidade à melhoria desta nota."
                
                roadmap.append(FeedbackItem(
                    subject=name,
                    message=msg,
                    type="WEAKNESS",
                    icon="zap" # Ícone de energia/neural
                ))
            
            full_telemetry.append({
                "feature_name": name,
                "input_value": grade_real,
                "importance_score": importance * 100, # Escala visual
                "status": status_feat
            })

        # Ordenar telemetria por importância (descendente)
        full_telemetry = sorted(full_telemetry, key=lambda x: x['importance_score'], reverse=True)
        
        # Limita gráfico aos top 8 mais importantes para não poluir
        # (Mas mantém telemetria completa na tabela)
        top_indices = np.argsort(note_importance)[-8:] # Top 8 índices
        final_chart_labels = [chart_labels[i] for i in range(len(chart_labels)) if i in top_indices]
        final_chart_values = [chart_values[i] for i in range(len(chart_values)) if i in top_indices]

        obs = (f"Análise Neural: Afinidade de {affinity:.1f}%. "
               "O sistema identificou padrões no histórico compatíveis com o perfil de sucesso deste núcleo." 
               if affinity >= 50 else 
               f"Análise Neural: Afinidade de {affinity:.1f}%. "
               "O modelo detectou gaps em competências-chave que reduzem a probabilidade de aprovação.")

        return XAIAnalysisResult(
            nucleus_name=target_nucleus_name,
            status_label=status_label,
            status_color=status_color,
            affinity_percentage=int(affinity),
            main_observation=obs,
            study_roadmap=roadmap,
            chart_labels=final_chart_labels if final_chart_labels else chart_labels[:8],
            chart_values=final_chart_values if final_chart_values else chart_values[:8],
            chart_colors=["#DC2626"],
            full_telemetry=full_telemetry
        )