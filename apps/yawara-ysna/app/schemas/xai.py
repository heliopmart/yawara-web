from typing import List, Optional, Any
from pydantic import BaseModel, Field

from app.schemas.report import NucleusReportContext, FeedbackItem

class XAIAnalysisResult(NucleusReportContext):
    """
    Schema de Resultado da Análise de Explicabilidade.
    
    Herda de NucleusReportContext para garantir que o output da Engine
    seja diretamente plugável no Gerador de PDF.
    
    Campos herdados:
    - nucleus_name
    - status_label, status_color
    - affinity_percentage
    - main_observation
    - study_roadmap (Feedback Items)
    - chart_labels, chart_values, chart_colors
    - full_telemetry
    """
    
    # "core" é o contrato do PDF.
    processing_time_ms: Optional[float] = Field(
        None, description="Tempo de processamento da explicação"
    )

    model_config = {
        "from_attributes": True
    }