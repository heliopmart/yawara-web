import numpy as np
import tensorflow as tf
from typing import List, Dict
from app.ml.canonical_subject_nn import CanonicalSubjectNN

# Ontologia: A "Verdade" que a IA deve buscar
# Em produção, isso viria do banco de dados do Yawara
CANONICAL_KNOWLEDGE_BASE = [
    "CALCULO_DIFERENCIAL_INTEGRAL_1",
    "CALCULO_DIFERENCIAL_INTEGRAL_2",
    "FISICA_MECANICA",
    "ALGEBRA_LINEAR",
    "ALGORITMOS_PROGRAMACAO",
    "DESENHO_TECNICO",
    "QUIMICA_GERAL",
    "OUTROS"
]

class NeuralCanonicalResolver:
    _instance = None

    def __init__(self, weights_path: str):
        print(f"[IA] Inicializando Neural Resolver...")
        
        # 1. Instancia a arquitetura (Vazia)
        # IMPORTANTE: vocab e dims devem ser IGUAIS ao usado no treino/colab
        self.nn = CanonicalSubjectNN(
            vocab="ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 ",
            encoder_dim=128
        )
        
        # 2. Carrega os Pesos (Transfer Learning / Restore)
        # O build é necessário para inicializar as camadas antes de carregar pesos
        try:
            # Formatos de input dummy para forçar o build do grafo
            self.nn.model.build([(None, 64), (None, 64)]) 
            self.nn.model.load_weights(weights_path)
            print(f"[IA] Pesos carregados de {weights_path}")
        except Exception as e:
            print(f"[IA-ERROR] Falha ao carregar pesos: {e}")
            raise e

        # 3. Cria o Índice Vetorial (Cache dos Canônicos)
        self.canonical_vectors = self._build_index()

    def _build_index(self) -> np.ndarray:
        """Gera os embeddings para todas as matérias alvo."""
        # Código dummy pois o foco aqui é o nome da matéria
        dummy_codes = ["00000"] * len(CANONICAL_KNOWLEDGE_BASE)
        return self.nn.embed_batch(dummy_codes, CANONICAL_KNOWLEDGE_BASE)

    def resolve(self, raw_name: str, raw_code: str = "00000", threshold=0.85) -> str:
        """
        Recebe o nome sujo -> Vetoriza -> Compara com Index -> Retorna Canônico
        """
        # 1. Vetoriza a entrada
        input_vector = self.nn.embed_single(raw_code, raw_name)
        
        # 2. Produto Escalar (Similaridade de Cosseno)
        # Como vectors são normalizados (l2_normalize na rede), dot product = cosine sim
        scores = np.dot(input_vector, self.canonical_vectors.T)
        
        # 3. Melhor Match
        best_idx = np.argmax(scores)
        best_score = scores[best_idx]
        
        if best_score >= threshold:
            return CANONICAL_KNOWLEDGE_BASE[best_idx]
        else:
            return f"UNKNOWN_({raw_name})"

# Singleton para não carregar pesos a cada request
def get_resolver(weights_path="app/resources/models/yawara_encoder_v1.weights.h5"):
    if NeuralCanonicalResolver._instance is None:
        NeuralCanonicalResolver._instance = NeuralCanonicalResolver(weights_path)
    return NeuralCanonicalResolver._instance