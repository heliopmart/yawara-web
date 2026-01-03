import logging
from typing import Optional, Dict, Any

from app.services.system_configs import get_active_config
from app.utils.db import db_select

# Importamos os SERVIÇOS, não apenas os modelos
from app.services.engine_v1_service import engine_v1_service
from app.services.engine_v2_service import engine_v2_service

logger = logging.getLogger("yawara.ml.pipeline")

class SelectionPipeline:
    def __init__(self):
        pass

    def get_count_completed_ps(self):
        """Conta quantos processos seletivos já foram finalizados (para o modo AUTO)."""
        res = db_select("ps_editions", 'id', {'is_active':False}, False)
        # return len(res) if res else 0
        return 8

    async def process_candidate(self, candidate_id: Optional[str] = None):
        """
        Método Mestre: Recebe o ID, decide a estratégia e delega para o serviço correto.
        """
        config = get_active_config()
        mode = config.engineMode
        
        logger.info(f"[Pipeline] Avaliando estratégia para {candidate_id}. Modo: {mode}")

        use_neural = False
        
        if mode == "V2":
            use_neural = True
        elif mode == "V1":
            use_neural = False
        elif mode == "AUTO":
            ps_count = self.get_count_completed_ps()
            min_cycles = config.minCyclesForNeural or 4
            
            if ps_count >= min_cycles:
                use_neural = True
                logger.info(f"ℹ️ Modo AUTO: {ps_count} ciclos (Suficiente). Usando Neural.")
            else:
                logger.info(f"ℹ️ Modo AUTO: {ps_count}/{min_cycles} ciclos. Usando Determinístico.")

        # Execução com Fallback
        if use_neural:
            try:
                logger.info("🧠 Acionando Engine V2 Service...")
                result = await engine_v2_service.run_single(candidate_id)
                
                # if not result.get("success"):
                #     raise Exception(f"Falha na V2: {result.get('error')}")
                
                return result

            except Exception as e:
                logger.error(f"🚨 Erro Crítico na V2: {e}. Iniciando Fallback para V1...")
                return await engine_v1_service.run_single(candidate_id)
        else:
            logger.info("📐 Acionando Engine V1 Service...")
            return await engine_v1_service.run_single(candidate_id)

selection_pipeline = SelectionPipeline()