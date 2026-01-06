import logging
from typing import Optional, Dict, Any, Union
from pydantic import BaseModel
from app.utils.db import db_select

logger = logging.getLogger("yawara.services.config")

class SystemConfigModel(BaseModel):
    """
    Modelo de Configuração Dinâmica do Sistema (Controlado via Admin).
    
    Attributes:
        engineMode (str): Modo de operação ('V1', 'V2', 'AUTO').
        minCyclesForNeural (int): Ciclos mínimos para ativar IA.
        trainingTimeBudgetMin (int): Tempo máximo de treino (minutos).
        maxEpochsPerRun (int): Épocas máximas por ciclo de treino.
        autoTrainingEnabled (bool): Se o retreino automático está ativo.
        daysBeforePsToTrain (int): Janela de segurança antes do PS para congelar modelos.
    """
    engineMode: str
    minCyclesForNeural: int
    trainingTimeBudgetMin: int
    maxEpochsPerRun: int
    autoTrainingEnabled: bool
    daysBeforePsToTrain: int

    # Campos Opcionais / UI
    showCandidateExplanation: bool = True
    feedbackDetailLevel: str = "DETAILED"
    systemMaintenanceMsg: Optional[str] = None

def get_active_config() -> SystemConfigModel:
    """
    Recupera a configuração ativa do banco de dados (Tabela `system_config`).
    
    Implementa lógica de fallback robusta para garantir que o sistema suba
    mesmo se o banco estiver inacessível ou a tabela vazia.

    Returns:
        SystemConfigModel: Objeto de configuração validado.
    """
    try:
        # Busca raw do banco
        raw_response = db_select('system_config', "*", None, True)
        
        row = _normalize_db_response(raw_response)

        if row:
            # Mapeamento Seguro com Defaults
            mapped = {
                "engineMode": row.get("engine_mode", "AUTO"),
                "minCyclesForNeural": int(row.get("min_cycles_for_neural") or 4),
                "trainingTimeBudgetMin": int(row.get("training_time_budget_min") or 30),
                "autoTrainingEnabled": bool(row.get("auto_training_enabled", True)),
                
                # Lógica de negócio crítica: Fallback para typo antigo no banco
                "maxEpochsPerRun": int(
                    row.get("max_epochs_per_run") or 
                    row.get("max_epochs_per_tun") or 
                    50
                ),
                
                "daysBeforePsToTrain": int(row.get("days_before_ps_to_train") or 7),
                
                # Extras
                "showCandidateExplanation": bool(row.get("show_candidate_explanation", True)),
                "feedbackDetailLevel": row.get("feedback_detail_level", "DETAILED"),
                "systemMaintenanceMsg": row.get("system_maintenance_msg"),
            }
            return SystemConfigModel(**mapped)

        logger.warning("⚠️ Configuração não encontrada no DB. Usando Defaults de Aplicação.")
        return _get_default_config()

    except Exception as e:
        logger.critical(f"❌ Erro crítico ao ler SystemConfig: {e}", exc_info=True)
        # Fallback de emergência (Modo V1 Seguro)
        return _get_default_config(safe_mode=True)

def _normalize_db_response(response: Any) -> Optional[Dict[str, Any]]:
    """Helper para limpar a resposta variada do conector de DB."""
    if not response:
        return None

    # Se vier envelopado em {"data": [...]}
    if isinstance(response, dict) and "data" in response:
        data = response.get("data")
        if isinstance(data, list) and data:
            return data[0]
        if isinstance(data, dict):
            return data
            
    # Se vier lista direta
    if isinstance(response, list) and response:
        return response[0]

    # Se já for o dict correto
    if isinstance(response, dict):
        return response
        
    return None

def _get_default_config(safe_mode: bool = False) -> SystemConfigModel:
    """Gera configurações padrão (ou modo de segurança em caso de falha)."""
    if safe_mode:
        return SystemConfigModel(
            engineMode="V1", # Força determinístico se banco falhar
            minCyclesForNeural=99,
            trainingTimeBudgetMin=10,
            maxEpochsPerRun=10,
            autoTrainingEnabled=False,
            daysBeforePsToTrain=7,
            systemMaintenanceMsg="Modo de Segurança Ativo - Contate Admin"
        )
    
    return SystemConfigModel(
        engineMode="AUTO",
        minCyclesForNeural=4,
        trainingTimeBudgetMin=30,
        maxEpochsPerRun=50,
        autoTrainingEnabled=True,
        daysBeforePsToTrain=7
    )