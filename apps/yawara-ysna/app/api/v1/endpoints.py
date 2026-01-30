import logging
import time
import tensorflow as tf
from fastapi import APIRouter, UploadFile, File, HTTPException, Response, status, Body
from fastapi.concurrency import run_in_threadpool
from typing import List

# Serviços e Schemas
from app.services.ingestion import ingest_academic_record_from_pdf
from app.schemas.historic import AcademicRecord, SubjectRecord
from app.ml.pipeline import selection_pipeline
from app.schemas.report import CandidateReportBundle
from app.services.html_report_service import html_report_service

# Imports dos Engines e Schemas
from app.ml.engine_v2 import get_recommender
from app.services.neural_resolver import get_resolver
from app.schemas.candidate import CandidateInput
from app.ml.valence_engine import ValenceEngine, ForgeOutput, CandidateProfile

# TODO: IMPLEMENTAÇÃO DOS ENDPOINTS -> miss test endpoint

logger = logging.getLogger("yawara.api.endpoints")

router = APIRouter()


@router.post("/valence/forge", response_model=ForgeOutput)
async def run_valence_forge(
    candidates: List[CandidateProfile], 
    team_size: int = 4
):
    """
    Executa a Valence Engine (Algoritmo Genético) para alocação ótima de times.
    Baseado em matriz de competência vetorial e complementariedade.
    """
    try:
        engine = ValenceEngine(candidates=candidates, team_size=team_size)
        result = engine.forge()
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"Erro na Valence Engine: {e}")
        raise HTTPException(status_code=500, detail="Falha crítica na forja dos times.")

@router.post("/ysna/preview", summary="Preview Y-SNA PDF", description="Processa um PDF via Y-SNA e retorna o PDF gerado.")
async def previewYsna(file: UploadFile = File(...)):
    try:
        pdf_bytes = await file.read()
            
        analysis_result = await selection_pipeline.execute_preview(pdf_bytes) 
        
        report_bytes = analysis_result.get('pdf_bytes')

        return Response(
            content=report_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": "attachment; filename=preview_yawara_ysna.pdf",
                "Content-Length": str(len(report_bytes)) 
            }
        )
    except Exception as e:
        logger.error(f"Erro no endpoint /ysna/preview: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Erro interno ao processar o PDF: {str(e)}")
    
@router.post(
    "/upload/academic_history", 
    response_model=AcademicRecord,
    status_code=status.HTTP_201_CREATED,
    summary="Ingestão de Histórico Acadêmico (PDF)",
    description="Recebe um arquivo PDF (Histórico Oficial UFGD), extrai os dados via OCR/Regex e retorna o registro estruturado."
)
async def ingest_ufgd_academic_record(
    file: UploadFile = File(...),
    candidate_id: str = "candidate-from-token",
    cycle_id: str = "cycle-from-context",
):
    """
    Endpoint de ingestão de dados não estruturados.
    
    Args:
        file (UploadFile): O arquivo PDF do histórico escolar.
        candidate_id (str): ID do candidato (simulado via token/contexto).
        cycle_id (str): ID do ciclo seletivo vigente.

    Returns:
        AcademicRecord: Objeto contendo as disciplinas, notas e metadados extraídos.

    Raises:
        HTTPException(500): Se houver erro no parsing do PDF ou validação dos dados.
    """
    logger.info(f"Recebendo histórico para o candidato: {candidate_id}")
    
    try: 
        pdf_bytes = await file.read()
        
        record = await run_in_threadpool(
            ingest_academic_record_from_pdf,
            pdf_bytes=pdf_bytes,
            candidate_id=candidate_id,
            cycle_id=cycle_id,
            source="UFGD_HISTORICO_OFICIAL",
        )
        
        logger.info(f"Ingestão concluída com sucesso para {candidate_id}. Total disciplinas: {len(record.disciplines)}")
        return record

    except Exception as e:
        logger.error(f"Erro na ingestão do PDF para {candidate_id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail=f"Erro no processamento do histórico: {str(e)}"
        )

