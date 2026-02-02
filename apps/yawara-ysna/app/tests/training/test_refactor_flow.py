import pytest
import os
import json
import numpy as np
from unittest.mock import MagicMock, patch
from dataclasses import asdict

# Importamos as classes que você refatorou
from app.training.artifacts import ArtifactStore, TrainingState, atomic_write_json
from app.training.train_engine_v2 import TrainingEngineV2
# Importamos configurações para garantir que não estamos usando variáveis de prod
from app.core.config import settings

# ---------------------------------------------------------
# 🛠️ Mocks e Fixtures (A nossa "Bancada de Laboratório")
# ---------------------------------------------------------

@pytest.fixture
def mock_storage():
    """Simula o Cloudinary/S3 para não fazer upload real."""
    storage = MagicMock()
    # Simula download retornando False (arquivo não existe na nuvem) por padrão
    storage.download_file.return_value = False 
    return storage

@pytest.fixture
def temp_artifacts_dir(tmp_path):
    """Cria um diretório temporário para os artefatos locais."""
    d = tmp_path / "artifacts"
    d.mkdir()
    return str(d)

@pytest.fixture
def mock_db_data():
    """Gera dados fake para enganar o motor de treino."""
    # Simula 2 chunks de dados. 
    # Chunk 1: IDs 1 a 100
    # Chunk 2: IDs 101 a 200
    # Depois: Vazio (fim)
    
    def generate_chunk(start_id, count, has_more=True):
        rows = []
        for i in range(count):
            rows.append({
                "id": start_id + i,
                "input_vector": [0.1, 0.2, 0.3] * 10, # Fake vector dim 30? Ajuste conforme arquitetura
                "target_label": "NUCLEO_TESTE"
            })
        return {
            "rows": rows,
            "next_after_pm_id": start_id + count,
            "has_more": has_more
        }

    return generate_chunk

# ---------------------------------------------------------
# 🧪 Testes Unitários: ArtifactStore
# ---------------------------------------------------------

def test_artifact_store_save_load(mock_storage, temp_artifacts_dir):
    """
    Verifica se o ArtifactStore consegue salvar e carregar o estado localmente.
    É a base da persistência.
    """
    store = ArtifactStore(storage_service=mock_storage, local_tmp_dir=temp_artifacts_dir)
    
    # 1. Criar um estado fake
    state = TrainingState(
        run_id="run_123",
        model_id="model_v2",
        labels_id="labels_v2",
        last_processed_id=500,
        total_epochs_trained=5,
        best_val_loss=0.45,
        no_improve_runs=0,
        stage="training"
    )
    
    # 2. Salvar
    local_path = store.local_path("state.json")
    store.save_state_local(state, local_path)
    
    # 3. Verificar se arquivo existe
    assert os.path.exists(local_path)
    
    # 4. Carregar e comparar
    loaded_state = store.load_state_local(local_path)
    assert loaded_state is not None
    assert loaded_state.run_id == "run_123"
    assert loaded_state.last_processed_id == 500

# ---------------------------------------------------------
# 🔬 Testes de Integração: Fluxo do Engine
# ---------------------------------------------------------

