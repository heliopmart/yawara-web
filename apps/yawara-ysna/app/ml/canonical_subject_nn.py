import tensorflow as tf
from tensorflow.keras import layers, Model
import numpy as np
from typing import Dict, List

class CanonicalSubjectNN:
    """
    Encoder neural focado exclusivamente na semântica textual.
    Versão V2: Removemos a dependência de códigos e listas fixas.
    """

    def __init__(
        self,
        vocab: str,
        max_len: int = 64,
        char_emb_dim: int = 64,
        encoder_dim: int = 128,
    ):
        self.vocab = vocab
        self.max_len = max_len
        self.char_emb_dim = char_emb_dim
        self.encoder_dim = encoder_dim

        # Mapeamento de caracteres
        self.char2idx: Dict[str, int] = {
            ch: i + 1 for i, ch in enumerate(vocab)
        }
        self.idx2char: Dict[int, str] = {
            i: ch for ch, i in self.char2idx.items()
        }

        # O modelo é construído para aceitar apenas texto (nome da matéria)
        self.model: Model = self._build_encoder_model()

    def encode_string(self, s: str) -> np.ndarray:
        s = (s or "").upper()[: self.max_len]
        ids: List[int] = []
        for ch in s:
            idx = self.char2idx.get(ch, 0)
            ids.append(idx)
        
        # Padding
        if len(ids) < self.max_len:
            ids += [0] * (self.max_len - len(ids))

        return np.array(ids, dtype="int32")

    def encode_batch(self, names_raw: List[str]) -> np.ndarray:
        """
        Processa apenas uma lista de nomes.
        Assinatura corrigida para receber apenas 1 argumento.
        """
        return np.stack([self.encode_string(n) for n in names_raw])

    def embed_batch(self, names_raw: List[str], batch_size: int = 32) -> np.ndarray:
        x = self.encode_batch(names_raw)
        # Atenção: agora passamos apenas 'x' (não é mais um dicionário com code_input)
        emb = self.model.predict(x, batch_size=batch_size, verbose=0)
        return emb

    def embed_single(self, name_raw: str) -> np.ndarray:
        return self.embed_batch([name_raw])[0] 

    def _build_encoder_model(self) -> Model:
        # Input único: O nome da disciplina
        name_inp = layers.Input(shape=(self.max_len,), dtype="int32", name="name_input")

        x = layers.Embedding(
            input_dim=len(self.char2idx) + 1,
            output_dim=self.char_emb_dim,
            mask_zero=False, 
        )(name_inp)

        x = layers.Conv1D(filters=64, kernel_size=3, padding="same", activation="relu")(x)
        x = layers.GlobalMaxPooling1D()(x)
        
        # Dense layers para criar o espaço semântico
        x = layers.Dense(128, activation="relu")(x)
        x = layers.Dropout(0.3)(x)
        x = layers.Dense(self.encoder_dim, activation="relu")(x)

        # Normalização para permitir busca por Cosseno
        z = layers.Lambda(
            lambda v: tf.math.l2_normalize(v, axis=1), 
            name="normalized_embedding"
        )(x)

        model = Model(inputs=name_inp, outputs=z, name="semantic_encoder_v2")
        return model