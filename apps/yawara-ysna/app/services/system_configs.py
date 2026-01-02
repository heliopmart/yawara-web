# app/services/system_config.py
from app.utils.db import db_select
from pydantic import BaseModel
from typing import Optional

class SystemConfigModel(BaseModel):
    engineMode: str
    minCyclesForNeural: int
    trainingTimeBudgetMin: int
    maxEpochsPerRun: int
    autoTrainingEnabled: bool
    daysBeforePsToTrain: int

def get_active_config() -> SystemConfigModel:
    """
    Busca a configuração ativa (Singleton).
    Se não existir, retorna um default seguro para não quebrar o sistema.
    """
    try:
        # Pega a primeira linha (presumindo que só existe uma ou queremos a mais recente)
        response = db_select('system_configs', "*", None, limit=1)
        
        if response.data and len(response.data) > 0:
            return SystemConfigModel(**response.data[0])
        
        print("⚠️ AVISO: Configuração não encontrada no DB. Usando Defaults.")
        return SystemConfigModel(
            engineMode="AUTO",
            minCyclesForNeural=4,
            trainingTimeBudgetMin=30,
            maxEpochsPerRun=50,
            autoTrainingEnabled=True,
            daysBeforePsToTrain=7
        )
    except Exception as e:
        print(f"❌ Erro crítico ao ler SystemConfig: {e}")
        return SystemConfigModel(
            engineMode="V1",
            minCyclesForNeural=99,
            trainingTimeBudgetMin=10,
            maxEpochsPerRun=10,
            autoTrainingEnabled=False, 
            daysBeforePsToTrain=7
        )