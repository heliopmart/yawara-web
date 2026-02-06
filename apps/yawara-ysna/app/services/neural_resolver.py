import logging
from typing import Dict, Any

# CONFIGS IMPORT
from app.core.config import settings

# ML ARCHITECTURE IMPORT 
from app.ml.canonical_engine import YsnaCanonicalSubjectEngine

# SERVICES
from app.services.storage import storage_service

logger = logging.getLogger("yawara.services.resolver")

class DynamicNeuralResolver:
    """
    Orquestrador Híbrido: Neural Search + LLM Fallback.
    
    Otimizado para Alta Concorrência (Async/Non-blocking).
    """

    _instance = None

    def __init__(self):
        self.model = YsnaCanonicalSubjectEngine()

    # =========================================================================
    # CORE PIPELINE (ASYNC)
    # =========================================================================

    async def resolve(self, raw_input: str) -> Dict[str, Any]:
        res = await self.model.predict(raw_input)

        # print("Resolvedor Neural retornou:", res)
        # print("canonical: ", res.canonical_id)
        # print("confidence: ", res.decision_scores)
        # print("status: ", res.status)

        return {
            "canonical": res.canonical_id,
            "confidence": 1,
            "status": res.status
        }

def get_resolver() -> DynamicNeuralResolver:
    """Singleton Factory."""
    if DynamicNeuralResolver._instance is None:
        DynamicNeuralResolver._instance = DynamicNeuralResolver()
    return DynamicNeuralResolver._instance