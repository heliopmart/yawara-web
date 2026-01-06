# app/services/alert_service.py
import logging
from enum import Enum
from typing import Dict, Optional
from datetime import datetime
from fastapi.concurrency import run_in_threadpool
from app.utils.db import db_insert

logger = logging.getLogger("yawara.services.alert")

class AlertLevel(str, Enum):
    INFO = "info"
    WARNING = "warning"
    CRITICAL = "critical"

class AlertSource(str, Enum):
    BACKEND_ENGINE = "backend_engine"
    SCHEDULER = "scheduler"
    SECURITY = "security"

class AlertService:
    """
    Serviço centralizado para gestão de alertas de sistema e negócio.
    Salva notificações na tabela 'system_alerts'.
    """

    async def create_alert(
        self, 
        title: str, 
        message: str, 
        level: AlertLevel, 
        source: AlertSource, 
        metadata: Optional[Dict] = None
    ):
        """
        Cria um alerta persistente no banco de dados de forma assíncrona.
        """
        payload = {
            "title": title,
            "message": message,
            "level": level.value,
            "source": source.value,
            "metadata": metadata or {},
            "is_read": False,
            "created_at": datetime.now().isoformat()
        }

        try:
            # db_insert geralmente é síncrono, jogamos para threadpool
            await run_in_threadpool(db_insert, "system_alerts", payload)
            logger.info(f"🔔 Alerta criado: [{level.value.upper()}] {title}")
        except Exception as e:
            # Fallback: Se o banco falhar, o log não pode falhar
            logger.error(f"❌ Falha ao persistir alerta no banco: {e} | Dados: {payload}")

alert_service = AlertService()