@patch("app.training.train_engine_v2.fetch_training_dataset_chunk")
@patch("app.training.train_engine_v2.fetch_nuclei_labels")
@patch("app.training.train_engine_v2.StorageService") # Mocka a instância dentro da classe
def test_engine_v2_resume_logic(mock_storage_cls, mock_fetch_labels, mock_fetch_chunk, mock_db_data, temp_artifacts_dir):
    """
    O TESTE DE OURO 🏆:
    Simula uma 'queda' e verifica se o resume funciona.
    """
    
    # --- Configuração do Cenário ---
    
    # 1. Configurar Mocks
    mock_storage_instance = mock_storage_cls.return_value
    # O mock do storage precisa aceitar qualquer chamada sem explodir
    mock_storage_instance.download_file.return_value = False 
    
    # Labels fake
    mock_fetch_labels.return_value = ["NUCLEO_A", "NUCLEO_B", "NUCLEO_TESTE"]
    
    # 2. Instanciar Engine
    engine = TrainingEngineV2(is_test=True) # is_test=True deve usar configurações mais leves
    
    # Forçar diretório temporário do engine para o nosso controlado pelo pytest
    # (Supondo que você possa injetar ou modificar o artifact_store, ou mockar o caminho)
    # Aqui, vamos fazer um 'monkeypatch' manual nos paths se necessário, 
    # mas se o ArtifactStore usa config, melhor mockar o config.
    # Vamos assumir que o engine instancia o ArtifactStore internamente.
    # Para o teste, vamos interceptar a criação do ArtifactStore dentro do engine se possível,
    # ou confiar que ele vai escrever no /tmp.
    # DICA: Na sua refatoração, permita injetar o path ou o ArtifactStore no __init__ para facilitar testes!
    
    # Vamos "hackear" o engine para usar nosso path temporário
    engine.artifact_store.tmp_dir = temp_artifacts_dir 

    # --- FASE 1: Primeira Execução (Parcial) ---
    print("\n--- 🎬 Iniciando Fase 1: Treino Parcial ---")
    
    # Simulando DB: Retorna 1 chunk de 100 linhas e diz que tem mais
    chunk1 = mock_db_data(start_id=0, count=100, has_more=True)
    
    # Configuramos o mock para retornar chunk1 na primeira chamada
    mock_fetch_chunk.side_effect = [chunk1] 

    # Executamos o treino (simulando limite de tempo ou chunks)
    # Vamos forçar o loop a parar após 1 iteração simulando a lógica interna
    # Ou simplesmente chamamos _train_chunk se o método for acessível.
    # Mas vamos tentar pelo método público principal se existir, ou `train_step`.
    
    # Assumindo que você tem um método principal tipo `run_cycle` ou `train_model`.
    # Vou simular a lógica interna de processamento de chunk aqui para testar o estado.
    
    # 1. Carrega estado (vai ser novo)
    state = engine._load_or_init_state()
    assert state.last_processed_id == 0
    
    # 2. Processa o chunk 1
    # Fingimos que treinamos e atualizamos o ID
    new_cursor = chunk1["next_after_pm_id"]
    state.last_processed_id = new_cursor
    state.total_epochs_trained += 1
    
    # 3. Salva o estado (Simulando o callback ou o fim do loop)
    engine.artifact_store.save_state_local(state, engine.artifact_store.local_path("training_state.json"))
    
    print(f"Estado salvo com cursor: {state.last_processed_id}")
    
    # --- FASE 2: O Crash (Simulado) ---
    # Destruímos a instância do engine e criamos uma nova
    del engine
    
    print("\n--- 💥 Crash Simulado (Reiniciando Engine) ---")
    
    engine_reborn = TrainingEngineV2(is_test=True)
    engine_reborn.artifact_store.tmp_dir = temp_artifacts_dir # Aponta para o mesmo disco
    
    # --- FASE 3: O Resume ---
    print("--- 🔄 Iniciando Fase 3: Resume ---")
    
    # Agora o mock do DB deve ser chamado pedindo dados APÓS o 100
    chunk2 = mock_db_data(start_id=100, count=50, has_more=False)
    mock_fetch_chunk.side_effect = [chunk2] 
    
    # Carregamos o estado
    restored_state = engine_reborn._load_or_init_state()
    
    # VERIFICAÇÃO CRÍTICA
    assert restored_state.last_processed_id == 100, f"Engine deveria retomar do 100, mas veio {restored_state.last_processed_id}"
    assert restored_state.total_epochs_trained == 1, "Deveria lembrar que já treinou 1 época"
    
    print(f"✅ Sucesso! Engine retomou do ID {restored_state.last_processed_id}")

    # Simula processamento do resto
    restored_state.last_processed_id = chunk2["next_after_pm_id"]
    
    assert restored_state.last_processed_id == 150