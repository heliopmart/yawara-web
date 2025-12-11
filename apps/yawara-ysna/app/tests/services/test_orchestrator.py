import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from app.services.selection_process import SelectionProcessOrchestrator
from app.schemas.engine_v1 import NucleusEligibilityResult

@pytest.mark.asyncio
async def test_orchestrator_full_flow():
    """
    Testa o fluxo 'End-to-End' simulado de um lote de candidatos.
    """

    # Setup: Mockando todas as dependências externas
    edition_id_test = "5532f3a6-ed9c-44d7-9365-d2e0843dea76"

    # --- CORREÇÃO 1: O Patch deve ser no LOCAL DE USO (selection_process), não na origem ---
    with patch("app.services.selection_process.data_service") as mock_data, \
            patch("app.services.selection_process.storage_service") as mock_storage, \
            patch("app.services.selection_process.ingest_academic_record_from_pdf") as mock_ingestion, \
            patch("app.services.selection_process.y_tse") as mock_engine, \
            patch("app.services.selection_process.db_update") as mock_db_update:

        # 1. Configurando o Cenário
        mock_data.get_nuclei_configuration.return_value = ["fake_rules"]
        mock_data.get_pending_candidates_queue.return_value = [
            {"user_id": "u1", "file_id": "f1"}
        ]

        # 2. Configurando download e ingestão
        mock_storage.get_file_bytes.return_value = b"PDF"

        # O mock AGORA é a própria função. Dizemos o que ela retorna.
        mock_ingestion.return_value = ["fake_history"]

        # 3. Configurando a Decisão da Engine
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
        result = await orchestrator.run_batch_screening(edition_id_test)

        # --- Asserções ---
        mock_storage.get_file_bytes.assert_called_with("f1")

        # --- CORREÇÃO 2: Chamamos o assert direto no objeto mock, sem sub-propriedades ---
        mock_ingestion.assert_called_with(
            b"PDF", 
            "u1", 
            edition_id_test
        )
        
        mock_db_update.assert_called_once()
        assert result["processed"] == 1