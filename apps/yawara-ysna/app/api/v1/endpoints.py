from fastapi import APIRouter, UploadFile, File, HTTPException
from app.services.ingestion import ingest_academic_record_from_pdf
from app.schemas.historic import AcademicRecord
from app.ml.pipeline import selection_pipeline

router = APIRouter()

@router.post("/upload/academic_history", response_model=AcademicRecord)
async def ingest_ufgd_academic_record(
    file: UploadFile = File(...),
    candidate_id: str = "candidate-from-token",
    cycle_id: str = "cycle-from-context",
):
    try: 
        pdf_bytes = await file.read()
        record = ingest_academic_record_from_pdf(
            pdf_bytes=pdf_bytes,
            candidate_id=candidate_id,
            cycle_id=cycle_id,
            source="UFGD_HISTORICO_OFICIAL",
        )
        return record
    except Exception as e:
        raise HTTPException(500, detail=f"Erro no processamento: {str(e)}")
    
@router.post("/evaluate/{candidate_id}")
async def evaluate_candidate_on_demand(candidate_id: str):
    """
    Avalia um candidato específico usando a estratégia definida no Pipeline (V1/V2/Auto).
    """
    try:
        result = await selection_pipeline.process_candidate(candidate_id)
        
        # if not result.get("success"):
        #     raise HTTPException(status_code=400, detail=f"Falha na avaliação: {result.get('error')}")
            
        return {
            "message": "Avaliação concluída com sucesso.",
            "details": result
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro interno do servidor: {str(e)}")