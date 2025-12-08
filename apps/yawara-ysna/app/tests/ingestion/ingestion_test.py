import pytest
from app.services.ingestion import parse_subject_line, parse_academic_history

# @pytest.mark.
def test_parse_subject_line_with_grade():
    line = "06110003704 - CÁLCULO DIFERENCIAL E INTEGRAL II 4 72 7.80 AP OBR"
    period = "2024.2"

    subj = parse_subject_line(line, period)

    assert subj is not None
    
    # print(subj.model_dump_json(indent=2))

    assert subj.period == "2024.2"
    assert subj.code == "06110003704"
    assert subj.name_raw.startswith("CÁLCULO DIFERENCIAL")
    assert subj.grade == 7.8
    assert subj.status == "AP"
    assert subj.workload_hours == 72
    assert subj.absences == 4
    assert subj.type == "OBR"

# @pytest.mark
def test_parse_subject_line_without_grade_numeric():
    line = "06110003879 - ÁLGEBRA LINEAR E GEOMETRIA ANALÍTICA 0 72 DS OBR"
    period = "2024.2"

    subj = parse_subject_line(line, period)

    assert subj is not None

    # print(subj.model_dump_json(indent=2))

    assert subj.grade is None          # não conseguiu converter pois a nota não existe
    assert subj.status == "DS"
    assert subj.workload_hours == 72
    assert subj.absences == 0
    assert subj.type == "OBR"



def test_parse_academic_history_basic():
    text = """
    2024.2
    06110003704 - CÁLCULO DIFERENCIAL E INTEGRAL II 4 72 7.80 AP OBR
    06110003879 - ÁLGEBRA LINEAR E GEOMETRIA ANALÍTICA 0 72 DS OBR

    2025.1
    06110001234 - FÍSICA III 3 72 6.20 AP OBR
    """.strip()

    candidate_id = "cand-xyz"
    cycle_id = "cycle-2025"

    record = parse_academic_history(
        text=text,
        candidate_id=candidate_id,
        cycle_id=cycle_id,
    )

    # sanity checks
    assert record.candidate_id == candidate_id
    assert record.cycle_id == cycle_id
    assert len(record.subjects) == 3

    # print(record.subjects[0].model_dump_json(indent=2))
    # print(record.subjects[1].model_dump_json(indent=2))
    # print(record.subjects[2].model_dump_json(indent=2))

    # primeira disciplina
    s0 = record.subjects[0]
    assert s0.period == "2024.2"
    assert s0.code == "06110003704"
    assert s0.subject_canonical == "CALCULO_DIFERENCIAL_E_INTEGRAL_II"
    assert s0.grade == 7.8
    assert s0.status == "AP"

    # segunda disciplina
    s1 = record.subjects[1]
    assert s1.period == "2024.2"
    assert s1.code == "06110003879"
    assert s1.subject_canonical == "ALGEBRA_LINEAR_E_GEOMETRIA_ANALITICA"
    assert s1.grade is None
    assert s1.status == "DS"

    # terceira disciplina, outro período
    s2 = record.subjects[2]
    assert s2.period == "2025.1"
    assert s2.code == "06110001234"
    assert s2.subject_canonical == "FISICA_III"  # se você tiver normalizado assim
    assert s2.grade == 6.2
    assert s2.status == "AP"