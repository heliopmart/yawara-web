# app/schemas/engine_v1.py
from typing import List, Dict
from pydantic import BaseModel, Field

# IMPORTANTE: Usamos o schema oficial do histórico
from app.schemas.historic import SubjectRecord 

class NucleusRequirementsInput(BaseModel):
    """
    Define o 'alvo' topológico de um núcleo. 
    Vem do banco de dados (tabelas nuclei_configs e subject_weights).
    """
    nucleus_id: str
    nucleus_name: str
    baseline_score: float = Field(..., description="Pontuação mínima necessária.")
    weights: Dict[str, float] = Field(..., description="Dicionário {materia_canonical: peso}.")

class ScoreBreakdownItem(BaseModel):
    """
    Elemento para Explainable AI (XAI).
    Mostra o cálculo detalhado de uma matéria específica.
    """
    subject: str
    candidate_grade: float
    nucleus_weight: float
    partial_score: float # grade * weight

class NucleusEligibilityResult(BaseModel):
    """
    O Veredito da Y-TSE para um candidato em relação a UM núcleo.
    """
    nucleus_id: str
    nucleus_name: str
    is_eligible: bool
    total_score: float
    baseline_score: float
    breakdown: List[ScoreBreakdownItem]