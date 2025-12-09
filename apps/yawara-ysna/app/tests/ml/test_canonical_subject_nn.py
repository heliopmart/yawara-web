import pytest
import numpy as np
import os
from app.services.neural_resolver import NeuralCanonicalResolver

# Mock ou Path real dos pesos (Para teste, idealmente ter um peso dummy ou mockar)
WEIGHTS_PATH = "app/resources/models/yawara_encoder_v1.weights.h5"

@pytest.mark.skipif(not os.path.exists(WEIGHTS_PATH), reason="Arquivo de pesos não encontrado")
def test_neural_resolution_logic():
    # Inicializa
    resolver = NeuralCanonicalResolver(WEIGHTS_PATH)
    
    # Caso 1: Match Exato ou Muito Próximo
    # A rede deve entender que isso é Calculo 1
    result = resolver.resolve("Calc. Diferencial e Int. I", "0611001")
    assert result == "CALCULO_DIFERENCIAL_INTEGRAL_1"
    
    # Caso 2: Algo nada a ver (deve cair no threshold)
    result_bad = resolver.resolve("Culinária Avançada 2", "000")
    assert "UNKNOWN" in result_bad

    # Caso 3: Ambiguidade (Física vs Calculo)
    vec_calc = resolver.nn.embed_single("000", "Calculo 1")
    vec_fis = resolver.nn.embed_single("000", "Fisica 1")
    
    # O produto escalar deve ser baixo (menor que 1.0)
    similarity = np.dot(vec_calc, vec_fis)
    assert similarity < 0.95 # Eles devem ser distintos