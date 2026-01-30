import tensorflow as tf
from tensorflow.keras import layers, models, Model
import numpy as np

CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 .-" 
MAX_LEN = 40

class CanonicalSubjectNN:
    """
    1D Character-Level CNN Architecture (Siamese Compatible).
    This class serves both for TRAINING (Siamese) and for INFERENCE (Encoder).
    """
    
    def __init__(self, vocab=None, encoder_dim=64):
        self.chars = CHARS
        self.char_to_idx = {c: i+1 for i, c in enumerate(self.chars)}
        self.vocab_size = len(self.chars) + 1 # +1 for padding (0)
        self.encoder_dim = encoder_dim
        
        self.model = self._build_architecture()
        self.encoder = self._extract_encoder()

    def _build_architecture(self):
        """
        Builds the complete Siamese architecture for training.
        Input: [InputA, InputB] -> Output: Score (0 to 1)
        """
        # --- THE ENCODER (Generate vector) ---
        input_layer = layers.Input(shape=(MAX_LEN,), name="char_input", dtype="int32")
        
        # Embedding: Transforms character indices into small dense vectors
        x = layers.Embedding(self.vocab_size, 32, mask_zero=True)(input_layer)
        
        # Convolutional Block (The "Scanner")
        # Conv1: Detects letter triplets (e.g., "ENG", "CAL")
        x = layers.Conv1D(64, 3, activation='relu', padding='same')(x)
        x = layers.MaxPooling1D(2)(x)
        
        # Conv2: Detects larger combined patterns
        x = layers.Conv1D(128, 3, activation='relu', padding='same')(x)
        x = layers.GlobalMaxPooling1D()(x) # Takes the strongest feature from the entire phrase
        
        # Final Projection (The identity vector)
        embedding_output = layers.Dense(self.encoder_dim, activation=None)(x) # Linear projection
        # L2 normalization is CRUCIAL for cosine/euclidean distance to work well
        embedding_output = layers.Lambda(lambda t: tf.math.l2_normalize(t, axis=1), name="l2_norm")(embedding_output)
        
        # Create the isolated Encoder model (we'll use this for inference later)
        self.encoder_model = Model(inputs=input_layer, outputs=embedding_output, name="encoder")

        # --- THE SIAMESE ARCHITECTURE (For Training) ---
        input_a = layers.Input(shape=(MAX_LEN,), name="input_a")
        input_b = layers.Input(shape=(MAX_LEN,), name="input_b")

        # Reuse the SAME encoder for both (shared weights)
        vec_a = self.encoder_model(input_a)
        vec_b = self.encoder_model(input_b)

        # Distance Layer (L1: |a - b|)
        L1_distance = layers.Lambda(lambda tensors: tf.abs(tensors[0] - tensors[1]))([vec_a, vec_b])
        
        # Classification: 1 = Same, 0 = Different
        prediction = layers.Dense(1, activation='sigmoid')(L1_distance)

        model = Model(inputs=[input_a, input_b], outputs=prediction, name="siamese_cnn")
        return model

    def _extract_encoder(self):
        """Returns only the part of the model that generates vectors."""
        return self.encoder_model

    def preprocess(self, texts):
        """Transforms a list of strings into a matrix of character indices."""
        if isinstance(texts, str): texts = [texts]
        
        matrix = np.zeros((len(texts), MAX_LEN), dtype="int32")
        for i, txt in enumerate(texts):
            txt = str(txt).upper().strip()
            for t, char in enumerate(txt):
                if t >= MAX_LEN: break
                matrix[i, t] = self.char_to_idx.get(char, 0) 
        return matrix

    def embed_batch(self, texts):
        """Generates vectors for a list of texts (Optimized for Low Latency)."""
        X = self.preprocess(texts)

        #  CRITICAL OPTIMIZATION 
        # .predict() is slow for small batches due to graph construction overhead.
        # Calling the model directly is much faster for real-time inference.
        
        # training=False for inference mode (disables dropout, etc.)
        vectors_tensor = self.encoder_model(X, training=False)
        
        return vectors_tensor.numpy()

    def embed_single(self, text):
        """Helper for a single text."""
        return self.embed_batch([text])[0]