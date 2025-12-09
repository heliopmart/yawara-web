import numpy as np
import json
import os
import re
import google.generativeai as genai
from typing import List, Dict, Tuple, Optional, Any
from app.ml.canonical_subject_nn import CanonicalSubjectNN
from app.core.config import settings
from app.training.train_encoder_ml import TRAINING_SEEDS

# Caminho para persistência da memória vetorial (volume persistente no Docker)
MEMORY_FILE_PATH =settings.NN_MODEL_MEMORY_FILE_PATH

class DynamicNeuralResolver:
    _instance = None

    def __init__(self, weights_path: str):
        print(f"[Y-SNA] Inicializando Resolvedor Dinâmico com Persistência...")
        
        genai.configure(api_key=settings.GOOGLE_API_KEY)
        self.llm = genai.GenerativeModel('gemini-2.5-flash')
        
        self.nn = CanonicalSubjectNN(vocab="ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 ", encoder_dim=128)
        try:
            self.nn.model.build((None, 64)) 
            self.nn.model.load_weights(weights_path)
            print("[Y-SNA] Pesos neurais carregados com sucesso.")
        except Exception as e:
            print(f"[FATAL] Erro ao carregar pesos: {e}")
            raise e

        # Memória Vetorial: Dicionário { "NOME_CANONICO": np.array([...]) }
        self.memory_bank: Dict[str, np.ndarray] = {}
        self._load_memory() # Tenta carregar do disco, senão seada

    def _seed_memory(self):
        """Injeta conceitos fundamentais se a memória estiver vazia."""
        print("[Y-SNA] Semeando memória inicial...")
        initial_concepts = [item["canonical"] for item in TRAINING_SEEDS]
        vectors = self.nn.embed_batch(initial_concepts)
        for name, vec in zip(initial_concepts, vectors):
            self.memory_bank[name] = vec
        self._save_memory()

    def _load_memory(self):
        """Carrega a memória vetorial do disco."""
        if os.path.exists(MEMORY_FILE_PATH):
            try:
                data = np.load(MEMORY_FILE_PATH, allow_pickle=True)
                # O formato .npz armazena arrays. Vamos reconstruir o dict.
                keys = data['keys']
                vectors = data['vectors']
                
                self.memory_bank = {k: v for k, v in zip(keys, vectors)}
                print(f"[Y-SNA] Memória restaurada: {len(self.memory_bank)} conceitos.")
            except Exception as e:
                print(f"[Y-SNA] Erro ao ler memória ({e}). Reiniciando seed.")
                self._seed_memory()
        else:
            self._seed_memory()

    def _save_memory(self):
        """Persiste a memória atual no disco."""
        try:
            keys = list(self.memory_bank.keys())
            vectors = np.array(list(self.memory_bank.values()))
            
            # Cria diretório se não existir
            os.makedirs(os.path.dirname(MEMORY_FILE_PATH), exist_ok=True)
            
            np.savez_compressed(MEMORY_FILE_PATH, keys=keys, vectors=vectors)
            # print("[Y-SNA] Memória persistida no disco.") # Verbose demais para cada save
        except Exception as e:
            print(f"[Y-SNA] ERRO CRÍTICO ao salvar memória: {e}")

    def resolve(self, raw_input: str, threshold: float = 0.70) -> Dict:
        """
        Fluxo principal: Neural -> Se score baixo -> LLM -> Auto-Aprendizado
        """
        # Normalização básica de entrada
        raw_input = raw_input.strip().upper()
        
        # 1. Vetoriza
        input_vec = self.nn.embed_single(raw_input)
        
        # 2. Busca na memória (Top-K)
        top_candidates = self._search_memory(input_vec, top_k=5)
        
        if not top_candidates:
            return self._ask_gemini_for_concept(raw_input, input_vec, [])

        best_match_name, best_match_score = top_candidates[0]
        
        # 3. Decisão (Fast Path)
        if best_match_score >= threshold:
            return {
                "canonical": best_match_name,
                "confidence": round(float(best_match_score), 4),
                "source": "NEURAL_MEMORY",
                "new_concept": False
            }
        else:
            # Caminho Lento: LLM decide
            print(f"[Y-SNA] '{raw_input}' ambíguo (Top-1: {best_match_score:.2f}). Consultando Gemini...")
            return self._ask_gemini_for_concept(raw_input, input_vec, top_candidates)

    def _search_memory(self, vector: np.ndarray, top_k: int = 5) -> List[Tuple[str, float]]:
        if not self.memory_bank:
            return []
            
        keys = list(self.memory_bank.keys())
        matrix = np.stack([self.memory_bank[k] for k in keys])
        
        scores = np.dot(vector, matrix.T)
        
        k = min(top_k, len(keys))
        top_indices = np.argsort(scores)[-k:][::-1]
        
        results = []
        for idx in top_indices:
            results.append((keys[idx], float(scores[idx])))
            
        return results

    def _ask_gemini_for_concept(self, raw_input: str, vector: np.ndarray, candidates: List[Tuple[str, float]]) -> Dict:
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
            raise Exception("LLM MOCK - desabilitado para testes locais")

            response = self.llm.generate_content(
                prompt,
                generation_config={"response_mime_type": "application/json"}
            )
            
            # Limpeza robusta do JSON (remove ```json ... ``` se houver)
            text_response = response.text
            text_response = re.sub(r"^```json\s*", "", text_response)
            text_response = re.sub(r"\s*```$", "", text_response)
            
            decision = json.loads(text_response)
            
            # Validação básica de chaves
            if "canonical" not in decision:
                raise ValueError("LLM não retornou chave 'canonical'")

            final_canonical = decision["canonical"].upper().replace(" ", "_")
            is_new = decision.get("is_new", False)
            
            # --- AUTO-APRENDIZADO (PERSISTENTE) ---
            # Se a LLM diz que 'Calc I' == 'CALCULO_1', nós associamos o vetor de 'Calc I' 
            # ao conceito 'CALCULO_1'. Isso reforça a região semântica desse conceito.
            self.memory_bank[final_canonical] = vector
            self._save_memory() # Salva no disco!
            
            print(f"[Y-SNA] Aprendizado: '{raw_input}' -> '{final_canonical}' (Novo: {is_new})")

            return {
                "canonical": final_canonical,
                "confidence": 1.0, # Confiança arbitrária pois foi humano/LLM que decidiu
                "source": "LLM_GENERATION",
                "new_concept": is_new,
                "reasoning": decision.get("reasoning")
            }

        except Exception as e:
            print(f"[ERRO-LLM] Falha ao chamar Gemini: {e}")
            fallback = candidates[0][0] if candidates else "UNKNOWN_ERROR"
            return {
                "canonical": fallback,
                "confidence": 0.0,
                "source": "ERROR_FALLBACK",
                "new_concept": False
            }

def get_resolver(weights_path="app/resources/models/yawara_encoder_v1.weights.h5"):
    if DynamicNeuralResolver._instance is None:
        DynamicNeuralResolver._instance = DynamicNeuralResolver(weights_path)
    return DynamicNeuralResolver._instance