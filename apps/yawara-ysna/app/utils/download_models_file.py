from app.services.storage import storage_service
from app.core.config import settings
from starlette.concurrency import run_in_threadpool
import logging
import os

logger = logging.getLogger("yawara.models.download")
async def verify_and_download_models_file():
    """
    Verifica se o arquivo de modelos existe localmente. Se não existir, baixa do repositório remoto.
    """
    
    engine_v2_model = settings.ML_ENGINE_2_PATH
    engine_v2_labels = settings.ML_ENGINE_2_LABELS_PATH

    if(os.path.exists(engine_v2_model) and
        os.path.exists(engine_v2_labels)):
        logger.info("✅ Todos os arquivos de modelo estão presentes localmente.")
        return True
    
    if(os.path.exists(engine_v2_model) == False):
        logger.info("⬇️ Baixando modelo Engine V2...")
        await run_in_threadpool(storage_service.download_file, local_dest=engine_v2_model, remote_name=settings.ML_CLOUD_MODEL_NAME)
    if(os.path.exists(engine_v2_labels) == False):
        logger.info("⬇️ Baixando labels Engine V2...")
        await run_in_threadpool(storage_service.download_file, local_dest=engine_v2_labels, remote_name=settings.ML_CLOUD_LABELS_NAME)
