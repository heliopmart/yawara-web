from pathlib import Path
from app.services.ingestion import ingest_academic_record_from_pdf
from app.schemas.historic import AcademicRecord
from app.services.ingestion import ingest_academic_record_from_pdf


PDF_DIR = Path("app/tests/docs/pdf_academic_historic")

def test_full_ingestion_with_ai():
    pdf_path = PDF_DIR / "ufgd_academic_historic_test_1.pdf"

    with open(pdf_path, "rb") as f:
        pdf_bytes = f.read()

    record = ingest_academic_record_from_pdf(
        pdf_bytes=pdf_bytes,
        candidate_id="cand-real-test",
        cycle_id="cycle-real-test",
    )
    
    subjects = record.subjects
    assert len(subjects) == 3
    
    # Verifica se a IA normalizou os nomes
    # Nota: Isso requer que o arquivo .h5 exista e o resolver tenha carregado
    # Se estiver rodando em CI/CD sem os pesos, pode precisar mockar o get_resolver
    
    c1 = subjects[0]
    assert c1.name_raw == "Calc. Dif. e Int. I"
    # Se a rede estiver bem treinada:
    assert c1.subject_canonical == "CALCULO_DIFERENCIAL_INTEGRAL_1"
    
    c2 = subjects[1]
    assert c2.subject_canonical == "ALGORITMOS_PROGRAMACAO"