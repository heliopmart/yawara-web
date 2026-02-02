from pydantic import BaseModel, Field
from typing import List, Dict, Optional
from app.schemas.historic import SubjectRecord

class AllocationCandidateInput(BaseModel):
    id: str
    course: str  
    semester: int
    name: str
    iron_gate_notes: List[float] 
    nuclei_eligible: List[str]
    historic_id: str 

class CandidateProfile(BaseModel):
    id: str
    name: str
    semester: int
    academic_record: List[SubjectRecord] 
    iron_gate_score: List[float] = Field(default_factory=lambda: [0.0]*5)

class SquadMember(BaseModel):
    id: str
    name: str
    role_focus: str 

class SquadMetrics(BaseModel):
    power_score: float
    diversity_score: float
    top_competencies: List[str]
    critical_gaps: List[str]

class ForgedSquad(BaseModel):
    squad_name: str
    metrics: SquadMetrics
    members: List[SquadMember]

class ForgeOutput(BaseModel):
    algorithm: str = "Valence Engine v5.0"
    total_fitness: float
    processing_time: float
    squads: List[ForgedSquad]