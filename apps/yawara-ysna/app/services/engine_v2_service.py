import logging
import os
import json 

from app.services.base_engine_service import BaseEngineService
from app.services.storage import storage_service
from app.core.config import settings
from app.ml.engine_v2 import get_recommender
from app.utils.db_loader_trainer import save_classification_result

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

        print(json.dumps(result, indent=2))

        predictions = result.get("predictions", {})

        save_classification_result(user_id, result["predictions"])
        
        print(json.dumps(predictions, indent=2))
        print(f"[V2] Resultado para {user_id}: {result['recommended_nuclei']}")

engine_v2_service = EngineV2Service()

if __name__ == "__main__":
    import asyncio
    asyncio.run(engine_v2_service.run_batch())