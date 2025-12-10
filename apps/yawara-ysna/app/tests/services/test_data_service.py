"""
Módulo de Testes: Data Service (Camada de Dados).

Testa a recuperação e transformação de dados do Supabase para o formato da Engine.
Foca em garantir que os JOINs manuais e a filtragem de JSONs funcionam corretamente.

Classes Testadas:
    - SelectionDataService
"""

import pytest
from unittest.mock import patch, MagicMock
from app.services.selection_data import SelectionDataService

@pytest.fixture
def data_service():
    """Fixture para instância do serviço."""
    return SelectionDataService()

def mock_db_select_nuclei_logic(table, filters=None, single=False, **kwargs):
    """
    Simula o comportamento do banco de dados retornando dados falsos
    baseados na tabela solicitada.
    """
    if table == "nuclei_configs":
        # Retorna 1 configuração ativa
        return [{
            "id": "config_uuid_1",
            "nucleus_id": "nuc_uuid_1",
            "learned_baseline_score": 15.0
        }]
    
    if table == "nuclei":
        # Retorna detalhes do núcleo
        return {"name": "Powertrain"}
    
    if table == "nuclei_subject_weights":
        # Retorna os pesos associados àquela config
        return [
            {"subject_canonical": "Cálculo 1", "weight": 2.0},
            {"subject_canonical": "Física 1", "weight": 1.0}
        ]
    
    return []

@patch("app.services.selection_data.db_select")
def test_get_nuclei_configuration_structure(mock_db_select, data_service):
    """
    Verifica se o serviço monta corretamente o objeto `NucleusRequirementsInput`.
    
    Fluxo Testado:
        1. Busca Config -> 2. Busca Nome do Núcleo -> 3. Busca Pesos.
    
    Expectativa:
        Retornar uma lista de objetos com 'weights' transformados em dicionário.
    """
    # Configura o mock para responder dinamicamente dependendo da tabela
    mock_db_select.side_effect = mock_db_select_nuclei_logic
    
    result = data_service.get_nuclei_configuration("edition_1")
    
    assert len(result) == 1
    nucleus = result[0]
    
    assert nucleus.nucleus_name == "Powertrain"
    assert nucleus.baseline_score == 15.0
    # Verifica a transformação de Lista -> Dict
    assert nucleus.weights == {"Cálculo 1": 2.0, "Física 1": 1.0}

@patch("app.services.selection_data.db_select")
def test_get_pending_queue_filtering(mock_db_select, data_service):
    """
    Testa a lógica de filtragem da Fila de Candidatos.
    
    Cenários Simulados na mesma lista:
        - User A: Já processado (nuclei_eligible existe) -> Deve ser ignorado.
        - User B: Card incompleto (state != COMPLETED) -> Deve ser ignorado.
        - User C: Card completo e arquivo válido -> Deve entrar na fila.
    
    Expectativa:
        Retornar apenas o User C.
    """
    
    # Dados simulados da tabela ps_user_cards
    mock_db_select.return_value = [
        # Caso 1: Já processado (Ignorar)
        {
            "user_id": "user_A",
            "nuclei_eligible": ["nuc_1"], 
            "cards_progress": [{"card_id": 1, "state": "COMPLETED", "file_id": "f_A"}]
        },
        # Caso 2: Incompleto (Ignorar)
        {
            "user_id": "user_B",
            "nuclei_eligible": None,
            "cards_progress": [{"card_id": 1, "state": "PENDING", "file_id": None}]
        },
        # Caso 3: Pendente e Válido (Pegar!)
        {
            "user_id": "user_C",
            "nuclei_eligible": None,
            "cards_progress": [
                {"card_id": 2, "state": "PENDING"}, # Card irrelevante
                {"card_id": 1, "state": "COMPLETED", "file_id": "file_uuid_C"} # O Alvo
            ]
        }
    ]
    
    queue = data_service.get_pending_candidates_queue("5532f3a6-ed9c-44d7-9365-d2e0843dea76")

    assert len(queue) == 1
    assert queue[0]["user_id"] == "user_C"
    assert queue[0]["file_id"] == "file_uuid_C"