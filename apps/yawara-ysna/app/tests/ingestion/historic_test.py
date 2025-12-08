from datetime import datetime
from app.schemas.historic import SubjectRecord, AcademicRecord
import pytest

@pytest.mark.asyncio
def test_academic_record_schema():
    """Teste básico para garantir que o schema AcademicRecord funciona conforme esperado."""

    sub = SubjectRecord(
        period="2024.2",
        code="06110003704",
        name_raw="CÁLCULO DIFERENCIAL E INTEGRAL II",
        subject_canonical="CALCULO_DIFERENCIAL_INTEGRAL_2",
        grade=7.8,
        status="AP",
        workload_hours=72,
        absences=4,
        type="OBR",
    )

    record = AcademicRecord(
        candidate_id="cand-123",
        cycle_id="cycle-2025",
        generated_at=datetime.utcnow(),
        source="UFGD_HISTORICO_OFICIAL",
        subjects=[sub],
    )

    print(record.model_dump())