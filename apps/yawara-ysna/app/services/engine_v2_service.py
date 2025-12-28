import logging
import json 

from app.services.base_engine_service import BaseEngineService
from app.ml.engine_v2 import get_recommender
from app.utils.db_loader_trainer import save_classification_result

logger = logging.getLogger("yawara.services.engine_v2_service")

class EngineV2Service(BaseEngineService):
    """
    Implementação da Engine 2 (Rede Neural).
    """

    def __init__(self):
        super().__init__(max_concurrent_tasks=3)
        self.engine_nn = get_recommender()

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
    # Teste manual
    asyncio.run(engine_v2_service.run_batch())