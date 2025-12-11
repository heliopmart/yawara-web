import logging
from typing import Dict, List, Any

# CONFIGS IMPORT ---------------------------------------
from app.core.config import settings

# ML ENGINE IMPORT -------------------------------------
from app.ml.canonical_subject_engine import CanonicalSubjectEngine

# SERVICES ---------------------------------------------
from app.utils.llm_client import GeminiClient

logger = logging.getLogger("yawara.services.resolver")

class DynamicNeuralResolver:
    """Orquestrador de resolução de entidades semânticas (Híbrido Neuro-Simbólico).

    Esta classe atua como a camada de serviço que coordena a inteligência do Y-CSNN ( CANONICAL SUBJECT ENGINE ).
    Ela não realiza cálculos vetoriais diretamente (delegados ao `CanonicalSubjectEngine`),
    mas decide *qual* estratégia usar para resolver uma disciplina desconhecida.

    Estratégia de Resolução:
        1. **Fast Path (Memória Neural):** Consulta o motor vetorial. Se a confiança for
           alta (acima do threshold), retorna imediatamente (latência < 50ms).
        2. **Slow Path (Consultor LLM):** Se houver ambiguidade, constrói um prompt
           com os candidatos próximos e consulta o Gemini 2.5 Flash para raciocínio.
        3. **Auto-Learning (Loop de Feedback):** Se a LLM identificar um sinônimo,
           o Resolver instrui o Engine a memorizar o novo vetor, tornando a próxima
           consulta rápida.

    Attributes:
        engine (CanonicalSubjectEngine): O motor de inferência vetorial e persistência.
        llm (GenerativeModel): A instância do cliente Gemini para tarefas generativas.
    """

    _instance = None

    # 2.0s = 30 RPM (Requisições por Minuto) - Seguro para evitar erros 429.
    MIN_REQUEST_INTERVAL = 2.0

    def __init__(self, weights_path: str):
        """Inicializa os serviços de inteligência.

        Args:
            weights_path (str): Caminho para os pesos do modelo neural (.h5).
        """
        logger.info("[Y-CSNN] Inicializando Resolver Híbrido...")
        
        # 1. Inicializa o Motor Neural (Cuida de Vetores e Memória)
        self.engine = CanonicalSubjectEngine(weights_path)

        self.llm_client = GeminiClient()

    def resolve(self, raw_input: str, threshold: float = 0.70) -> Dict[str, Any]:
        """Resolve o nome de uma disciplina para sua forma canônica oficial.

        Args:
            raw_input (str): O texto "sujo" extraído do PDF (ex: "Calc. Diferencial I").
            threshold (float, optional): O limiar de confiança (0.0 a 1.0) para aceitar
                a resposta da memória neural sem consultar a LLM. Defaults to 0.70.

        Returns:
            Dict[str, Any]: Objeto de resposta contendo:
                - canonical (str): Nome oficial padronizado (ex: "CALCULO_1").
                - confidence (float): Grau de certeza da resposta.
                - source (str): Origem da decisão ("NEURAL_MEMORY" ou "LLM_GENERATION").
                - new_concept (bool): Flag indicando se é uma disciplina inédita no sistema.
        """
        # 1. Vetorização (O Engine cuida da limpeza básica e embedding)
        try:
            input_vec = self.engine.vectorise(raw_input)
        except Exception as e:
            # Fallback de segurança se o TensorFlow falhar na inferência
            logger.error(f"Erro Neural: {e}")
            return self._fallback_response(raw_input, "NEURAL_ENGINE_FAILURE")

        # 2. Busca na Memória (O Engine devolve os candidatos)
        top_candidates = self.engine.search_nearest(input_vec, top_k=5)
        
        # Cenário A: Memória Vazia (Cold Start) -> Chama LLM direto
        if not top_candidates:
            return self._ask_gemini_for_concept(raw_input, input_vec, [])

        best_match_name, best_match_score = top_candidates[0]
        
        # Cenário B: Confiança Alta -> Retorna memória (Fast Path)
        if best_match_score >= threshold:
            return {
                "canonical": best_match_name,
                "confidence": round(float(best_match_score), 4),
                "source": "NEURAL_MEMORY",
                "new_concept": False
            }
        
        # Cenário C: Ambiguidade -> Chama LLM (Slow Path)
        logger.info(f"Ambiguidade detectada em '{raw_input}' ({best_match_score:.2f}). Acionando LLM.")
        return self._resolve_via_llm(raw_input, input_vec, top_candidates)

    def _resolve_via_llm(self, raw_input: str, vector: Any, candidates: List) -> Dict:
        """Ponte entre a decisão de chamar a IA e a ação de aprender."""
        try:
            # 1. Delega a pergunta para o especialista (GeminiClient)
            decision = self.llm_client.check_concept_ambiguity(raw_input, candidates)
            
            canonical = decision["canonical"].upper().replace(" ", "_")
            is_new = decision.get("is_new", False)

            # 2. Ciclo de Aprendizado (O Resolver manda o Engine memorizar)
            self.engine.memorize(canonical, vector)
            logger.info(f"Aprendizado: '{raw_input}' -> '{canonical}'")

            return {
                "canonical": canonical,
                "confidence": 1.0,
                "source": "LLM_GENERATION",
                "new_concept": is_new,
                "reasoning": decision.get("reasoning")
            }
        except Exception as e:
            # Se a LLM falhar, fallback para o melhor candidato neural
            return self._fallback_response(raw_input, "LLM_ERROR", candidates)

    def _fallback_response(self, raw_input: str, source: str, candidates: List = None) -> Dict:
        """Gera uma resposta segura quando todos os sistemas inteligentes falham.

        Garante que o pipeline de ingestão nunca trave, retornando o melhor palpite
        disponível (Top-1 da memória) ou o próprio input normalizado.
        """
        fallback_name = candidates[0][0] if candidates else raw_input.upper().replace(" ", "_")
        return {
            "canonical": fallback_name,
            "confidence": 0.0,
            "source": source,
            "new_concept": False
        }

def get_resolver(weights_path="app/resources/models/yawara_canonical_subject_model_v1.weights.h5") -> DynamicNeuralResolver:
    """Singleton Factory para obter a instância única do Resolvedor."""
    if DynamicNeuralResolver._instance is None:
        DynamicNeuralResolver._instance = DynamicNeuralResolver(weights_path)
    return DynamicNeuralResolver._instance