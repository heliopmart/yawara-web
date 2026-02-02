import pytest
import tensorflow as tf
import numpy as np
from app.ml.architectures.nucleus_recommender_nn import build_deep_set_architecture

def test_engine_v2_model_build_structure():
    """
    Verifica se o modelo Keras é construído com as camadas e shapes esperados.
    """
    # Configuração Fake
    nuclei = ["NÚCLEO DE HIDROGÊNIO", "NÚCLEO DE COMBUSTÃO", 'NÚCLEO DE SISTEMAS EMBARCADOS', 'NÚCLEO DE AERODINÂMICA']
    model = build_deep_set_architecture(
        max_subjects=80,
        hashing_bins_subjects=100,
        hashing_bins_courses=50,
        embedding_dim=16,
        nuclei_labels=nuclei
    )

    # 1. Verifica se compilou
    assert isinstance(model, tf.keras.Model)
    assert model.name == "Yawara_Engine_V2"

    # 2. Verifica as Entradas (Devem ser 4: Nomes, Meta, Semestre, Curso)
    assert len(model.inputs) == 4
    
    # 3. Verifica a Saída
    # A saída deve ser (None, 3) pois temos 3 núcleos
    output_shape = model.outputs[0].shape
    assert output_shape[1] == 3

def test_engine_v2_forward_pass():
    """
    Verifica se a rede consegue processar dados aleatórios sem explodir (Smoke Test).
    """
    nuclei = ["NÚCLEO DE HIDROGÊNIO", "NÚCLEO DE COMBUSTÃO", 'NÚCLEO DE SISTEMAS EMBARCADOS', 'NÚCLEO DE AERODINÂMICA']
    model = build_deep_set_architecture(
        max_subjects=10, # Versão mini
        hashing_bins_subjects=50,
        hashing_bins_courses=10,
        embedding_dim=8,
        nuclei_labels=nuclei
    )

    # Cria dados aleatórios (Batch size = 2)
    fake_names = np.random.randint(0, 50, size=(2, 10)).astype(str) # Simula hash input
    fake_meta = np.random.rand(2, 10, 2).astype(np.float32)
    fake_sem = np.array([[0.1], [0.5]], dtype=np.float32)
    fake_course = np.array([["MECANICA"], ["COMPUTACAO"]])

    # Tenta fazer a predição
    prediction = model.predict([fake_names, fake_meta, fake_sem, fake_course])

    # Asserções
    assert prediction.shape == (2, 2) # (2 exemplos, 2 núcleos)
    assert np.all((prediction >= 0.0) & (prediction <= 1.0)) # Probabilidade válida