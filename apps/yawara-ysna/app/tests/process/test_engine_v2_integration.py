import pytest
import os
import shutil
import json
import numpy as np
from app.training.train_engine_v2 import train_synthetic, get_synthetic_data
from app.ml.engine_v2 import NucleusRecommendationEngine
from app.schemas.candidate import CandidateInput
from app.schemas.historic import SubjectRecord

# Diretório temporário para este teste
TEMP_MODEL_DIR = "app/tests/temp_engine_v2_model"

@pytest.fixture(scope="module")
def setup_teardown_training():
    """
    Fixture que roda UMA VEZ antes dos testes:
    1. Cria pasta temporária.
    2. Roda o treinamento sintético salvando nessa pasta.
    3. Limpa tudo no final.
    """
    os.makedirs(TEMP_MODEL_DIR, exist_ok=True)
    
    # Patch nos caminhos para salvar no temp
    model_path = f"{TEMP_MODEL_DIR}/engine_v2_synthetic.keras"
    labels_path = f"{TEMP_MODEL_DIR}/engine_v2_labels.json"
    
    # Precisamos modificar as constantes do script de treino temporariamente
    # (Ou refatorar o script para aceitar argumentos, mas vamos monkeypatching aqui)
    with pytest.MonkeyPatch.context() as m:
        m.setattr("app.training.train_engine_v2.MODEL_PATH", model_path)
        m.setattr("app.training.train_engine_v2.LABELS_PATH", labels_path)
        
        # Executa o treino real! (Vai criar os arquivos)
        train_synthetic()
        
    yield model_path, labels_path
    
    # Cleanup
    if os.path.exists(TEMP_MODEL_DIR):
        shutil.rmtree(TEMP_MODEL_DIR)

def test_full_cycle_train_and_inference(setup_teardown_training):
    """
    Testa se a Engine V2 consegue carregar e usar um modelo que acabou de ser treinado.
    """
    model_path, labels_path = setup_teardown_training
    
    # Verifica se os arquivos foram criados
    assert os.path.exists(model_path)
    assert os.path.exists(labels_path)
    
    # 1. Configura a Engine para ler da pasta temporária
    NucleusRecommendationEngine._instance = None # Reset Singleton
    
    # Injeta os caminhos no construtor (assumindo que alteramos __init__ para aceitar args opcionais
    # ou usamos monkeypatch na classe)
    with pytest.MonkeyPatch.context() as m:
        # Forçamos a Engine a olhar para nossos arquivos de teste
        # Você precisará ajustar sua Engine V2 para usar atributos ou config injetável
        # Aqui vou simular instanciando manualmente e setando os paths
        engine = NucleusRecommendationEngine()
        engine.model_path = model_path
        engine.labels_path = labels_path
        engine._load_artifacts() # Força recarga
        
        assert engine.model is not None
        assert len(engine.labels) > 0
        
        # 2. Prepara um Candidato "Gênio da Computação" (Igual ao dado sintético)
        candidate = CandidateInput(
            name="Integration Test", 
            course="ENGENHARIA_COMPUTACAO", 
            semester=4,
            subjects=[] 
        )
        
        history = [
            SubjectRecord(
                name_raw="Algoritmos", 
                subject_canonical="ALGORITMOS", 
                grade=9.5, 
                workload_hours=60,
                # Dados Dummy exigidos pelo Pydantic
                period="2023.1",
                code="CIC001",
                status="APROVADO",
                absences=0,
                type="OBRIGATORIA",
                confidence=1.0
            ),
            SubjectRecord(
                name_raw="Estrutura de Dados", 
                subject_canonical="ESTRUTURA_DADOS", 
                grade=9.0, 
                workload_hours=60,
                # Dados Dummy
                period="2023.2",
                code="CIC002",
                status="APROVADO",
                absences=0,
                type="OBRIGATORIA",
                confidence=1.0
            ),
            SubjectRecord(
                name_raw="Estrutura de Dados", 
                subject_canonical="CALCULO_1", 
                grade=9.0, 
                workload_hours=60,
                # Dados Dummy
                period="2023.2",
                code="CIC007",
                status="APROVADO",
                absences=0,
                type="OBRIGATORIA",
                confidence=1.0
            )
        ]
        
        # 3. Inferência Real
        result = engine.predict(candidate, history)
        
        # 4. Validação
        print(f"\nResultado da Integração: {result}")
        
        assert "predictions" in result
        assert len(result["predictions"]) == len(engine.labels)
        
        # No dataset sintético, Computação + Algoritmos = Bom em Eletrônica
        # Verificamos se a probabilidade não é zero (não podemos garantir valor exato em treino estocástico curto)
        prob_eletro = result["predictions"].get("NÚCLEO DE SISTEMAS EMBARCADOS", {}).get("score", 0)
        assert prob_eletro > 0.0