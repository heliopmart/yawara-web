# historic.py schema
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class SubjectRecord(BaseModel):
    """
    Representa uma única disciplina do histórico.
    Isso é o que os motores de classificação vão consumir linha a linha.
    """
    period: str                 # ex: "2024.2" ou "2025.1"
    code: str                   # código da disciplina (string)
    name_raw: str               # nome exatamente como veio no histórico
    subject_canonical: str      # nome canônico normalizado (para a IA)
    grade: Optional[float]      # nota numérica (0-10), se existir
    status: str                 # AP, RP, DS, MA, etc.
    workload_hours: int         # carga horária (CH)
    absences: int               # faltas
    type: str                   # OBR, OPT, ELT...
    confidence: Optional[float]  # confiança da resolução neural (0.0-1.0)


class AcademicRecord(BaseModel):
    """
    Documento estruturado do histórico inteiro de um candidato.
    Esse é o 'pacote' que vai para o banco / motores neurais.
    """
    candidate_id: str           # id do candidato no seu sistema
    cycle_id: str               # id do ciclo seletivo / processo
    generated_at: datetime      # timestamp de quando esse record foi gerado
    source: str                 # ex: "UFGD_HISTORICO_OFICIAL"
    subjects: List[SubjectRecord]

academic_exclude_status = {"MA", "MT", "TR", "RP", "TR", "RF", "R"}