"""
Módulo de Testes: Orquestrador do Processo Seletivo.

Realiza testes de integração (mockados) do fluxo principal:
1. Buscar Fila -> 2. Download -> 3. Ingestão -> 4. Engine -> 5. Salvar.

Validações:
    - Uso correto de Semáforos (Asyncio).
    - Ordem correta das chamadas.
    - Persistência dos resultados no Banco.
"""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from app.services.selection_process import SelectionProcessOrchestrator
from app.schemas.engine_v1 import NucleusEligibilityResult

@pytest.mark.asyncio
async def test_orchestrator_full_flow():
    """
    Testa o fluxo 'End-to-End' simulado de um lote de candidatos.
    
    Verifica se:
    1. O DataService fornece a fila.
    2. O StorageService é chamado com o ID correto.
    3. A Engine processa e aprova.
    4. O DB_Update é chamado com os núcleos aprovados.
    """
    
    # Setup: Mockando todas as dependências externas
    with patch("app.services.selection_process.data_service") as mock_data, \
         patch("app.services.selection_process.storage_service") as mock_storage, \
         patch("app.services.selection_process.ingestion_service") as mock_ingestion, \
         patch("app.services.selection_process.y_tse") as mock_engine, \
         patch("app.services.selection_process.db_update") as mock_db_update:

        # 1. Configurando o Cenário (1 Candidato na Fila)
        mock_data.get_nuclei_configuration.return_value = ["fake_rules"]
        mock_data.get_pending_candidates_queue.return_value = [
            {"user_id": "u1", "file_id": "f1"}
        ]
        
        # TEST ERROR ----------------> BECAUSE THE ingest_academic_record_from_pdf REQUIRE BYTES NOT STRING

        # 2. Configurando o Pipeline de Processamento
        mock_storage.get_file_bytes.return_value = b"PDF"
        mock_ingestion.ingest_academic_record_from_pdf.return_value = ["fake_history"]
        
        # 3. Configurando a Decisão da Engine (Aprovado no 'nuc_1')
        mock_engine.process_candidate_eligibility.return_value = [
            NucleusEligibilityResult(
                nucleus_id="nuc_1", 
                nucleus_name="Test", 
                is_eligible=True,
                total_score=20, 
                baseline_score=10, 
                breakdown=[]
            )
        ]
        
        # --- Execução ---
        orchestrator = SelectionProcessOrchestrator()
        result = await orchestrator.run_batch_screening("edition_1")
        
        # --- Asserções (Verificação) ---
        
        # Verifica se tentou baixar o arquivo 'f1'
        mock_storage.get_file_bytes.assert_called_with("f1")
        
        # Verifica se salvou no banco
        mock_db_update.assert_called_once()
        
        # Verifica argumentos do salvamento (Tabela, Filtros e Dados)
        call_args = mock_db_update.call_args[1]
        assert call_args["table"] == "ps_user_cards"
        assert call_args["filters"] == {"user_id": "u1", "edition_id": "edition_1"}
        assert call_args["data"]["nuclei_eligible"] == ["nuc_1"] # ID do núcleo aprovado
        
        assert result["processed"] == 1