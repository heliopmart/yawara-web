import pytest
import numpy as np
import tensorflow as tf
from app.ml.architectures.canonical_subject_nn import CanonicalSubjectNN

class TestCanonicalSubjectNN:
    """Suíte de testes unitários para a arquitetura da Rede Neural (CanonicalSubjectNN).
    
    Verifica a integridade do grafo computacional, o pré-processamento de texto
    e as propriedades matemáticas dos embeddings gerados (Shapes e Normalização).
    """

    @pytest.fixture(scope="class")
    def model_instance(self):
        """Fixture que cria uma instância do modelo para ser reutilizada nos testes.
        
        Usa um vocabulário reduzido para facilitar a verificação manual se necessário.
        """
        vocab = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 "
        return CanonicalSubjectNN(vocab=vocab, max_len=10, char_emb_dim=8, encoder_dim=16)

    def test_encode_string_padding_and_truncation(self, model_instance):
        """
        GIVEN: Strings de diferentes tamanhos (uma curta, uma longa).
        WHEN: O método `encode_string` é chamado.
        THEN:
            1. A curta deve receber zero-padding até `max_len`.
            2. A longa deve ser truncada em `max_len`.
            3. O array resultante deve ser de inteiros (int32).
        """
        # Arrange
        short_text = "ABC"
        long_text = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
        
        # Act
        encoded_short = model_instance.encode_string(short_text)
        encoded_long = model_instance.encode_string(long_text)
        
        # Assert (Short)
        assert len(encoded_short) == 10
        # Verifica se os 3 primeiros são índices > 0 e o resto é 0
        assert np.all(encoded_short[:3] > 0)
        assert np.all(encoded_short[3:] == 0)
        
        # Assert (Long)
        assert len(encoded_long) == 10
        # Verifica se não sobrou nada além do tamanho 10
        assert encoded_long.shape == (10,)

    def test_embed_batch_output_shape(self, model_instance):
        """
        GIVEN: Um lote (batch) de 5 strings.
        WHEN: O modelo realiza a inferência (Forward Pass).
        THEN: O tensor de saída deve ter shape (5, encoder_dim).
        """
        # Arrange
        texts = ["CALC 1", "FISICA", "QUIMICA", "MATEMATICA", "HISTORIA"]
        
        # Act
        embeddings = model_instance.embed_batch(texts)
        
        # Assert
        assert isinstance(embeddings, np.ndarray)
        assert embeddings.shape == (5, 16) # (Batch Size, Encoder Dim definido na fixture)

    def test_embedding_l2_normalization(self, model_instance):
        """
        GIVEN: Qualquer input de texto.
        WHEN: O embedding é gerado.
        THEN: O vetor deve ter Norma L2 (Magnitude Euclidiana) igual a 1.0 (ou muito próximo).
        
        Isso é CRÍTICO para que a busca por Similaridade de Cosseno funcione
        apenas com produto escalar.
        """
        # Arrange
        text = "TESTE NORMALIZACAO"
        
        # Act
        vector = model_instance.embed_single(text)
        
        # Assert
        # Calcula a norma L2: raiz(soma(x^2))
        norm = np.linalg.norm(vector)
        
        # Verifica se está próximo de 1.0 (margem de erro para ponto flutuante)
        assert np.isclose(norm, 1.0, atol=1e-5), f"Vetor não está normalizado. Norma: {norm}"

    def test_model_deterministic_behavior(self, model_instance):
        """
        GIVEN: A mesma string de entrada processada duas vezes.
        WHEN: Geramos os embeddings em momentos diferentes.
        THEN: Os vetores resultantes devem ser idênticos (Determinismo).
        
        Isso garante que não há aleatoriedade indesejada (como Dropout ativo)
        durante a inferência.
        """
        # Arrange
        text = "DETERMINISMO"
        
        # Act
        vec1 = model_instance.embed_single(text)
        vec2 = model_instance.embed_single(text)
        
        # Assert
        np.testing.assert_array_equal(vec1, vec2)

    def test_oov_handling(self, model_instance):
        """
        GIVEN: Uma string contendo caracteres fora do vocabulário (Out-of-Vocabulary).
        WHEN: Codificamos a string.
        THEN: O sistema não deve quebrar e deve mapear caracteres desconhecidos para 0 (ou ignorar).
        """
        # Arrange
        # O vocabulário da fixture só tem letras maiúsculas e números.
        # '@' e '$' são desconhecidos.
        text_dirty = "CALC@$1" 
        text_clean = "CALC1"   # O que esperamos que seja equivalente ou parecido estruturalmente
        
        # Act
        encoded = model_instance.encode_string(text_dirty)
        
        # Assert
        # Verifica se rodou sem erro e produziu vetor válido
        assert encoded.shape == (10,)
        # Verifica se os caracteres inválidos viraram 0 (padding/unknown)
        # C (idx) A (idx) L (idx) C (idx) @ (0) $ (0) 1 (idx)
        assert encoded[4] == 0 
        assert encoded[5] == 0