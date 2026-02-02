import logging
import asyncio
import numpy as np
import os
from typing import Dict, List, Any, Optional, Tuple

# CONFIGS IMPORT
from app.core.config import settings

# ML ARCHITECTURE IMPORT 
from app.ml.canonical_subject_engine import CanonicalSubjectNN

# SERVICES
from app.utils.llm_client import GeminiClient
from app.services.storage import storage_service

logger = logging.getLogger("yawara.services.resolver")

class DynamicNeuralResolver:
    """
    Orquestrador Híbrido: Neural Search + LLM Fallback.
    
    Otimizado para Alta Concorrência (Async/Non-blocking).
    """

    _instance = None

    def __init__(self):
        self.llm_client = GeminiClient()
        self.encoder: Optional[CanonicalSubjectNN] = None
        
        # O Banco de Memória (RAM)
        self.memory_keys: List[str] = []         # Nomes Canônicos
        self.memory_vectors: np.ndarray = None   # Matriz (N, 128)
        
        self._ready_event = asyncio.Event() 
        self._init_task = asyncio.create_task(self._initialize_resources())

    async def ensure_ready(self):
        """Método que deve ser chamado antes de qualquer operação pública."""
        await self._ready_event.wait()
        if self._init_task.done() and self._init_task.exception():
            raise self._init_task.exception()

    async def _download_resources(self):
        """
        Baixa recursos em uma Thread separada para não bloquear o Event Loop.
        Isso é crucial pois storage_service.download_file é síncrono.
        """
        logger.info("[Resolver] Baixando pesos e memória do Storage (Thread Pool)...")
        
        loop = asyncio.get_running_loop()
        
        def _download_sync(remote_id, local_path):
            return storage_service.download_file(remote_name=remote_id, local_dest=local_path)

        if not os.path.exists(settings.ML_CANONICAL_WEIGHTS_PATH):
            success = await loop.run_in_executor(
                None, 
                _download_sync, 
                settings.ML_CANONICAL_WEIGHTS_ID, 
                settings.ML_CANONICAL_WEIGHTS_PATH
            )
            if not success:
                raise Exception(f"Falha ao baixar pesos: {settings.ML_CANONICAL_WEIGHTS_ID}")
        
        if not os.path.exists(settings.NN_MODEL_MEMORY_FILE_PATH):
            success = await loop.run_in_executor(
                None, 
                _download_sync, 
                settings.NN_MODEL_MEMORY_FILE_ID, 
                settings.NN_MODEL_MEMORY_FILE_PATH
            )
            if not success:
                 raise Exception(f"Falha ao baixar memória: {settings.NN_MODEL_MEMORY_FILE_ID}")

    async def _initialize_resources(self):
        """Carrega Modelo e Memória na inicialização."""
        try:
            logger.info("[Resolver] Inicializando Motor Neural...")
            
            self.encoder = CanonicalSubjectNN(encoder_dim=128)
            weights_path = settings.ML_CANONICAL_WEIGHTS_PATH
            
            if not os.path.exists(weights_path) or not os.path.exists(settings.NN_MODEL_MEMORY_FILE_PATH):
                logger.info(f"[Resolver] Pesos não encontrados localmente. Iniciando download...")
                await self._download_resources()
                
            
            self.encoder.model.load_weights(weights_path)
            logger.info(f"[Resolver] Pesos carregados com sucesso de: {weights_path}")

            self._load_memory_bank()
            
            self._ready_event.set() 
            
        except Exception as e:
            logger.critical(f"[Resolver] FALHA CATÁSTRÓFICA ao inicializar: {e}")
            raise e

    def _load_memory_bank(self):
        """Carrega os vetores pré-calculados do disco para a RAM."""
        mem_path = settings.NN_MODEL_MEMORY_FILE_PATH
        
        if os.path.exists(mem_path):
            try:
                data = np.load(mem_path, allow_pickle=True)
                self.memory_keys = list(data['keys'])
                self.memory_vectors = data['vectors']
                logger.info(f"[Resolver] Memória carregada: {len(self.memory_keys)} entidades.")
            except Exception as e:
                logger.error(f"[Resolver] Memória corrompida: {e}")
                self.memory_keys = []
                self.memory_vectors = np.empty((0, 128))
        else:
            logger.warning("[Resolver] Arquivo de memória .npz não existe. Iniciando vazio.")
            self.memory_keys = []
            self.memory_vectors = np.empty((0, 128))

    # =========================================================================
    # CPU-BOUND TASKS (Executadas em Thread Separada)
    # =========================================================================

    def _calculate_neural_match(self, raw_input: str) -> List[Tuple[str, float]]:
        """
        Executa a matemática pesada de forma síncrona.
        Isolada aqui para ser enviada para o ThreadPool via asyncio.
        """
        # 1. Embed (Supõe que CanonicalSubjectNN.embed_single está otimizado com __call__)
        query_vec = self.encoder.embed_single(raw_input)
        
        candidates = []
        # Verifica se temos memória carregada
        if self.memory_vectors is not None and len(self.memory_vectors) > 0:
            # 2. Dot Product (Matriz x Vetor) - Operação pesada
            scores = np.dot(self.memory_vectors, query_vec)
            
            # Pega os Top-5 Índices
            top_indices = np.argsort(scores)[-5:][::-1]
            
            for idx in top_indices:
                score = float(scores[idx])
                name = self.memory_keys[idx]
                candidates.append((name, score))
        
        return candidates

    # =========================================================================
    # CORE PIPELINE (ASYNC)
    # =========================================================================

    async def resolve(self, raw_input: str, threshold: float = 0.70) -> Dict[str, Any]:
        """
        Pipeline Principal Não-Bloqueante.
        """
        # Override de configuração se existir
        if settings.ML_THRESHOLD_SUBJECT_MATCH:
            threshold = settings.ML_THRESHOLD_SUBJECT_MATCH

        if not raw_input or not raw_input.strip():
            return {"canonical": "UNKNOWN", "confidence": 0.0, "source": "EMPTY"}

        # --- FASE 1: BUSCA NEURAL (Thread Offloading) ---
        try:
            # OTIMIZAÇÃO: Joga o cálculo para outra thread para não travar o servidor
            top_candidates = await asyncio.to_thread(self._calculate_neural_match, raw_input)
            
        except Exception as e:
            logger.error(f"Falha no Motor Neural: {e}")
            return self._fallback_response(raw_input, "NEURAL_FAILURE")

        # --- FASE 2: DECISÃO ---
        
        # Cenário A: Cold Start (Nenhum candidato na memória)
        if not top_candidates:
            logger.info(f"Cold Start para '{raw_input}'. Chamando LLM.")
            return await self._resolve_via_llm(raw_input, top_candidates)

        best_match_name, best_match_score = top_candidates[0]

        # Cenário B: Alta Confiança (Auto-Approve)
        if best_match_score >= threshold:
            return {
                "canonical": best_match_name,
                "confidence": round(best_match_score, 4),
                "source": "NEURAL_MEMORY",
                "new_concept": False
            }

        # Cenário C: Ambiguidade -> LLM
        logger.info(f"Ambiguidade: '{raw_input}' ~ '{best_match_name}' ({best_match_score:.2f} < {threshold}). Chamando LLM.")
        return await self._resolve_via_llm(raw_input, top_candidates)

    async def _resolve_via_llm(self, raw_input: str, candidates: List) -> Dict:
        """
        Usa Gemini 2.5 para decidir e aprende o resultado.
        """
        try:
            # Chama a LLM de forma assíncrona
            decision = await asyncio.to_thread(
                self.llm_client.check_concept_ambiguity, 
                raw_input, 
                candidates
            )
            
            canonical = decision.get("canonical", "UNKNOWN").upper().strip().replace(" ", "_")
            is_new = decision.get("is_new", False)
            reasoning = decision.get("reasoning", "LLM Decision")

            # APRENDIZADO ONLINE (Active Learning)
            if canonical != "UNKNOWN":
                self.memorize_new_concept(raw_input, canonical)
                logger.info(f"🧠 Aprendido: '{raw_input}' mapeado para '{canonical}'")

            return {
                "canonical": canonical,
                "confidence": 1.0,
                "source": "LLM_GENERATION",
                "new_concept": is_new,
                "reasoning": reasoning
            }

        except Exception as e:
            logger.error(f"Erro no Resolver LLM: {e}")
            return self._fallback_response(raw_input, "LLM_ERROR", candidates)

    def memorize_new_concept(self, raw_text: str, canonical: str):
        """
        Ensina o motor em tempo de execução.
        """
        # Verifica se o canonical já existe na memória
        if canonical in self.memory_keys:
            self._persist_learning_log(canonical, raw_text)
        else:
            # É um conceito novo, vetorizamos e adicionamos à RAM
            try:
                # Gera vetor usando a rede neural
                new_vec = self.encoder.embed_single(canonical)
                
                # Atualiza arrays em memória
                self.memory_keys.append(canonical)
                if self.memory_vectors is not None and len(self.memory_vectors) > 0:
                    self.memory_vectors = np.vstack([self.memory_vectors, new_vec])
                else:
                    self.memory_vectors = np.array([new_vec])
                
                self._persist_learning_log(canonical, raw_text)
                
            except Exception as e:
                logger.error(f"Erro ao memorizar novo conceito: {e}")

    def _persist_learning_log(self, canonical: str, variation: str):
        """Salva no arquivo JSONL para o próximo retreino."""
        log_path = settings.NN_MODEL_LEARNED_DATA_PATH
        import json
        try:
            record = {"canonical": canonical, "vars": [variation]}
            with open(log_path, 'a', encoding='utf-8') as f:
                f.write(json.dumps(record, ensure_ascii=False) + "\n")
        except Exception as e:
            logger.error(f"Erro ao salvar log de aprendizado: {e}")

    def _fallback_response(self, raw_input: str, source: str, candidates: List = None) -> Dict:
        """Resposta de segurança se tudo falhar."""
        fallback_name = candidates[0][0] if candidates else raw_input.upper().replace(" ", "_")
        return {
            "canonical": fallback_name,
            "confidence": 0.0,
            "source": source,
            "new_concept": False
        }

def get_resolver() -> DynamicNeuralResolver:
    """Singleton Factory."""
    if DynamicNeuralResolver._instance is None:
        DynamicNeuralResolver._instance = DynamicNeuralResolver()
    return DynamicNeuralResolver._instance