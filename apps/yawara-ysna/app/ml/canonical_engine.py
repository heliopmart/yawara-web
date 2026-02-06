import tensorflow as tf
import os

from app.core.config import settings
from app.schemas.canonical import PredictResult

# ARCHITECTURE IMPORT ----------------------------
from app.ml.architectures.canonicaL_nn import YsnaCanonicalArchitecture

class YsnaCanonicalSubjectEngine:
    def __init__(self):
        self.model = YsnaCanonicalArchitecture()
        
    async def _load_models_and_data(self):
        if(not os.path.exists(settings.NN_MODEL_BASE_DATA_PATH)):
            raise FileNotFoundError(f"Base data file not found at {settings.NN_MODEL_BASE_DATA_PATH}")
        
    async def predict(self, input_data: str) -> PredictResult:  
        await self._load_models_and_data()

        result = await self.model.run_predict(input_data)
        return result

    