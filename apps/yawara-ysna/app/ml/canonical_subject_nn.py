# app/models/canonical_subject_nn.py
from typing import Dict, List
import numpy as np

import tensorflow as tf
from tensorflow.keras import layers, Model

class CanonicalSubjectNN:
    """
    Encoder neural para disciplinas acadêmicas.
    Versão Corrigida para Keras 3 / TF 2.x
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

        # 0 = padding / desconhecido, 1..N = caracteres válidos
        self.char2idx: Dict[str, int] = {
            ch: i + 1 for i, ch in enumerate(vocab)
        }
        self.idx2char: Dict[int, str] = {
            i: ch for ch, i in self.char2idx.items()
        }

        # Constrói o modelo
        self.model: Model = self._build_encoder_model()

    # ================================================
    # ============= DATA TEXT PREPARE ================
    # ================================================

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

    def encode_batch(self, codes: List[str], names_raw: List[str]) -> Dict[str, np.ndarray]:
        assert len(codes) == len(names_raw), "codes e names_raw devem ter o mesmo tamanho"
        x_code = np.stack([self.encode_string(c) for c in codes])
        x_name = np.stack([self.encode_string(n) for n in names_raw])
        return {"code_input": x_code, "name_input": x_name}

    # ================================================
    # ============== CONVERT TO TENSORS ==============
    # ================================================

    def _build_text_branch(self, input_name: str) -> tuple[tf.keras.Input, tf.Tensor]:
        inp = layers.Input(shape=(self.max_len,), dtype="int32", name=input_name)

        # CORREÇÃO 1: mask_zero=False para evitar warnings com Conv1D
        x = layers.Embedding(
            input_dim=len(self.char2idx) + 1,
            output_dim=self.char_emb_dim,
            mask_zero=False, 
        )(inp)

        x = layers.Conv1D(filters=64, kernel_size=3, padding="same", activation="relu")(x)
        x = layers.GlobalMaxPooling1D()(x)
        x = layers.Dense(64, activation="relu")(x)
        return inp, x

    # ================================================
    # ==================== embed =====================
    # ================================================

    def embed_batch(self, codes: List[str], names_raw: List[str], batch_size: int = 32) -> np.ndarray:
        x = self.encode_batch(codes, names_raw)
        # Atenção: predict retorna array, não tensor
        emb = self.model.predict(x, batch_size=batch_size, verbose=0)
        return emb

    def embed_single(self, code: str, name_raw: str) -> np.ndarray:
        emb = self.embed_batch([code], [name_raw])
        return emb[0] 
    
    # ================================================
    # ==================== CORE ======================
    # ================================================

    def _build_encoder_model(self) -> Model:
        code_inp, code_vec = self._build_text_branch("code_input")
        name_inp, name_vec = self._build_text_branch("name_input")

        x = layers.Concatenate()([code_vec, name_vec])
        x = layers.Dense(128, activation="relu")(x)
        x = layers.Dropout(0.3)(x)
        x = layers.Dense(self.encoder_dim, activation="relu")(x)

        # CORREÇÃO 2: Usar Layer Lambda para encapsular a operação do TensorFlow
        # Isso resolve o erro "KerasTensor cannot be used as input to TensorFlow function"
        z = layers.Lambda(
            lambda v: tf.math.l2_normalize(v, axis=1), 
            name="normalized_embedding"
        )(x)

        model = Model(
            inputs=[code_inp, name_inp],
            outputs=z,
            name="canonical_subject_encoder",
        )
        return model