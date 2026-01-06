import logging
from datetime import datetime, timedelta
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from fastapi.concurrency import run_in_threadpool
from app.utils.db_loader_trainer import fetch_training_dataset_chunk
from app.training.train_engine_v2 import TrainingEngineV2
from app.utils.data_checker_for_training import check_entered_grades
from app.core.config import settings

logger = logging.getLogger("yawara.scheduler")

class TrainingScheduler:
    def __init__(self):
        self.scheduler = AsyncIOScheduler()
        self.scheduler.add_job(self._check_and_train_routine, 'cron', hour=3, minute=0) # Todo dia as 3am
        
    def start(self):
        self.scheduler.start()
        logger.info("🕒 Agendador de Treinamento iniciado.")

    async def _check_and_train_routine(self):
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