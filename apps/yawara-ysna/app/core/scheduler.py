import logging
import os
from contextlib import suppress
from datetime import datetime, timedelta
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from fastapi.concurrency import run_in_threadpool
from app.training.train_canonical_subject_ml_v2 import TrainingYsnaCanonicalV2
from app.services.storage import storage_service
from app.training.train_engine_v2 import TrainingEngineV2
from app.utils.data_checker_for_training import check_entered_grades
from app.core.config import settings

logger = logging.getLogger("yawara.scheduler")

class TrainingScheduler:
    def __init__(self):
        self.scheduler = AsyncIOScheduler()
        self.scheduler.add_job(self._check_and_train_routine_engine_v2, 'cron', hour=3, minute=0) # Todo dia as 3am
        self.scheduler.add_job(self._check_and_train_routine_canonical, 'cron', hour=3, minute=0) # Todo dia as 3am
        self.scheduler.add_job(self._verify_and_download_models_file, 'cron', hour=1, minute=0) # Todo dia as 1am
        
    def start(self):
        self.scheduler.start()
        logger.info("🕒 Agendador de Treinamento iniciado.")

    async def _verify_and_download_models_file(self):
        """
        Verifica se o arquivo de modelos existe localmente. Se não existir, baixa do repositório remoto.
        """
        current_dir = os.path.dirname(os.path.abspath(__file__))
        project_root = os.path.dirname(os.path.dirname(current_dir))
        
        canonical_model = os.path.join(project_root, settings.ML_CANONICAL_WEIGHTS_PATH)
        canonical_memory = os.path.join(project_root, settings.NN_MODEL_MEMORY_FILE_PATH)
        engine_v2_model = os.path.join(project_root, settings.ML_ENGINE_2_PATH)
        engine_v2_labels = os.path.join(project_root, settings.ML_ENGINE_2_LABELS_PATH) 

        if(os.path.exists(canonical_model) and 
           os.path.exists(canonical_memory) and
           os.path.exists(engine_v2_model) and
           os.path.exists(engine_v2_labels)):
            logger.info("✅ Todos os arquivos de modelo estão presentes localmente.")
            return True
        
        if(os.path.exists(canonical_model) == False):
            logger.info("⬇️ Baixando modelo Canonical...")
            await run_in_threadpool(storage_service.download_file, local_dest=canonical_model, public_id=settings.ML_CANONICAL_WEIGHTS_ID)
        if(os.path.exists(canonical_memory) == False):
            logger.info("⬇️ Baixando memória Canonical...")
            await run_in_threadpool(storage_service.download_file, local_dest=canonical_memory, public_id=settings.NN_MODEL_MEMORY_FILE_ID)
        if(os.path.exists(engine_v2_model) == False):
            logger.info("⬇️ Baixando modelo Engine V2...")
            await run_in_threadpool(storage_service.download_file, local_dest=engine_v2_model, public_id=settings.ML_CLOUD_MODEL_NAME)
        if(os.path.exists(engine_v2_labels) == False):
            logger.info("⬇️ Baixando labels Engine V2...")
            await run_in_threadpool(storage_service.download_file, local_dest=engine_v2_labels, public_id=settings.ML_CLOUD_LABELS_NAME)


    async def _check_and_train_routine_canonical(self):
        """
        Treinamento do modelo YSNA Canonical, para integrar chamdas das LLMs dentro do modelo, se nescessário.
        """
        current_dir = os.path.dirname(os.path.abspath(__file__))
        project_root = os.path.dirname(os.path.dirname(current_dir))
        
        learned_path = os.path.join(project_root, settings.NN_MODEL_LEARNED_DATA_PATH)

        if(os.path.exists(learned_path)):
            if(os.path.getsize(learned_path) > 0):
                logger.info("💤 Modelo YSNA Canonical já treinado. Dormindo...")
                return False

        try:            
            logger.info("🚀 Iniciando treinamento YSNA Canonical...")
            trainer = TrainingYsnaCanonicalV2()
            await run_in_threadpool(trainer.train)
            
            return True
        except Exception as e:
            return False

    async def _check_and_train_routine_engine_v2(self):
        """
        Rotina diária:
        1. Estamos em época de treino? (Início de semestre: Jan/Fev ou Jul/Ago)
        2. Temos dados suficientes?
        3. Se sim -> Treina.
        4. Se não -> Apenas loga e espera o próximo ciclo (ou reagenda forçado).
        """
        now = datetime.now()
        
        is_training_season = now.month in [1, 2, 7, 8] 
        
        if not is_training_season:
            logger.info("💤 Fora da temporada de treinamento. Dormindo...")
            return

        logger.info("🕵️ Temporada de Treino detectada. Verificando dados...")
        
        has_sufficient_data = check_entered_grades()

        if not has_sufficient_data:
            logger.warning("⚠️ Dados insuficientes...")
            return
        
        logger.info("🚀 Iniciando Pipeline de Treinamento em Threadpool...")
        
        def run_sync_training():
            trainer = TrainingEngineV2()
            trainer._load_data_checkpoint()
            return trainer.pipeline_training()

        try:
            result = await run_in_threadpool(run_sync_training)
            logger.info(f"🏁 Treino finalizado. Status: {result.get('status')}")
            return result.get("success", False)
            
        except Exception as e:
            logger.error(f"❌ Erro crítico durante o treinamento agendado: {e}")
            return False

training_scheduler = TrainingScheduler()