import logging
import asyncio
from typing import Dict, List, Any, Optional
from functools import lru_cache 

# CONFIGS IMPORT ---------------------------------------
from app.core.config import settings

# ML ENGINE IMPORT -------------------------------------
from app.ml.canonical_subject_engine import CanonicalSubjectEngine

# SERVICES ---------------------------------------------
from app.utils.llm_client import GeminiClient

logger = logging.getLogger("yawara.services.resolver")

class DynamicNeuralResolver:
    """
    Orquestrador de resolução de entidades semânticas (Híbrido Neuro-Simbólico).

    Atua como camada de inteligência sobre o motor vetorial (Y-CSNN).
    
    Estratégia de Resolução (Neuro-Symbolic Pipeline):
        1. **Cache (L1):** Verifica se este termo exato já foi resolvido recentemente (LRU).
        2. **Neural Memory (L2):** Consulta o Vector Engine. Se confiança > threshold, aceita.
        3. **LLM Reasoning (L3):** Se ambíguo, consulta o Gemini 2.5 para desambiguação semântica.
        4. **Learning:** Se a LLM descobrir um novo sinônimo, o Resolver ensina o Vector Engine (memória de longo prazo).

    Attributes:
        engine (CanonicalSubjectEngine): Motor vetorial (TensorFlow/Faiss).
        llm_client (GeminiClient): Interface com LLM Generativa.
    """

    _instance = None

    def __init__(self, weights_path: Optional[str] = None):
        """
        Inicializa os motores de inteligência.
        
        Args:
            weights_path: Path opcional. Se None, usa o definido no settings/padrão.
        """
        path = weights_path or settings.ML_CANONICAL_WEIGHTS_PATH
        logger.info(f"[Y-CSNN] Inicializando Resolver Híbrido com pesos em: {path}")
        
        self.engine = CanonicalSubjectEngine(path)
        self.llm_client = GeminiClient()

    # @lru_cache(maxsize=4096) 
    async def resolve(self, raw_input: str, threshold: float = 0.67) -> Dict[str, Any]:
        """
        Resolve o nome da disciplina usando estratégia em cascata (Cache -> Neural -> LLM).

        O uso de @lru_cache aqui é vital. Ele garante que chamadas repetidas para 
        "Cálculo I" (comum em históricos em lote) sejam respondidas em nanosegundos,
        pulando todo o processamento pesado de Tensores e chamadas de API.

        Args:
            raw_input (str): Texto sujo (ex: "Introd. a Comp.").
            threshold (float): Confiança mínima para aceitar a memória neural.

        Returns:
            Dict: Objeto padronizado com 'canonical', 'confidence', etc.
        """
        if settings.ML_THRESHOLD_SUBJECT_MATCH:
            threshold = settings.ML_THRESHOLD_SUBJECT_MATCH

        if not raw_input:
            return {"canonical": "UNKNOWN", "confidence": 0.0, "source": "EMPTY"}

        # Vetorize and search in Neural Memory
        try:
            # Engine take care of basic cleaning and embedding
            input_vec = self.engine.vectorise(raw_input)
            
            # Search for nearest neighbors
            top_candidates = self.engine.search_nearest(input_vec, top_k=5)
        except Exception as e:
            logger.error(f"Falha no Motor Neural: {e}. Usando Fallback.")
            return self._fallback_response(raw_input, "NEURAL_FAILURE")

        # 2. Analyze Candidates
        
        # Scenario A: Cold Start (Empty Memory) -> LLM
        if not top_candidates:
            logger.info(f"Cold Start for '{raw_input}'. Triggering LLM.")
            return await self._resolve_via_llm(raw_input, input_vec, [])

        best_match_name, best_match_score = top_candidates[0]
        
        # Scenario B: High Confidence (Fast Path)
        if best_match_score >= threshold:
            # logger.debug(f"Hit Neural: '{raw_input}' -> '{best_match_name}' ({best_match_score:.2f})")
            return {
                "canonical": best_match_name,
                "confidence": round(float(best_match_score), 4),
                "source": "NEURAL_MEMORY",
                "new_concept": False
            }
        
        # Scenario C: Ambiguity (Slow Path) -> LLM
        logger.info(f"Ambiguity: '{raw_input}' ~ '{best_match_name}' ({best_match_score:.2f} < {threshold}). Triggering LLM.")
        print(f"Ambiguity: '{raw_input}' ~ '{best_match_name}' ({best_match_score:.2f} < {threshold}). Triggering LLM.")
        return await self._resolve_via_llm(raw_input, input_vec, top_candidates)

    async def _resolve_via_llm(self, raw_input: str, vector: Any, candidates: List) -> Dict:
        """
        Slow Path: Usa IA Generativa para desambiguar e ensina o Motor (Active Learning).
        """
        try:
            decision = await asyncio.to_thread(
                self.llm_client.check_concept_ambiguity, 
                raw_input, 
                candidates
            )
            
            canonical = decision.get("canonical", "UNKNOWN").upper().strip().replace(" ", "_")
            is_new = decision.get("is_new", False)
            reasoning = decision.get("reasoning", "LLM Decision")

            if canonical != "UNKNOWN":
                self.engine.memorize(raw_input, canonical)
                
                logger.info(f"🧠 Aprendido: '{raw_input}' mapeado para '{canonical}'")
            else:
                pass

            return {
                "canonical": canonical,
                "confidence": 1.0,
                "source": "LLM_GENERATION",
                "new_concept": is_new,
                "reasoning": reasoning
            }

        except Exception as e:
            logger.error(f"Erro no Resolver LLM para '{raw_input}': {e}")
            return self._fallback_response(raw_input, "LLM_ERROR", candidates)

    def _fallback_response(self, raw_input: str, source: str, candidates: List = None) -> Dict:
        """
        Fail-safe: Returns the best we have to avoid breaking the selection process.
        """
        # If there is any neural candidate (even bad), use it. Otherwise, use the input itself.
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