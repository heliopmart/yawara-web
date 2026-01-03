import logging
import logging
import os
import json 
import numpy as np
import tensorflow as tf

from app.services.base_engine_service import BaseEngineService
from app.services.storage import storage_service
from app.core.config import settings
from app.ml.engine_v2 import get_recommender, processor
from app.utils.save_engine_predictions import save_classification_result

# --- XAI IMPORT ---
from app.ml.xai.neural_explainer import NeuralMathematician

logger = logging.getLogger("yawara.services.engine_v2_service")

class EngineV2Service(BaseEngineService):
    """
    Implementação da Engine 2 (Rede Neural).
    """

    def __init__(self):
        super().__init__(max_concurrent_tasks=3)
        self._download_artifacts()
        self.engine_nn = get_recommender()

    def _download_artifacts(self):
        """
        Baixa os artefatos do Storage (Cloudinary/AWS S3) caso não existam localmente.
        """

        model_name_id = settings.ML_CLOUD_MODEL_NAME
        label_name_id = settings.ML_CLOUD_LABELS_NAME
        local_path_engine = settings.ML_ENGINE_2_PATH
        local_path_labels = settings.ML_ENGINE_2_LABELS_PATH

        if os.path.exists(local_path_engine) and os.path.exists(local_path_labels):
            logger.info("Artefatos da Engine V2 já presentes localmente. Ignorando download.")
            return
        
        res_model = storage_service.download_file(model_name_id, local_path_engine)
        res_label = storage_service.download_file(label_name_id, local_path_labels)
        
        if res_model and res_label:
            logger.info("Artefatos da Engine V2 baixados com sucesso.")
        else:
            logger.critical("Falha ao baixar artefatos da Engine V2.")

    def load_context(self, ps_edition_id: str):
        return {"model_version": "v1.0"}
    
    async def evaluate_candidate(self, user_id, candidate_input, history, context, edition_id):
        """
        Lógica específica da V2: Predição Neural.
        """
        logger.info(f"[V2] Classificando User {user_id} com IA...")

        result = self.engine_nn.predict(candidate_input, history)

        predictions = result.get("predictions", {})
        recommended = result.get("recommended_nuclei", [])

        save_classification_result(user_id, edition_id, recommended)
        
        logger.info(f"[V2] User {user_id} classificado. Núcleos recomendados: {len(recommended)}")

        # --- 2. XAI: Neural Math (Gradient Analysis) ---
        xai_reports = []
        
        if self.engine_nn.model:
            # A. Recriar Tensores (Precisamos deles puros para o GradientTape)
            tensors_dict = processor.records_to_tensor(candidate_input, history)
            
            X_names = tensors_dict["subject_names"]
            X_meta = tensors_dict["subject_meta"]
            X_sem = tensors_dict["student_context"]
            # O processor original não retorna Course, criamos manualmente:
            X_course = np.full((1, 1), candidate_input.course.upper(), dtype=object)

            # Monta a lista de Inputs no formato exato que o modelo espera
            model_inputs = [
                tf.constant(X_names, dtype=tf.string),
                tf.convert_to_tensor(X_meta, dtype=tf.float32),
                tf.convert_to_tensor(X_sem, dtype=tf.float32),
                tf.constant(X_course, dtype=tf.string)
            ]

            # Lista de nomes das matérias
            subject_names_list = [n.decode("utf-8") if isinstance(n, bytes) else str(n) for n in X_names[0]]

            # B. Gerar Explicação para CADA Núcleo (Full Scan)
            # Sem filtro de score. Queremos saber por que foi rejeitado também.
            for idx, label in enumerate(self.engine_nn.labels):
                
                # logger.debug(f"Calculando gradientes para núcleo: {label}")
                
                explanation = NeuralMathematician.explain_prediction(
                    model=self.engine_nn.model,
                    inputs=model_inputs,
                    target_nucleus_index=idx,
                    target_nucleus_name=label,
                    subject_names_list=subject_names_list
                )
                xai_reports.append(explanation.model_dump())

        logger.info(f"[V2] Sucesso para {user_id}. Recomendados: {len(recommended)}. Relatórios XAI: {len(xai_reports)}")

        return {
            "success": True,
            "approved": recommended,
            "xai_reports": xai_reports, 
            "predictions_raw": predictions
        }
        
engine_v2_service = EngineV2Service()

if __name__ == "__main__":
    import asyncio
    asyncio.run(engine_v2_service.run_batch())