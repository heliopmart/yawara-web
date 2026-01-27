import pytest
from unittest.mock import MagicMock, patch, mock_open
import numpy as np
from app.ml.engine_v2 import NucleusRecommendationEngine, get_recommender
from app.schemas.candidate import CandidateInput
from app.schemas.historic import SubjectRecord

# Dados Fake para teste
FAKE_CANDIDATE = CandidateInput(
    name="Helio Teste", email="h@test.com", cpf="123", 
    phone="123", course="ENGENHARIA_COMPUTACAO", semester=5
)
FAKE_HISTORIC = [
    SubjectRecord(name_raw="Calculo 1", subject_canonical="CALCULO_1", grade=9.0, workload_hours=60)
]

@pytest.fixture
def mock_engine_artifacts():
    """Mocka o carregamento do modelo e do JSON para não depender de arquivos."""
    with patch("tensorflow.keras.models.load_model") as mock_load, \
         patch("builtins.open", mock_open(read_data='["AERO", "BAJA"]')) as mock_file:
        
        # O modelo mockado deve retornar uma predição fixa quando chamado
        mock_model = MagicMock()
        # Simula retorno: [0.8, 0.2] (AERO=80%, BAJA=20%)
        mock_model.predict.return_value = np.array([[0.8, 0.2]]) 
        mock_load.return_value = mock_model
        
        yield mock_model

def test_engine_prediction_logic(mock_engine_artifacts):
    """
    Testa se a engine traduz corretamente probabilidades em Recomendações.
    """
    # 1. Reseta o Singleton para garantir teste limpo
    NucleusRecommendationEngine._instance = None
    
    # 2. Inicializa (vai usar os mocks)
    engine = get_recommender()
    
    # 3. Executa a predição
    result = engine.predict(FAKE_CANDIDATE, FAKE_HISTORIC)
    
    # 4. Asserções Lógicas
    predictions = result["predictions"]
    
    # AERO (0.8) deve estar UNLOCKED
    assert predictions["NÚCLEO DE AERODINÂMICA"]["status"] == "UNLOCKED"
    assert predictions["NÚCLEO DE AERODINÂMICA"]["score"] == 0.8
    
    # BAJA (0.2) deve estar LOCKED
    assert predictions["NÚCLEO DE SISTEMAS EMBARCADOS"]["status"] == "LOCKED"
    
    # Lista final
    assert "NÚCLEO DE AERODINÂMICA" in result["recommended_nuclei"]
    assert "NÚCLEO DE SISTEMAS EMBARCADOS" not in result["recommended_nuclei"]

def test_engine_graceful_failure():
    """Se não houver modelo, não deve quebrar a API, deve retornar vazio."""
    NucleusRecommendationEngine._instance = None
    
    # Patch para simular arquivo inexistente
    with patch("os.path.exists", return_value=False):
        engine = get_recommender()
        result = engine.predict(FAKE_CANDIDATE, FAKE_HISTORIC)
        
        assert "error" in result
        assert result["recommendations"] == []