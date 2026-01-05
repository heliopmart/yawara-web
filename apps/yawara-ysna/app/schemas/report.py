from typing import List, Dict, Optional, Any
from pydantic import BaseModel

class FeedbackItem(BaseModel):
    """Uma observação textual específica sobre uma competência."""
    subject: str
    message: str 
    type: str 
    icon: str

class NucleusReportContext(BaseModel):
    """
    Dados enriquecidos de um núcleo prontos para o PDF.
    Não contém apenas números, mas textos e cores.
    """
    nucleus_name: str
    status_label: str 
    status_color: str
    affinity_percentage: int
    
    # Textos gerados
    main_observation: str 
    study_roadmap: List[FeedbackItem]
    
    # Dados Prontos para Gráfico (Radar/Barra)
    chart_labels: List[str]
    chart_values: List[float] 
    chart_colors: List[str]

    full_telemetry: List[Any] = []

    chart_b64: Optional[str] = None

class CandidateReportBundle(BaseModel):
    """O pacote completo que o Gerador de PDF vai receber."""
    candidate_name: str
    candidate_id: str
    overall_observation: str 
    nuclei_reports: List[NucleusReportContext]