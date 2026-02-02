import pytest
import json
from app.services.selection_data import data_service

def test_get_nuclei_configuration_real():
    """
    Teste manual para verificar se o ID da edição retorna configurações de núcleos.
    """
    target_edition_id = "5532f3a6-ed9c-44d7-9365-d2e0843dea76"
    
    print(f"\n--- 🕵️‍♀️ Investigando Edição: {target_edition_id} ---")

    result = data_service.get_nuclei_configuration(target_edition_id)

    print("Nuclei Configuration Data: ------------------------- ")
    print(f"Total encontrado: {len(result)}")
    print(result)
    # print(json.dumps(result, indent=4, ensure_ascii=False))

    # Se a lista vier vazia, o teste falha aqui e te avisa
    assert len(result) > 0, f"⚠️ Nenhuma configuração encontrada para a edição {target_edition_id}!"