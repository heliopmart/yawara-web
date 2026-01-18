import tensorflow as tf
from tensorflow.keras import layers, Model
import numpy as np
from typing import Dict, List

from app.utils.text import normalize_text_strict

class CanonicalSubjectNN:
    """Define a arquitetura da Rede Neural para encoding semântico de disciplinas.

    Esta classe implementa um modelo **Character-level CNN** (Rede Neural Convolucional
    em nível de caractere). Diferente de modelos NLP tradicionais que usam tokenização
    por palavras (Word2Vec, BERT), este modelo opera sobre caracteres individuais.

    Vantagens desta Arquitetura para o YCSNN:
    1. **Robustez a Ruído:** Capaz de entender "C4LCULO" ou "CALC." mesmo com erros de OCR,
       pois aprende a morfologia visual das palavras.
    2. **Sem vocabulário desconhecido (OOV):** Como o vocabulário são letras e números,
       nenhuma palavra é "desconhecida", apenas uma combinação nova de caracteres.
    3. **Leveza:** O modelo resultante tem poucos parâmetros, permitindo inferência rápida em CPU.

    Attributes:
        vocab (str): String contendo todos os caracteres aceitáveis (alfanumérico + espaço).
        max_len (int): Tamanho fixo da sequência de entrada (truncamento/padding).
        model (Model): A instância compilada do modelo Keras Functional API.
    """

    def __init__( self, vocab: str, max_len: int = 64, char_emb_dim: int = 64, encoder_dim: int = 128 ):
        """Inicializa a arquitetura e constrói o grafo de computação.

        Args:
            vocab (str): O alfabeto permitido (ex: "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 ").
            max_len (int, optional): Comprimento máximo da string. Defaults to 64.
            char_emb_dim (int, optional): Dimensão do vetor de cada caractere. Defaults to 64.
            encoder_dim (int, optional): Dimensão do vetor final de saída (embedding semântico).
            Defaults to 128.
        """
        self.vocab = vocab
        self.max_len = max_len
        self.char_emb_dim = char_emb_dim
        self.encoder_dim = encoder_dim

        # Mapeamento de caracteres (A -> 1, B -> 2...)
        # O índice 0 é reservado para Padding/Masking
        self.char2idx: Dict[str, int] = {
            ch: i + 1 for i, ch in enumerate(vocab)
        }
        self.idx2char: Dict[int, str] = {
            i: ch for ch, i in self.char2idx.items()
        }

        # Constrói o modelo Keras imediatamente na inicialização
        self.model: Model = self._build_encoder_model()

    def encode_string(self, s: str) -> np.ndarray:
        """Converte uma string crua em uma sequência de índices inteiros (Tensor-ready).

        Processo:
        1. Normaliza para maiúsculas.
        2. Trunca para `max_len`.
        3. Mapeia caracteres para inteiros usando `char2idx`.
        4. Aplica Zero-Padding à direita se a string for curta.

        Args:
            s (str): O texto de entrada (ex: "Calc 1").

        Returns:
            np.ndarray: Array de inteiros com shape `(max_len,)`, dtype int32.
        """
        s = normalize_text_strict(s or "")

        s = (s or "").upper()[: self.max_len]
        ids: List[int] = []
        for ch in s:
            idx = self.char2idx.get(ch, 0) # 0 se for caractere estranho
            ids.append(idx)
        
        # Padding (preenche com 0 até chegar em max_len)
        if len(ids) < self.max_len:
            ids += [0] * (self.max_len - len(ids))

        return np.array(ids, dtype="int32")

    def encode_batch(self, names_raw: List[str]) -> np.ndarray:
        """Vetoriza uma lista de strings para processamento em lote (batch).

        Args:
            names_raw (List[str]): Lista de nomes de disciplinas.

        Returns:
            np.ndarray: Matriz com shape `(batch_size, max_len)`.
        """
        return np.stack([self.encode_string(n) for n in names_raw])

    def embed_batch(self, names_raw: List[str], batch_size: int = 32) -> np.ndarray:
        """Gera os embeddings semânticos (vetores densos) para uma lista de nomes.

        Este método executa a passada completa (forward pass) pela rede neural.

        Args:
            names_raw (List[str]): Textos de entrada.
            batch_size (int, optional): Tamanho do lote para inferência. Defaults to 32.

        Returns:
            np.ndarray: Matriz de embeddings com shape `(N, encoder_dim)`.
                        Os vetores retornados já estão normalizados (L2 Norm).
        """
        x = self.encode_batch(names_raw)
        # verbose=0 silencia a barra de progresso do Keras (útil para produção/logs)
        emb = self.model.predict(x, batch_size=batch_size, verbose=0)
        return emb

    def embed_single(self, name_raw: str) -> np.ndarray:
        """Helper para gerar embedding de uma única string.

        Args:
            name_raw (str): Texto de entrada.

        Returns:
            np.ndarray: Vetor com shape `(encoder_dim,)`.
        """
        return self.embed_batch([name_raw])[0] 

    def _build_encoder_model(self) -> Model:
        """Constrói o grafo do modelo Keras (Layers & Connections).

        Arquitetura:
        Input -> Embedding -> Conv1D -> GlobalMaxCooling -> Dense -> Output (L2 Norm)

        Returns:
            Model: O modelo Keras compilado (mas não treinado).
        """
        # Input: Sequência de inteiros
        name_inp = layers.Input(shape=(self.max_len,), dtype="int32", name="name_input")

        # 1. Camada de Embedding: Aprende representação vetorial de cada letra
        x = layers.Embedding(
            input_dim=len(self.char2idx) + 1, # +1 pelo padding (0)
            output_dim=self.char_emb_dim,
            mask_zero=False, # Masking desativado para compatibilidade com Conv1D
        )(name_inp)

        # 2. Extração de Features (Morfologia)
        # Filtros de tamanho 3 aprendem trigramas (sequências de 3 letras)
        x = layers.Conv1D(filters=64, kernel_size=3, padding="same", activation="relu")(x)
        
        # Pega a característica mais forte encontrada em qualquer lugar da palavra
        x = layers.GlobalMaxPooling1D()(x)
        
        # 3. Projeção no Espaço Semântico
        x = layers.Dense(128, activation="relu")(x)
        x = layers.Dropout(0.3)(x) # Regularização para evitar overfitting
        x = layers.Dense(self.encoder_dim, activation="relu")(x)

        # 4. Normalização Final (Lambda Layer)
        # Força o vetor a ter magnitude 1, permitindo uso de Similaridade de Cosseno
        z = layers.Lambda(
            lambda v: tf.math.l2_normalize(v, axis=1), 
            name="normalized_embedding"
        )(x)

        model = Model(inputs=name_inp, outputs=z, name="semantic_encoder_v2")
        return model