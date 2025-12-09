# apps/yawara-ysna/app/services/neural_resolver.py

import numpy as np
import json
import google.generativeai as genai
from typing import List, Dict, Tuple, Optional, Any
from app.ml.canonical_subject_nn import CanonicalSubjectNN
from app.core.config import settings

class DynamicNeuralResolver:
    _instance = None

    def __init__(self, weights_path: str):
        print(f"[Y-SNA] Inicializando Resolvedor Dinâmico com Contexto Expandido...")
        
        genai.configure(api_key=settings.GOOGLE_API_KEY)
        self.llm = genai.GenerativeModel('gemini-1.5-flash')
        
        self.nn = CanonicalSubjectNN(vocab="ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 ", encoder_dim=128)
        try:
            self.nn.model.build((None, 64)) 
            self.nn.model.load_weights(weights_path)
        except Exception as e:
            print(f"[FATAL] Erro ao carregar pesos: {e}")
            raise e

        self.memory_bank: Dict[str, np.ndarray] = {}
        self._seed_memory()

    def _seed_memory(self):
        # Seed básico inicial
        initial_concepts = [
            "CALCULO_DIFERENCIAL_INTEGRAL_1", 
            "FISICA_MECANICA", 
            "ALGORITMOS_PROGRAMACAO",
            "GEOMETRIA_ANALITICA",
            "QUIMICA_GERAL"
        ]
        vectors = self.nn.embed_batch(initial_concepts)
        for name, vec in zip(initial_concepts, vectors):
            self.memory_bank[name] = vec

    def resolve(self, raw_input: str, threshold: float = 0.85) -> Dict:
        """Fluxo principal: Neural -> Se score baixo -> LLM com Contexto Top-5"""
        
        # 1. Vetoriza
        input_vec = self.nn.embed_single(raw_input)
        
        # 2. Busca na memória (Top-K)
        # Retorna lista de tuplas: [(Nome, Score), (Nome, Score)...]
        top_candidates = self._search_memory(input_vec, top_k=5)
        
        if not top_candidates:
            # Memória vazia, caso extremo de cold start
            return self._ask_gemini_for_concept(raw_input, input_vec, [])

        # Pega o melhor match para verificar o threshold
        best_match_name, best_match_score = top_candidates[0]
        
        # 3. Decisão
        if best_match_score >= threshold:
            return {
                "canonical": best_match_name,
                "confidence": round(float(best_match_score), 4),
                "source": "NEURAL_MEMORY",
                "new_concept": False
            }
        else:
            # Caminho Lento: LLM decide com base nos candidatos
            print(f"[Y-SNA] '{raw_input}' incerto (Top-1: {best_match_score:.2f}). Consultando Gemini com contexto...")
            return self._ask_gemini_for_concept(raw_input, input_vec, top_candidates)

    def _search_memory(self, vector: np.ndarray, top_k: int = 5) -> List[Tuple[str, float]]:
        """
        Retorna os Top-K candidatos mais próximos ordenados por similaridade.
        """
        if not self.memory_bank:
            return []
            
        keys = list(self.memory_bank.keys())
        matrix = np.stack([self.memory_bank[k] for k in keys])
        
        # Produto escalar (Similaridade Cosseno)
        scores = np.dot(vector, matrix.T)
        
        # Pega os índices dos top_k maiores scores
        # min(top_k, len) garante que não quebra se tivermos menos itens que K
        k = min(top_k, len(keys))
        
        # argpartition é mais rápido que sort total, mas não ordena. 
        #argsort[-k:] pega os k maiores. [::-1] inverte para decrescente.
        top_indices = np.argsort(scores)[-k:][::-1]
        
        results = []
        for idx in top_indices:
            results.append((keys[idx], float(scores[idx])))
            
        return results

    def _ask_gemini_for_concept(self, raw_input: str, vector: np.ndarray, candidates: List[Tuple[str, float]]) -> Dict:
        """
        Usa a LLM para arbitrar com contexto expandido.
        """
        
        # Formata a lista de candidatos para o prompt
        candidates_text = "\n".join([
            f"- {name} (Similaridade: {score:.1%})" 
            for name, score in candidates
        ])

        prompt = f"""
        Você atua como o Núcleo de Decisão Semântica do sistema Yawara MotoStudent.
        
        CONTEXTO:
        Recebemos uma disciplina de um histórico escolar chamada: "{raw_input}"
        
        ANÁLISE VETORIAL (O que a rede neural encontrou na memória):
        Aqui estão as 5 disciplinas canônicas mais próximas matematicamente:
        {candidates_text}
        
        SUA TAREFA:
        Analise o nome "{raw_input}" e decida:
        1. É um SINÔNIMO de alguma das opções acima? (Mesmo que o score não seja o mais alto, use sua inteligência linguística).
        2. É uma disciplina conceitualmente NOVA que não existe na lista acima?
        
        REGRAS DE DECISÃO:
        - Se for sinônimo (ex: "Calc 1" e "CALCULO_DIFERENCIAL_INTEGRAL_1"), escolha o canônico existente.
        - Se for novo (ex: "Engenharia de Prompt" e a lista só tem "Algoritmos"), crie um novo canônico (UPPER_CASE_COM_UNDERLINE).
        - NÃO invente canônicos se um existente servir. Evite duplicidade semântica.
        
        RESPOSTA (Formato JSON Estrito):
        {{
            "canonical": "NOME_ESCOLHIDO_OU_CRIADO",
            "is_new": true/false,
            "reasoning": "Explique em 1 frase por que escolheu isso (ex: 'Calc 1 é claramente abreviação de Cálculo Diferencial...')"
        }}
        """

        try:
            # Chama a API
            response = self.llm.generate_content(
                prompt,
                generation_config={"response_mime_type": "application/json"}
            )
            
            decision = json.loads(response.text)
            final_canonical = decision["canonical"]
            is_new = decision["is_new"]
            
            # AUTO-APRENDIZADO:
            # Se a LLM decidiu, nós confiamos e atualizamos a memória vetorial.
            # Isso "puxa" o vetor novo para perto desse conceito no futuro.
            self.memory_bank[final_canonical] = vector
            
            print(f"[Y-SNA] Decisão LLM: '{raw_input}' -> '{final_canonical}' (Novo: {is_new})")

            return {
                "canonical": final_canonical,
                "confidence": 1.0, 
                "source": "LLM_GENERATION",
                "new_concept": is_new,
                "reasoning": decision.get("reasoning")
            }

        except Exception as e:
            print(f"[ERRO-LLM] Falha ao chamar Gemini: {e}")
            # Fallback seguro: usa o Top-1 da rede neural mesmo com confiança baixa
            fallback_name = candidates[0][0] if candidates else "UNKNOWN_ERROR"
            return {
                "canonical": fallback_name,
                "confidence": 0.5,
                "source": "ERROR_FALLBACK",
                "new_concept": False
            }

# Factory Singleton
def get_resolver(weights_path="app/resources/models/yawara_encoder_v1.weights.h5"):
    if DynamicNeuralResolver._instance is None:
        DynamicNeuralResolver._instance = DynamicNeuralResolver(weights_path)
    return DynamicNeuralResolver._instance