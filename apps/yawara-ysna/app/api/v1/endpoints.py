from fastapi import APIRouter, UploadFile, File, HTTPException, Response
from app.services.ingestion import ingest_academic_record_from_pdf
from app.schemas.historic import AcademicRecord

from app.ml.pipeline import selection_pipeline
from app.services.pdf_report_service import pdf_report_service
from app.schemas.report import CandidateReportBundle
from app.services.html_report_service import html_report_service

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

@router.get("/preview-pdf/{candidate_id}")
async def preview_pdf(candidate_id: str):
    """
    Endpoint de DEBUG para visualizar o PDF gerado em tempo real.
    Retorna o binário application/pdf para abrir no navegador.
    """
    try:
        # 1. Roda a Engine (Modo 'Uber') para pegar os dados frescos
        # Nota: Isso vai reprocessar a rede neural. Se quiser rapidez, 
        # poderia buscar do banco, mas para preview de dev queremos ver a mudança na hora.
        result = await selection_pipeline.process_candidate(candidate_id)
        
        # if not result.get("result", {}).get("success"):
        #     raise HTTPException(status_code=400, detail=f"Falha na Engine: {result}")

        # 2. Extrai o Bundle de Relatório que o BaseEngineService preparou
        report_data = result.get("xai", {}).get("report_bundle")
        
        if not report_data:
            raise HTTPException(status_code=404, detail="O Engine rodou, mas não gerou relatório XAI (Bundle vazio).")

        # 3. Converte o dict de volta para o Objeto Pydantic (O PDFService espera objeto)
        bundle = CandidateReportBundle(**report_data)

        # 2. Gera PDF usando a nova fábrica
        pdf_bytes = html_report_service.generate_pdf_bytes(bundle)

        # 5. Retorna como arquivo para o browser
        return Response(
            content=pdf_bytes, 
            media_type="application/pdf",
            headers={"Content-Disposition": f"inline; filename=report_{candidate_id}.pdf"}
        )

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

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