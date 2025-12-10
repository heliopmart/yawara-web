import pytest
from datetime import datetime
from app.schemas.historic import SubjectRecord, AcademicRecord, academic_exclude_status

class TestHistoricSchemas:
    """Suíte de testes para validação dos modelos de dados (Schemas Pydantic).
    
    Foca na integridade dos dados, validação de tipos e lógica de exclusão de status.
    """

    def test_academic_record_creation_valid(self):
        """
        GIVEN (Dado): Um conjunto de dados válidos de um histórico escolar.
        WHEN (Quando): Instanciamos o AcademicRecord.
        THEN (Então): O objeto deve ser criado com sucesso e os campos preservados.
        """
        # Arrange
        data = {
            "candidate_id": "user_123",
            "cycle_id": "cycle_2025",
            "source": "TEST_SOURCE",
            "generated_at": datetime.utcnow(),
            "subjects": []
        }

        # Act
        record = AcademicRecord(**data)

        # Assert
        assert record.candidate_id == "user_123"
        assert len(record.subjects) == 0
        assert isinstance(record.generated_at, datetime)

    def test_subject_record_creation_valid(self):
        """
        GIVEN (Dado): Dados brutos de uma disciplina cursada com sucesso.
        WHEN (Quando): Instanciamos o SubjectRecord.
        THEN (Então): Os dados numéricos (nota, carga horária) devem estar tipados corretamente.
        """
        # Arrange
        data = {
            "period": "2023.1",
            "code": "MAT001",
            "name_raw": "Cálculo I",
            "subject_canonical": "CALCULO_1", # Campo adicionado na nova versão
            "grade": 8.5,
            "status": "AP",
            "workload_hours": 72,
            "absences": 0,
            "type": "OBR",
            "confidence": 0.99
        }

        # Act
        subject = SubjectRecord(**data)

        # Assert
        assert subject.grade == 8.5
        assert subject.status == "AP"
        assert subject.subject_canonical == "CALCULO_1"

    def test_academic_exclude_status_integrity(self):
        """
        GIVEN (Dado): A lista de status de exclusão definida no sistema.
        WHEN (Quando): Verificamos se status críticos de 'não-aproveitamento' estão presentes.
        THEN (Então): Status como 'TR' (Trancamento) e 'CAN' (Cancelado) devem estar na lista.
        
        Isso garante que ninguém removeu acidentalmente um status de filtro.
        """
        # Arrange & Act
        blocked_statuses = academic_exclude_status

        # Assert
        assert "TR" in blocked_statuses, "Trancamento deve ser ignorado"
        assert "MA" in blocked_statuses, "Cancelamento deve ser ignorado"
        assert "MT" in blocked_statuses, "Dispensa sem nota deve ser ignorada"
        assert "AP" not in blocked_statuses, "Aprovado NUNCA pode ser ignorado"