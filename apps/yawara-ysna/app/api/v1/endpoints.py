import logging
from fastapi import APIRouter, UploadFile, File, HTTPException, Response, status
from fastapi.concurrency import run_in_threadpool

# Serviços e Schemas
from app.services.ingestion import ingest_academic_record_from_pdf
from app.schemas.historic import AcademicRecord
from app.ml.pipeline import selection_pipeline
from app.schemas.report import CandidateReportBundle
from app.services.html_report_service import html_report_service

# Configuração de Logs
logger = logging.getLogger("yawara.api.endpoints")

router = APIRouter()

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
        # Leitura assíncrona do arquivo (IO-bound, ok para async/await)
        pdf_bytes = await file.read()
        
        # OTIMIZAÇÃO: Parsing de PDF é CPU-bound. 
        # Usamos run_in_threadpool para não bloquear o Event Loop do FastAPI.
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
    "/preview-pdf/{candidate_id}",
    summary="Preview do Relatório XAI (PDF)",
    description="Gera o PDF final em tempo real para visualização e debug. Aciona o pipeline completo."
)
async def preview_pdf(candidate_id: str):
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

        # 1. Roda a Engine (IO-bound + CPU-bound misto, mas o pipeline já é async, então await direto)
        result = await selection_pipeline.process_candidate(candidate_id)
        
        # 2. Extrai o Bundle de Relatório
        # Usamos .get() encadeado para evitar KeyError se a chave 'xai' não existir
        report_data = result.get("xai", {}).get("report_bundle")
        
        if not report_data:
            logger.warning(f"Bundle XAI vazio para {candidate_id}. Resultado da Engine: {result.keys()}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, 
                detail="O Engine rodou, mas não gerou relatório XAI (Bundle vazio)."
            )

        # 3. Converte dict -> Pydantic
        bundle = CandidateReportBundle(**report_data)

        # 4. Gera PDF (OTIMIZAÇÃO CRÍTICA)
        # O WeasyPrint e o Matplotlib bloqueiam a thread. Movemos para threadpool.
        pdf_bytes = await run_in_threadpool(
            html_report_service.generate_pdf_bytes,
            bundle
        )

        logger.info(f"PDF gerado com sucesso para {candidate_id}. Tamanho: {len(pdf_bytes)} bytes.")

        # 5. Retorna como arquivo
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
            
        return {
            "message": "Avaliação concluída com sucesso.",
            "details": result
        }

    except Exception as e:
        logger.error(f"Erro na avaliação on-demand: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Erro interno do servidor: {str(e)}")