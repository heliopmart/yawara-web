from pathlib import Path

from app.services.ingestion import ingest_academic_record_from_pdf


PDF_DIR = Path("app/tests/docs/pdf_academic_historic")


def test_ingest_real_ufgd_pdf():
    pdf_path = PDF_DIR / "ufgd_academic_historic_test_1.pdf"

    with open(pdf_path, "rb") as f:
        pdf_bytes = f.read()

    record = ingest_academic_record_from_pdf(
        pdf_bytes=pdf_bytes,
        candidate_id="cand-real-test",
        cycle_id="cycle-real-test",
    )

    # Sanidade mínima
    assert record.candidate_id == "cand-real-test"
    assert record.cycle_id == "cycle-real-test"
    assert len(record.subjects) > 0

    # Teste estrutural de uma disciplina qualquer
    s0 = record.subjects[0]

    _print_record(record)

    assert s0.code.isdigit()
    assert isinstance(s0.subject_canonical, str)
    assert len(s0.subject_canonical) > 5
    assert s0.status in {"AP", "RP", "DS", "MA"}


def _print_record(record):
    for subject in record.subjects:
        print(subject.model_dump_json(indent=2))