@router.get(
    "/preview/xai/{candidate_id}",
    summary="Preview do Relatório XAI (PDF)",
    description="Gera o PDF final em tempo real para visualização e debug. Aciona o pipeline completo."
)
async def preview_pdf_by_candidate(candidate_id: str):
    """
    Endpoint de DEBUG/Visualização para gerar o PDF via Y-SNA.
    
    Fluxo:
    1. Aciona o Pipeline (Engine V1 ou V2).
    2. Recebe o bundle de dados XAI.
    3. Renderiza o HTML/Gráficos e converte para PDF.

    Args:
        candidate_id (str): Identificador único do candidato.

    Returns:
        Response: Binário do arquivo PDF (application/pdf).
    """
    try:
        logger.info(f"Gerando preview PDF para {candidate_id}...")

        result = await selection_pipeline.process_candidate(candidate_id)
        
        report_data = result.get("xai", {}).get("report_bundle")
        
        if not report_data:
            logger.warning(f"Bundle XAI vazio para {candidate_id}. Resultado da Engine: {result.keys()}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, 
                detail="O Engine rodou, mas não gerou relatório XAI (Bundle vazio)."
            )

        bundle = CandidateReportBundle(**report_data)

        pdf_bytes = await run_in_threadpool(
            html_report_service.generate_pdf_bytes,
            bundle
        )

        logger.info(f"PDF gerado com sucesso para {candidate_id}. Tamanho: {len(pdf_bytes)} bytes.")

        return Response(
            content=pdf_bytes, 
            media_type="application/pdf",
            headers={"Content-Disposition": f"inline; filename=report_{candidate_id}.pdf"}
        )

    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Erro fatal gerando PDF para {candidate_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Erro interno ao gerar PDF: {str(e)}")

@router.post(
    "/evaluate/{candidate_id}",
    summary="Avaliação Sob Demanda",
    description="Força a avaliação de um candidato específico usando a estratégia definida no Pipeline (V1/V2/Auto)."
)
async def evaluate_candidate_on_demand(candidate_id: str):
    """
    Dispara o processo de avaliação (Inscrição -> Engine -> Resultado).
    
    Args:
        candidate_id (str): ID do candidato.

    Returns:
        dict: Status da avaliação e detalhes do processamento.
    """
    try:
        logger.info(f"Iniciando avaliação manual para {candidate_id}")
        result = await selection_pipeline.process_candidate(candidate_id)
        
        success = result.get("success", False)
        return {
            "message":  "Avaliação concluída com sucesso." if success else "Avaliação concluída com falhas.",
            "details": result
        }

    except Exception as e:
        logger.error(f"Erro na avaliação on-demand: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Erro interno do servidor: {str(e)}")
    

# ======================================
# ============ HEALTH CHECK ============
# ======================================

@router.get("/status/server", tags=["Diagnostic"])
async def get_system_status():
    """
    Verifica saúde do Hardware (Disponibilidade TF) e do Firmware (Carregamento dos Modelos).
    """
    recommender = get_recommender()
    resolver = get_resolver()      

    v2_status = "offline"
    v2_details = "Model not loaded"
    if recommender.model:
        v2_status = "online"
        v2_details = f"Loaded ({len(recommender.labels)} nuclei labels)"

    resolver_status = "offline"
    resolver_details = "Memory bank empty"
    if resolver.engine and resolver.engine.memory_bank:
        resolver_status = "online"
        resolver_details = f"Vector Memory: {len(resolver.engine.memory_bank)} concepts"

    gpu_available = len(tf.config.list_physical_devices('GPU')) > 0
    hardware_info = "CPU Only" if not gpu_available else "GPU Acceleration Active"

    global_status = "degraded"
    if v2_status == "online" and resolver_status == "online":
        global_status = "online"

    return {
        "subsystem": "Y-SNA (Neural Intake System)",
        "global_status": global_status,
        "hardware": hardware_info,
        "components": {
            "recommendation_engine_v2": {
                "status": v2_status,
                "info": v2_details,
                "backend": "TensorFlow/Keras"
            },
            "neural_resolver_v1": {
                "status": resolver_status,
                "info": resolver_details,
                "backend": "Hybrid (Vector/LLM)"
            }
        }
    }


@router.post("/status/inference", tags=["Diagnostic"])
async def test_inference(sample_data: dict = Body(default={})):
    """
    Roda uma inferência real (Synthetic Probe) para validar latência e integridade do modelo.
    Se 'sample_data' for vazio, injeta um dado sintético de teste.
    """
    recommender = get_recommender()
    
    if not recommender.model:
        raise HTTPException(status_code=503, detail="Engine V2 não está carregada. Impossível testar inferência.")

    try:
        if not sample_data:
            candidate = CandidateInput(
                name="Probe User",
                course="ENGENHARIA_DE_SOFTWARE",
                semester=1
            )
            historic = [
                SubjectRecord(name_raw="Calculo 1", grade=8.5, workload_hours=80, status="AP"),
                SubjectRecord(name_raw="Algoritmos", grade=9.0, workload_hours=60, status="AP")
            ]
        else:
            candidate_data = sample_data.get("candidate", {})
            historic_data = sample_data.get("historic", [])
            candidate = CandidateInput(**candidate_data)
            historic = [SubjectRecord(**h) for h in historic_data]

        start_time = time.perf_counter()
        
        result = recommender.predict(candidate, historic)
        
        end_time = time.perf_counter()

        latency_ms = (end_time - start_time) * 1000

        return {
            "result": "validated",
            "inference_time_ms": round(latency_ms, 2),
            "performance_check": "OK" if latency_ms < 200 else "SLOW", 
            "output_preview": {
                "recommended_nuclei_count": len(result.get("recommended_nuclei", [])),
                "sample_nuclei": result.get("recommended_nuclei", [])[:3]
            }
        }

    except Exception as e:
        logger.error(f"Falha no teste de inferência: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Erro ao executar inferência de teste: {str(e)}")

@router.post("/status/tests", tags=["Diagnostic"])
async def ysna_using_test(sample_data: dict):
    """Executa rotina de teste completa do Y-SNA"""
    start_time = time.perf_counter()
    end_time = time.perf_counter()

    # TODO: VERIFY TESTS RESULTS AND RETURN DETAILS

    return {
        "inference_time_ms": (end_time - start_time) * 1000,
        "result": "validated"
    }
