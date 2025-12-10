import json
import re
import google.generativeai as genai
from typing import Dict, List, Tuple, Any, Optional

# CONFIGS IMPORT ---------------------------------------
from app.core.config import settings

# ML ENGINE IMPORT -------------------------------------
from app.ml.canonical_subject_engine import CanonicalSubjectEngine

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

    def __init__(self, weights_path: str):
        """Inicializa os serviços de inteligência.

        Args:
            weights_path (str): Caminho para os pesos do modelo neural (.h5).
        """
        print(f"[Y-CSNN] Inicializando Serviço de Resolução Híbrida...")
        
        # 1. Inicializa o Motor Neural (Cuida de Vetores e Memória)
        self.engine = CanonicalSubjectEngine(weights_path)
        
        # 2. Inicializa o Consultor LLM (Cuida da Ambiguidade)
        genai.configure(api_key=settings.GOOGLE_API_KEY)
        self.llm = genai.GenerativeModel('gemini-2.5-flash')

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
            print(f"[Y-CSNN] Erro de inferência neural: {e}")
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
        print(f"[Y-CSNN] '{raw_input}' ambíguo (Top-1: {best_match_score:.2f}). Consultando Gemini...")
        return self._ask_gemini_for_concept(raw_input, input_vec, top_candidates)

    def _ask_gemini_for_concept(self, raw_input: str, vector: Any, candidates: List[Tuple[str, float]]) -> Dict[str, Any]:
        """Consulta a LLM para desambiguação semântica e aciona o aprendizado.

        Constrói um prompt contendo o input do usuário e os candidatos mais próximos
        encontrados pela rede neural. A LLM atua como 'Juiz' para decidir se é
        um sinônimo ou um conceito novo.

        Se a LLM confirmar um sinônimo, este método invoca `engine.memorize()` para
        persistir o aprendizado.
        """
        candidates_text = "\n".join([
            f"- {name} (Similaridade: {score:.1%})" 
            for name, score in candidates
        ])

        prompt = f"""
        Você é o Kernel Semântico do Yawara.
        INPUT: "{raw_input}"
        
        MEMÓRIA NEURAL (Candidatos próximos):
        {candidates_text}
        
        TAREFA:
        O input é semanticamente IGUAL a algum candidato (sinônimo, abreviação)?
        Ou é um conceito NOVO (disciplina distinta)?
        
        RESPOSTA JSON APENAS:
        {{
            "canonical": "NOME_EXISTENTE_OU_NOVO_PADRONIZADO",
            "is_new": boolean,
            "reasoning": "curta explicação"
        }}
        """

        try:
            if settings.ENVIRONMENT == "development_local_mock": 
                raise Exception("LLM MOCK - desabilitado para testes locais")

            response = self.llm.generate_content(
                prompt,
                generation_config={"response_mime_type": "application/json"}
            )
            
            text_response = response.text

            # Limpeza robusta de markdown json (caso a LLM seja verbosa)
            text_response = re.sub(r"^```json\s*", "", text_response)
            text_response = re.sub(r"\s*```$", "", text_response)
            
            decision = json.loads(text_response)
            
            if "canonical" not in decision:
                raise ValueError("LLM não retornou chave 'canonical'")

            final_canonical = decision["canonical"].upper().replace(" ", "_")
            is_new = decision.get("is_new", False)
            
            # --- AUTO-APRENDIZADO ---
            # O Serviço decide que deve aprender, e manda o Engine memorizar.
            # Isso fecha o ciclo de feedback.
            self.engine.memorize(final_canonical, vector)
            
            print(f"[Y-CSNN] Aprendizado: '{raw_input}' -> '{final_canonical}' (Novo: {is_new})")

            return {
                "canonical": final_canonical,
                "confidence": 1.0, 
                "source": "LLM_GENERATION",
                "new_concept": is_new,
                "reasoning": decision.get("reasoning")
            }

        except Exception as e:
            print(f"[ERRO-LLM] Falha ao chamar Gemini: {e}")
            return self._fallback_response(raw_input, "LLM_ERROR_FALLBACK", candidates)

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