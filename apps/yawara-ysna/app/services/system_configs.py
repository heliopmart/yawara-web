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
    O db_select (no seu caso) retorna um dict representando a linha.
    """
    try:
        row = db_select('system_config', "*", None, True)

        # Caso seu db_select às vezes retorne list/dict {"data":...} também:
        if isinstance(row, dict) and "data" in row:
            data = row.get("data")
            if isinstance(data, list) and data:
                row = data[0]
            elif isinstance(data, dict):
                row = data

        if isinstance(row, list) and row:
            row = row[0]

        if isinstance(row, dict) and row:
            mapped = {
                "engineMode": row.get("engine_mode", "AUTO"),
                "minCyclesForNeural": int(row.get("min_cycles_for_neural", 4) or 4),
                "trainingTimeBudgetMin": int(row.get("training_time_budget_min", 30) or 30),
                "autoTrainingEnabled": bool(row.get("auto_training_enabled", True)),
                # trata o typo do banco:
                "maxEpochsPerRun": int(row.get("max_epochs_per_run", row.get("max_epochs_per_tun", 50)) or 50),
                "daysBeforePsToTrain": int(row.get("days_before_ps_to_train", 7) or 7),

                # extras opcionais
                "showCandidateExplanation": bool(row.get("show_candidate_explanation", True)),
                "feedbackDetailLevel": row.get("feedback_detail_level", "DETAILED"),
                "systemMaintenanceMsg": row.get("system_maintenance_msg", None),
            }
            return SystemConfigModel(**mapped)

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