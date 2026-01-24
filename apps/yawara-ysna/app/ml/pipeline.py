import logging
from typing import Optional, Dict, Any
from fastapi.concurrency import run_in_threadpool

from app.services.system_configs import get_active_config
from app.utils.db import db_select

# Importamos os SERVIÇOS de Engine (Singleton)
from app.services.engine_v1_service import engine_v1_service
from app.services.engine_v2_service import engine_v2_service

logger = logging.getLogger("yawara.ml.pipeline")

class SelectionPipeline:
    """
    Orquestrador central do processo de seleção (The Brain).
    
    Responsabilidade:
        Decidir qual estratégia (Engine) será utilizada para avaliar o candidato
        com base na configuração do sistema e na maturidade dos dados históricos.
    
    Estratégias:
        - V1 (Determinístico): Baseado em regras e pesos manuais (Cold Start).
        - V2 (Neural): Baseado em Deep Learning (TensorFlow).
        - AUTO: Transição automática de V1 para V2 quando houver dados suficientes.
    """

    def __init__(self):
        pass

    def get_count_completed_ps(self) -> int:
        """
        Consulta síncrona ao BD para contar processos seletivos finalizados.
        
        Returns:
            int: Quantidade de ciclos passados (histórico disponível).
        """
        try:
            res = db_select("ps_editions", 'id', {'is_active': False}, False)
            return len(res) if res else 0
        except Exception as e:
            logger.error(f"Erro ao contar processos seletivos: {e}")
            return 0

    def get_latest_ps_edition(self):
        res = db_select("ps_editions", "id", filters={"is_active": False}, order_by="created_at", desc=True, single=True)
        return res['id'] if res else None

    async def execute_preview(self, pdf_bytes: bytes) -> Any:
        """
        Executa o pipeline completo para gerar o PDF de preview.

        Args:
            pdf_bytes (bytes): Bytes do PDF de entrada.

        Returns:
            Any: Objeto PDF gerado (dependente da implementação do serviço).
        """
        config = get_active_config()
        mode = config.engineMode or "V1"
        
        logger.info(f"[Pipeline] Iniciando avaliação para PREVIEW_USER. Modo Configurado: {mode}")

        # TODO: REFATORAR PARA DDD
        # ------- INITIAL DATA FOR PREVIEW Y-SNA -------
        ps_edition_id = self.get_latest_ps_edition()
        task = {
            "user_id": 'PREVIEW_USER',
            "file_id": None,
            "data": {
                "name": "Preview User",
                "course": "N/A",
                "semester": 1
            }
        }

        use_neural = False
    
        # 1. Decisão de Roteamento
        if mode == "V2":
            use_neural = True
        elif mode == "V1":
            use_neural = False
        elif mode == "AUTO":
            ps_count = await run_in_threadpool(self.get_count_completed_ps)
            min_cycles = config.minCyclesForNeural or 4
            
            if ps_count >= min_cycles:
                use_neural = True
                logger.info(f"ℹ️ Modo AUTO: {ps_count} ciclos encontrados (Meta: {min_cycles}). Usando Neural (V2).")
            else:
                use_neural = False
                logger.info(f"ℹ️ Modo AUTO: {ps_count}/{min_cycles} ciclos. Dados insuficientes. Usando Determinístico (V1).")

        if use_neural:
            try:
                logger.info("🧠 Acionando Engine V2 (Rede Neural)...")
                result = await engine_v2_service.run_single(None, ps_edition_id=ps_edition_id, task=task, pdf_bytes_example=pdf_bytes, is_example=True)
                return result

            except Exception as e:
                logger.error(f"🚨 Falha Crítica na Engine V2: {e}. Iniciando Fallback para V1...", exc_info=True)
                return await engine_v1_service.run_single(None, ps_edition_id=ps_edition_id, task=task, pdf_bytes_example=pdf_bytes, is_example=True)
        else:
            logger.info("📐 Acionando Engine V1 (Algoritmo Determinístico)...")
            return await engine_v1_service.run_single(None, ps_edition_id=ps_edition_id, task=task, pdf_bytes_example=pdf_bytes, is_example=True)
        

    async def process_candidate(self, candidate_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Método Mestre: Avalia um candidato usando a estratégia ativa.

        Args:
            candidate_id (str): Identificador único do candidato.

        Returns:
            Dict[str, Any]: Dicionário contendo:
                - result: Dados da aprovação (score, status).
                - xai: Dados de explicabilidade (relatório, gráficos).
        """
        config = get_active_config()
        mode = config.engineMode or "V1"
        
        logger.info(f"[Pipeline] Iniciando avaliação para {candidate_id}. Modo Configurado: {mode}")

        use_neural = False
        
        # 1. Decisão de Roteamento
        if mode == "V2":
            use_neural = True
        elif mode == "V1":
            use_neural = False
        elif mode == "AUTO":
            # OTIMIZAÇÃO: Consulta ao banco roda em thread separada para não bloquear
            ps_count = await run_in_threadpool(self.get_count_completed_ps)
            min_cycles = config.minCyclesForNeural or 4
            
            if ps_count >= min_cycles:
                use_neural = True
                logger.info(f"ℹ️ Modo AUTO: {ps_count} ciclos encontrados (Meta: {min_cycles}). Usando Neural (V2).")
            else:
                use_neural = False
                logger.info(f"ℹ️ Modo AUTO: {ps_count}/{min_cycles} ciclos. Dados insuficientes. Usando Determinístico (V1).")

        # 2. Execução com Fallback (Safety Net)
        if use_neural:
            try:
                logger.info("🧠 Acionando Engine V2 (Rede Neural)...")
                result = await engine_v2_service.run_single(candidate_id)
                return result

            except Exception as e:
                logger.error(f"🚨 Falha Crítica na Engine V2: {e}. Iniciando Fallback para V1...", exc_info=True)
                # Se a IA falhar (erro de tensor, memória), o sistema não para; usa a regra clássica.
                return await engine_v1_service.run_single(candidate_id)
        else:
            logger.info("📐 Acionando Engine V1 (Algoritmo Determinístico)...")
            return await engine_v1_service.run_single(candidate_id)

selection_pipeline = SelectionPipeline()