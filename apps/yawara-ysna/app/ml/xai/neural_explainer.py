import logging
import tensorflow as tf
import numpy as np
from typing import List, Dict, Any

from app.schemas.xai import XAIAnalysisResult, FeatureImpact

logger = logging.getLogger("yawara.ml.xai.neural")

class NeuralMathematician:
    """
    XAI Component for Engine V2 (Neural Network).
    Uses Gradient-based Saliency Maps to determine feature importance.
    Agora com NORMALIZAÇÃO DINÂMICA para evitar Vanishing Gradients.
    """

    @staticmethod
    def explain_prediction(
        model: tf.keras.Model,
        inputs: List[tf.Tensor],
        target_nucleus_index: int,
        target_nucleus_name: str,
        subject_names_list: List[str]
    ) -> XAIAnalysisResult:
        
        # Unpack inputs (meta tensor is at index 1)
        x_meta_tensor = tf.convert_to_tensor(inputs[1]) # Shape: (1, 100, 2)
        
        # 1. Gradient Calculation
        with tf.GradientTape() as tape:
            tape.watch(x_meta_tensor)
            
            # Reconstruct input list with watched tensor
            watched_inputs = [inputs[0], x_meta_tensor, inputs[2], inputs[3]]
            
            # Forward Pass
            predictions = model(watched_inputs)
            target_score = predictions[0, target_nucleus_index]

        # Backward Pass (Derivatives)
        gradients = tape.gradient(target_score, x_meta_tensor)
        
        # 2. Process Gradients (Input * Gradient)
        grads_val = gradients.numpy()[0, :, 0] 
        inputs_val = x_meta_tensor.numpy()[0, :, 0] # Normalized grades (0-1)

        # --- CORREÇÃO: DYNAMIC SCALING ---
        # Encontra o maior gradiente absoluto para usar como referência (1.0)
        # Isso resolve o problema de scores muito baixos gerarem explicações zeradas.
        max_grad = np.max(np.abs(grads_val))
        
        # Evita divisão por zero se a rede estiver morta (todos grads = 0)
        scale_factor = 1.0 / max_grad if max_grad > 1e-9 else 1.0

        features: List[FeatureImpact] = []
        
        for i, subject_name in enumerate(subject_names_list):
            if not subject_name: continue 
            
            raw_grad = float(grads_val[i])
            grade_norm = float(inputs_val[i])
            real_grade = grade_norm * 10.0
            
            # Normalizamos o gradiente para a escala humana (0 a 1.0 relativo ao maior impacto)
            # Se raw_grad era 0.0003 e era o maior, agora scaled_grad vira 1.0
            scaled_grad = raw_grad * scale_factor
            
            # Importance = Scaled Gradient * Value
            # Representa o quanto a nota atual contribuiu para o score
            importance = scaled_grad * grade_norm
            
            # Potential Gain = (Max_Grade - Current_Grade) * Scaled Gradient
            # Representa o potencial pedagógico real
            potential_gain = (1.0 - grade_norm) * scaled_grad
            
            # Semantic Classification
            status = "NORMAL"
            
            # Ajustamos os limiares para a nova escala normalizada
            if importance > 0.4: 
                status = "STRENGTH" # Matéria forte
            elif scaled_grad > 0.4 and grade_norm < 0.6:
                # Se o gradiente é alto (rede quer isso) mas a nota é baixa
                status = "WEAKNESS" 

            # Filtro de ruído: Se o impacto for muito irrelevante, ignoramos ou marcamos normal
            # (Opcional: você pode descomentar para limpar o JSON)
            # if abs(scaled_grad) < 0.05: continue

            features.append(FeatureImpact(
                feature_name=subject_name,
                input_value=round(real_grade, 2),
                
                # Valores agora são relativos (0-1 ou um pouco mais), fáceis de ler num gráfico
                importance_score=round(importance, 4),
                relative_influence=0.0, # Será recalculado abaixo
                
                # Só mostramos ganho positivo. Se grad for negativo (rede penalizando nota alta?), zeramos.
                potential_gain=round(max(0.0, potential_gain), 4),
                status=status
            ))

        # 3. Normalize Relative Influence (Percentual do Bolo)
        total_importance = sum(abs(f.importance_score) for f in features) or 1.0
        for f in features:
            f.relative_influence = round(abs(f.importance_score) / total_importance, 4)

        # Ordenação Pedagógica: Prioridade para o que dá mais ganho (Estude isso!)
        features.sort(key=lambda x: x.potential_gain, reverse=True)

        return XAIAnalysisResult(
            engine_type="V2_NEURAL_GRADIENT",
            target_nucleus=target_nucleus_name,
            final_score=float(target_score),
            threshold=0.5,
            features_analysis=features
        )