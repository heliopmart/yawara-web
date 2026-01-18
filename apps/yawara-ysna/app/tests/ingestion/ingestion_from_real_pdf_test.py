import pytest
import os
from app.services.ingestion import ingest_academic_record_from_pdf

# Caminho relativo para o PDF de teste
PDF_PATH = "app/tests/docs/pdf_academic_historic/ufgd_academic_historic_test_2.pdf"

class TestRealPDFIngestion:
    """Teste de Integração End-to-End com arquivo PDF real.
    
    Verifica se a biblioteca `pdfplumber` consegue ler o arquivo físico
    e se o pipeline de ingestão produz um resultado coerente.
    """

    @pytest.mark.skipif(not os.path.exists(PDF_PATH), reason="Arquivo PDF de teste não encontrado.")
    def test_ingest_from_real_file(self):
        """
        GIVEN: Um arquivo PDF real da UFGD presente no disco.
        WHEN: O pipeline de ingestão é executado com os bytes desse arquivo.
        THEN: Deve retornar um AcademicRecord com disciplinas identificadas.
        """
        # Arrange
        with open(PDF_PATH, "rb") as f:
            pdf_bytes = f.read()

        # Act
        # Nota: Isso vai tentar usar o Resolver Neural real se ele carregar,
        # ou o fallback se não houver pesos. O teste deve passar em ambos os casos.
        record = ingest_academic_record_from_pdf(
            pdf_bytes=pdf_bytes,
            candidate_id="test_candidate",
            cycle_id="test_cycle"
        )

        # Assert
        assert record.candidate_id == "test_candidate"
        assert len(record.subjects) > 0, "Deveria ter encontrado disciplinas no PDF real"
        
        # Validação por amostragem (Spot Check)
        # Verifica se pegou pelo menos uma disciplina conhecida (ajuste conforme seu PDF de teste)
        # Exemplo genérico:
        first_subj = record.subjects[0]
        assert first_subj.period is not None
        assert first_subj.name_raw is not None
        assert first_subj.status is not None
        
        print(f"\n[INFO] PDF processado. Encontradas {len(record.subjects)} disciplinas.")
        print(f"[INFO] Exemplo: {first_subj.name_raw} -> {first_subj.subject_canonical}")