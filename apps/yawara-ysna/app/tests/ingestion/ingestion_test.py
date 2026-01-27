import pytest
from unittest.mock import MagicMock, patch
from app.services.ingestion import parse_subject_line, parse_academic_history
from app.schemas.historic import SubjectRecord

class TestIngestionLogic:
    """Suíte de testes para a lógica de parsing de texto (Regex e Regras de Negócio).
    
    Testa a extração de linhas de disciplinas, detecção de semestres e
    integração simulada (Mock) com o resolvedor neural.
    """

    @pytest.fixture
    def mock_resolver(self):
        """Fixture que cria um mock do DynamicNeuralResolver."""
        with patch("app.services.ingestion._get_ai_resolver") as mock_get:
            resolver_instance = MagicMock()
            # Configura o comportamento padrão do mock: retorna o próprio nome inputado
            resolver_instance.resolve.return_value = {
                "canonical": "MOCKED_CANONICAL",
                "confidence": 0.95,
                "source": "MOCK"
            }
            mock_get.return_value = resolver_instance
            yield resolver_instance

    def test_parse_subject_line_valid_with_grade(self, mock_resolver):
        """
        GIVEN: Uma linha de texto padrão da UFGD contendo uma disciplina com nota.
        WHEN: O parser processa a linha.
        THEN: Todos os campos (código, nome, nota, faltas) devem ser extraídos corretamente.
        """
        # Arrange
        line = "12030540 - CALCULO DIFERENCIAL E INTEGRAL I 0 102 7,80 AP OBR"
        mock_resolver.resolve.return_value = {"canonical": "CALCULO_1", "confidence": 1.0}

        # Act
        result = parse_subject_line(line, period="2022.1")

        # Assert
        assert result is not None
        assert result.code == "12030540"
        assert result.name_raw == "CALCULO DIFERENCIAL E INTEGRAL I"
        assert result.grade == 7.80 # Testando conversão de vírgula para float
        assert result.absences == 0
        assert result.workload_hours == 102
        assert result.status == "AP"
        assert result.subject_canonical == "CALCULO_1"

    def test_parse_subject_line_valid_no_grade(self, mock_resolver):
        """
        GIVEN: Uma linha de disciplina "Matriculado" (MT) ou em curso, sem nota.
        WHEN: O parser processa a linha.
        THEN: O campo 'grade' deve ser None, mas o registro deve ser válido.
        """
        # Arrange
        line = "12030545 - FISICA GERAL I 0 68 MT OBR"
        
        # Act
        result = parse_subject_line(line, period="2023.2")

        # Assert
        assert result is not None
        assert result.grade is None
        assert result.status == "MT"
        assert result.name_raw == "FISICA GERAL I"

    def test_parse_subject_line_invalid_garbage(self, mock_resolver):
        """
        GIVEN: Uma linha de lixo (cabeçalho, rodapé, traço).
        WHEN: O parser processa a linha.
        THEN: Deve retornar None (ignorar silenciosamente).
        """
        lines = [
            "--------------------------------------------------",
            "Histórico Escolar - UFGD",
            "Página 1 de 2"
        ]
        for line in lines:
            assert parse_subject_line(line, "2023.1") is None

    def test_parse_full_history_context_switch(self, mock_resolver):
        """
        GIVEN: Um texto completo simulando dois semestres diferentes.
        WHEN: A função `parse_academic_history` é chamada.
        THEN: As disciplinas devem ser agrupadas com os períodos corretos (Context State).
        """
        # Arrange
        full_text = """
        2022.1
        10000101 - MATEMATICA A 0 60 9,0 AP OBR
        10000102 - FISICA A 4 60 8,5 AP OBR
        
        2022.2
        10000103 - MATEMATICA B 0 60 7,0 AP OBR
        """
        
        # Act
        history = parse_academic_history(full_text, "cand_1", "cycle_1")

        # Assert
        assert len(history.subjects) == 3
        
        # Verifica se o contexto "2022.1" foi aplicado às duas primeiras
        assert history.subjects[0].period == "2022.1"
        assert history.subjects[0].name_raw == "MATEMATICA A"
        assert history.subjects[1].period == "2022.1"
        
        # Verifica se o contexto mudou para "2022.2" na terceira
        assert history.subjects[2].period == "2022.2"
        assert history.subjects[2].name_raw == "MATEMATICA B"

    def test_neural_resolver_failure_fallback(self):
        """
        GIVEN: O Resolvedor Neural lança uma exceção (timeout, erro de memória).
        WHEN: Processamos uma disciplina.
        THEN: O sistema NÃO deve quebrar. Deve usar um fallback (ex: "ERROR_RESOLVING").
        """
        # Arrange
        with patch("app.services.ingestion._get_ai_resolver") as mock_get:
            # Simula um resolvedor que explode
            bad_resolver = MagicMock()
            bad_resolver.resolve.side_effect = Exception("Boom! GPU pegou fogo.")
            mock_get.return_value = bad_resolver
            
            line = "12345678 - CALCULO 1 0 60 5,0 AP OBR"
            
            # Act
            result = parse_subject_line(line, "2023.1")
            
            # Assert
            assert result is not None
            assert result.subject_canonical == "ERROR_RESOLVING" # O valor de fallback definido no código