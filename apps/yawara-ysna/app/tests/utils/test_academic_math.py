"""
Módulo de Testes: Utils Acadêmicos (Regras de Negócio).

Este módulo valida as funções matemáticas auxiliares que normalizam o histórico escolar
antes de ele ser processado pelas Engines de IA.

Casos de Teste Cobertos:
    1. **Duplicatas:** Política Otimista (Mantém a maior nota).
    2. **Dispensa (DS):** Atribuição de nota neutra (Proxy Grade).
    3. **Trancamentos:** Ignora registros inválidos.
"""

import pytest
from app.utils.academic_math import optimize_student_history, DEFAULT_DISPENSA_GRADE
from app.schemas.historic import SubjectRecord

def create_record(name: str, grade: float = None, status: str = "AP") -> SubjectRecord:
    """
    Helper para criar registros de histórico rapidamente para testes.
    
    Args:
        name (str): Nome da matéria.
        grade (float, optional): Nota numérica.
        status (str, optional): Status (AP, RP, DS, etc).

    Returns:
        SubjectRecord: Objeto Pydantic preenchido.
    """
    return SubjectRecord(
        period="2023.1", 
        code="TST001", 
        name_raw=name, 
        subject_canonical=name, 
        grade=grade, 
        status=status,
        workload_hours=60, 
        absences=0, 
        type="OBR", 
        confidence=1.0
    )

def test_optimize_history_duplicates_highest_grade():
    """
    Verifica a **Política Otimista** em caso de duplicatas.
    
    Cenário:
        Aluno reprovou em "Cálculo 1" com 3.0.
        Aluno refez e passou com 8.5.
        
    Expectativa:
        O sistema deve considerar apenas a competência 8.5.
    """
    history = [
        create_record("Calculo 1", 3.0, "RP"), # Reprovou
        create_record("Calculo 1", 8.5, "AP"), # Passou
    ]
    
    optimized = optimize_student_history(history)
    
    assert "calculo 1" in optimized
    assert optimized["calculo 1"] == 8.5 # Deve pegar a maior

def test_optimize_history_dispensa_handling():
    """
    Verifica o tratamento de **Dispensas (DS)**.
    
    Cenário:
        Aluno veio transferido e tem "Fisica 1" como "DS" (sem nota numérica).
        
    Expectativa:
        O sistema deve atribuir a `DEFAULT_DISPENSA_GRADE` (ex: 7.0).
    """
    history = [
        create_record("Fisica 1", status="DS", grade=None)
    ]
    
    optimized = optimize_student_history(history)
    
    assert optimized["fisica 1"] == DEFAULT_DISPENSA_GRADE

def test_optimize_history_ignore_trancamento():
    """
    Verifica a limpeza de dados sujos ou irrelevantes.
    
    Cenário:
        Registro com status "TR" (Trancado) e sem nota.
        
    Expectativa:
        A matéria não deve aparecer no mapa final de competências.
    """
    history = [
        create_record("Quimica", status="TR", grade=None)
    ]
    
    optimized = optimize_student_history(history)
    
    assert "quimica" not in optimized