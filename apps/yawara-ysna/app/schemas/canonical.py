from pydantic import BaseModel

class PredictDecisionScore(BaseModel):
    sim1: float
    sim2: float
    gap: float
    s1: float
    s2: float

class PredictResult(BaseModel):
    timestamp: str
    raw_input: str
    input_std: str
    status: str
    canonical_id: str = None
    decision_scores: PredictDecisionScore
    candidates: list
    