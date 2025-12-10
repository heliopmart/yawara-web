import pytest
import os
from unittest.mock import patch, MagicMock
from app.services.ingestion import ingest_academic_record_from_pdf
from app.schemas.historic import AcademicRecord

# Caminho relativo para o PDF real (ajustado para a estrutura de pastas do teste)
# O teste roda a partir da raiz ou da pasta do teste, então usamos path absoluto relativo ao arquivo
REAL_PDF_PATH = os.path.join(
    os.path.dirname(__file__), 
    "../docs/pdf_academic_historic/ufgd_academic_historic_test_1.pdf"
)

class TestEndToEndPipeline:
    """Teste de Integração do Pipeline de Processamento (Ingestão -> IA -> Domínio).
    
    Verifica a orquestração completa entre:
    1. Camada de Arquivo (pdfplumber).
    2. Camada de Parsing (Regex/Ingestion).
    3. Camada de Inteligência (Neural Resolver).
    4. Camada de Dados (Schemas).
    """

    @pytest.fixture
    def mock_neural_resolver(self):
        """Fixture que intercepta o Resolver Neural para garantir determinismo.
        
        Mesmo usando o PDF real, mockamos a IA para não depender de pesos (.h5)
        ou GPU no ambiente de teste (CI/CD), focando no teste do *processo* de ingestão.
        """
        with patch("app.services.ingestion._get_ai_resolver") as mock_get:
            resolver = MagicMock()
            
            # Simula respostas da IA para disciplinas que sabemos que existem no PDF
            def resolve_side_effect(name):
                # Normalização simples para o mock (Upper + Underscore)
                return {
                    "canonical": name.upper().replace(" ", "_").replace(".", ""),
                    "confidence": 0.95,
                    "source": "MOCK_INTEGRATION"
                }
            
            resolver.resolve.side_effect = resolve_side_effect
            mock_get.return_value = resolver
            yield resolver

    @pytest.mark.skipif(not os.path.exists(REAL_PDF_PATH), reason="PDF de teste não encontrado (ufgd_academic_historic_test_1.pdf)")
    def test_pipeline_with_real_pdf_file(self, mock_neural_resolver):
        """
        GIVEN (Dado): O arquivo PDF oficial de teste 'ufgd_academic_historic_test_1.pdf'.
        WHEN (Quando): Submetemos este arquivo binário ao pipeline de ingestão completo.
        THEN (Então): 
            1. O pdfplumber deve extrair o texto sem erros.
            2. O parser deve identificar múltiplas disciplinas.
            3. O objeto retornado deve ser um AcademicRecord válido.
        """
        # Arrange
        print(f"\n[INTEGRATION] Lendo PDF real em: {REAL_PDF_PATH}")
        with open(REAL_PDF_PATH, "rb") as f:
            pdf_bytes = f.read()

        candidate_id = "real_pdf_tester"
        cycle_id = "cycle_2024"

        # Act
        result = ingest_academic_record_from_pdf(
            pdf_bytes, 
            candidate_id, 
            cycle_id
        )

        # Assert (Validação Macro)
        assert isinstance(result, AcademicRecord)
        assert result.candidate_id == candidate_id
        assert len(result.subjects) > 0, "O parser falhou em encontrar disciplinas no PDF real!"

        # Assert (Spot Check - Verificação por Amostragem)
        # Vamos pegar a primeira disciplina encontrada para garantir que os dados não estão vazios
        first_subject = result.subjects[0]
        
        print(f"[INTEGRATION] Sucesso! Encontradas {len(result.subjects)} disciplinas.")
        print(f"[INTEGRATION] Amostra: {first_subject.name_raw} | Nota: {first_subject.grade} | Status: {first_subject.status}")

        assert first_subject.name_raw is not None
        assert first_subject.code is not None
        # Garante que o Mock da IA foi chamado e preencheu o canonical
        assert first_subject.subject_canonical is not None
        assert first_subject.confidence == 0.95

    def test_pipeline_resilience_structure(self, mock_neural_resolver):
        """
        GIVEN: Um 'PDF' simulado (bytes) contendo texto estruturado corretamente.
        WHEN: O pipeline processa esses bytes.
        THEN: Deve montar a estrutura hierárquica (Period -> Subjects) corretamente.
        """
        # Arrange
        # Simulamos o texto que o pdfplumber retornaria
        fake_text_content = """
        2023.1
        10000101 - CALCULO 1 0 72 8,5 AP OBR
        
        2023.2
        10000102 - FISICA 1 4 72 7,0 AP OBR
        """
        
        with patch("app.services.ingestion.extract_text_from_pdf", return_value=fake_text_content):
            # Act
            result = ingest_academic_record_from_pdf(b"fake_bytes", "user_x", "cycle_x")

            # Assert
            assert len(result.subjects) == 2
            
            subj_1 = result.subjects[0]
            assert subj_1.period == "2023.1"
            assert subj_1.name_raw == "CALCULO 1"
            
            subj_2 = result.subjects[1]
            assert subj_2.period == "2023.2"
            assert subj_2.name_raw == "FISICA 1"

    def test_pipeline_ai_failure_fallback(self):
        """
        GIVEN: O Serviço de IA está inoperante (retorna None).
        WHEN: Processamos um PDF real ou simulado.
        THEN: O sistema DEVE continuar e marcar as disciplinas como não resolvidas, sem crash.
        """
        # Arrange
        with patch("app.services.ingestion._get_ai_resolver", return_value=None):
            with patch("app.services.ingestion.extract_text_from_pdf", return_value="10000101 - TESTE 0 10 10 AP OBR"):
                
                # Act
                result = ingest_academic_record_from_pdf(b"bytes", "u", "c")
                
                # Assert
                assert len(result.subjects) == 1
                assert result.subjects[0].subject_canonical == "AI_UNAVAILABLE"