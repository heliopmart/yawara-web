from typing import List, Optional
from pydantic import BaseModel, Field

class FeatureImpact(BaseModel):
    """
    Representa a análise matemática de UMA única disciplina (Feature).
    """
    feature_name: str = Field(..., description="Nome canônico da disciplina.")
    input_value: float = Field(..., description="A nota que o aluno tirou (0-10).")
    
    # O coração do XAI
    importance_score: float = Field(..., description="O quanto essa matéria pesou na decisão final (Absoluto).")
    relative_influence: float = Field(..., description="Porcentagem de influência dessa matéria no todo (0.0 a 1.0).")
    
    # Conceito de 'Gap' (Útil para V1, estimado para V2)
    potential_gain: float = Field(0.0, description="Quanto o score subiria se a nota fosse 10 (Déficit).")
    
    status: str = Field("NEUTRAL", description="Classificação: STRENGTH (Força), WEAKNESS (Fraqueza) ou NEUTRAL.")

class XAIAnalysisResult(BaseModel):
    """
    O relatório matemático completo de uma predição.
    """
    engine_type: str = Field(..., description="V1 (Deterministic) ou V2 (Neural).")
    target_nucleus: str = Field(..., description="Nome do núcleo analisado.")
    
    final_score: float = Field(..., description="Nota final calculada (ou probabilidade).")
    threshold: float = Field(..., description="Régua de corte utilizada.")
    
    features_analysis: List[FeatureImpact] = Field(..., description="Lista detalhada por matéria.")