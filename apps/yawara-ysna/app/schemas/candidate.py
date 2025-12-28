# Definição dos JSONs

from pydantic import BaseModel, Field
from typing import List, Dict, Optional

class Subject(BaseModel):
    name: str = Field(..., description="Nome da disciplina extraído")
    # Agora é opcional, pois 'MA' (Matriculado) e alguns 'DS' não têm nota
    grade: Optional[float] = Field(None, ge=0.0, le=10.0, description="Nota final (se houver)")
    workload: int = Field(..., description="Carga horária")
    status: str = Field(..., description="Status original do histórico (AP, RP, DS, MA)")

class CandidateInput(BaseModel):
    name: str = "Candidato Desconhecido"
    course: str = Field(..., description="Nome do curso (Ex: ENGENHARIA_COMPUTACAO)")
    semester: int = 1
    subjects: List[Subject] = Field(default_factory=list)
    
# ... (restante dos schemas Config e Output mantidos igual)