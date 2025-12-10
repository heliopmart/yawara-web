import numpy as np
import os
from typing import List, Tuple, Dict

# CONFIG IMPORT -------------------------------------------
from app.core.config import settings

# ARCHITECTUREs IMPORT ------------------------------------
from app.ml.architectures.canonical_subject_nn import CanonicalSubjectNN

# TRAINING IMPORT -----------------------------------------
from app.training.train_canonical_subject_ml import TRAINING_SEEDS

# Definição do caminho da memória (Banco Vetorial em Arquivo)
MEMORY_FILE_PATH = settings.NN_MODEL_MEMORY_FILE_PATH

class CanonicalSubjectEngine:
    """Motor de inferência vetorial e persistência para normalização de disciplinas.

    Esta classe encapsula a complexidade de baixo nível da Rede Neural e do
    armazenamento de vetores. Ela é responsável por carregar os pesos,
    converter texto em embeddings, realizar a busca de vizinhos mais próximos (KNN)
    e persistir o aprendizado incremental em disco.

    Attributes:
        nn (CanonicalSubjectNN): A instância do modelo neural carregada.
        memory_bank (Dict[str, np.ndarray]): Cache em memória dos vetores conhecidos.
            Formato: {"NOME_CANONICO": vetor_128d}
    """

    def __init__(self, weights_path: str):
        """Inicializa o motor, carrega a rede neural e restaura a memória vetorial.

        Args:
            weights_path (str): Caminho absoluto ou relativo para o arquivo .h5 com os pesos.
        
        Raises:
            FileNotFoundError: Se o arquivo de pesos não existir.
            Exception: Se houver erro no carregamento do TensorFlow.
        """
        print(f"[YSNA-Engine] Inicializando Motor Vetorial...")
        
        # 1. Carrega a Rede Neural
        self.nn = CanonicalSubjectNN(vocab="ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 ", encoder_dim=128)
        try:
            self.nn.model.build((None, 64)) 
            self.nn.model.load_weights(weights_path)
            print("[YSNA-Engine] Pesos neurais carregados com sucesso.")
        except Exception as e:
            print(f"[FATAL] Erro ao carregar pesos em {weights_path}: {e}")
            raise e

        # 2. Inicializa o Banco de Memória
        self.memory_bank: Dict[str, np.ndarray] = {}
        self._load_or_seed_memory()

    def vectorise(self, text: str) -> np.ndarray:
        """Converte uma string crua em seu vetor de embedding (128d).

        Args:
            text (str): O texto de entrada (ex: "Calc 1").

        Returns:
            np.ndarray: O vetor denso normalizado representando o texto.
        """
        # Normalização básica antes de entrar na rede
        clean_text = text.strip().upper()
        return self.nn.embed_single(clean_text)

    def search_nearest(self, vector: np.ndarray, top_k: int = 5) -> List[Tuple[str, float]]:
        """Realiza uma busca por similaridade de cosseno na memória vetorial.

        Args:
            vector (np.ndarray): O vetor de consulta (query vector).
            top_k (int, optional): Quantidade de candidatos a retornar. Defaults to 5.

        Returns:
            List[Tuple[str, float]]: Lista de tuplas (Nome Canônico, Score de Similaridade).
            Ordenada do maior score para o menor.
        """
        if not self.memory_bank:
            return []
            
        # Otimização: Transforma o dict em matrizes numpy para cálculo vetorizado
        keys = list(self.memory_bank.keys())
        matrix = np.stack([self.memory_bank[k] for k in keys])
        
        # Produto Escalar (Dot Product)
        # Como os vetores já saem normalizados da rede (L2 Norm), 
        # o produto escalar É a similaridade de cosseno.
        scores = np.dot(vector, matrix.T)
        
        # Obtém os índices dos Top-K maiores scores
        # np.argsort ordena crescente, então pegamos o final e invertemos [::-1]
        k = min(top_k, len(keys))
        top_indices = np.argsort(scores)[-k:][::-1]
        
        results = []
        for idx in top_indices:
            results.append((keys[idx], float(scores[idx])))
            
        return results

    def memorize(self, canonical_name: str, vector: np.ndarray) -> None:
        """Registra um novo conceito (ou reforça um existente) na memória persistente.

        Este método é chamado quando o sistema aprende um novo sinônimo. Ele atualiza
        o banco em memória e dispara a gravação no disco.

        Args:
            canonical_name (str): O nome oficial da disciplina (Chave Primária).
            vector (np.ndarray): O vetor representativo.
        """
        self.memory_bank[canonical_name] = vector
        self._save_memory_to_disk()

    def _load_or_seed_memory(self):
        """Carrega a memória do disco ou cria a semente inicial se vazio."""
        if os.path.exists(MEMORY_FILE_PATH):
            try:
                data = np.load(MEMORY_FILE_PATH, allow_pickle=True)
                keys = data['keys']
                vectors = data['vectors']
                self.memory_bank = {k: v for k, v in zip(keys, vectors)}
                print(f"[YSNA-Engine] Memória restaurada: {len(self.memory_bank)} vetores.")
            except Exception as e:
                print(f"[YSNA-Engine] Erro ao ler memória ({e}). Reiniciando com Seeds.")
                self._seed_memory()
        else:
            print("[YSNA-Engine] Memória vazia. Iniciando semente...")
            self._seed_memory()

    def _seed_memory(self):
        """Popula a memória com os conceitos fundamentais do treinamento."""
        initial_concepts = [item["canonical"] for item in TRAINING_SEEDS]
        vectors = self.nn.embed_batch(initial_concepts)
        for name, vec in zip(initial_concepts, vectors):
            self.memory_bank[name] = vec
        self._save_memory_to_disk()

    def _save_memory_to_disk(self):
        """Persiste o estado atual da memória no arquivo .npz."""
        try:
            keys = list(self.memory_bank.keys())
            vectors = np.array(list(self.memory_bank.values()))
            
            os.makedirs(os.path.dirname(MEMORY_FILE_PATH), exist_ok=True)
            np.savez_compressed(MEMORY_FILE_PATH, keys=keys, vectors=vectors)
        except Exception as e:
            print(f"[YSNA-Engine] ERRO CRÍTICO ao salvar memória: {e}")