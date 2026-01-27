"""
Módulo de Testes: Engine V1 (Topológica).

Valida o motor de decisão determinístico. Verifica se o cálculo de produto escalar
(Weighted Sum Model) e os limiares de corte (Thresholds) estão funcionando.

Classes Testadas:
    - YTSE_TopologicalEngine
"""

import pytest
from app.ml.engine_v1 import YTSE_TopologicalEngine
from app.schemas.engine_v1 import NucleusRequirementsInput
from app.schemas.historic import SubjectRecord

@pytest.fixture
def engine():
    """Fixture que retorna uma instância limpa da Engine V1."""
    return YTSE_TopologicalEngine()

@pytest.fixture
def nucleus_powertrain():
    """
    Fixture de um Núcleo Simulado (Powertrain).
    
    Configuração:
        - Baseline (Corte): 15.0 pontos.
        - Pesos: Cálculo 1 (2.0), Física 1 (1.0).
    """
    return NucleusRequirementsInput(
        nucleus_id="nuc_1",
        nucleus_name="Powertrain",
        baseline_score=15.0,
        weights={"Calculo 1": 2.0, "Fisica 1": 1.0}
    )

def test_engine_approval(engine, nucleus_powertrain):
    """
    Testa o cenário de **Aprovação (Happy Path)**.
    
    Cenário:
        Candidato tem nota 8.0 em Cálculo (Peso 2) -> 16 pts.
        Candidato tem nota 0.0 em Física (Peso 1) -> 0 pts.
        Total: 16.0 pts.
        
    Expectativa:
        Eligible = True (16.0 >= 15.0).
    """
    history = [
        SubjectRecord(
            period="2023", code="X", name_raw="C1", subject_canonical="Calculo 1", 
            grade=8.0, status="AP", workload_hours=60, absences=0, type="OBR", confidence=1.0
        ),
         SubjectRecord(
            period="2023", code="Y", name_raw="F1", subject_canonical="Fisica 1", 
            grade=0.0, status="RP", workload_hours=60, absences=0, type="OBR", confidence=1.0
        )
    ]
    
    results = engine.process_candidate_eligibility(history, [nucleus_powertrain])
    
    assert results[0].is_eligible is True
    assert results[0].total_score == 16.0

def test_engine_missing_subject_penalty(engine, nucleus_powertrain):
    """
    Testa a **Penalidade por Matéria Faltante**.
    
    Cenário:
        Candidato tem nota 10.0 em Física (Peso 1) -> 10 pts.
        Candidato NUNCA cursou Cálculo (Peso 2) -> 0 pts implícitos.
        Total: 10.0 pts.
        
    Expectativa:
        Eligible = False (10.0 < 15.0).
    """
    history = [
         SubjectRecord(
            period="2023", code="Y", name_raw="F1", subject_canonical="Fisica 1", 
            grade=10.0, status="AP", workload_hours=60, absences=0, type="OBR", confidence=1.0
        )
    ]
    
    results = engine.process_candidate_eligibility(history, [nucleus_powertrain])
    
    assert results[0].is_eligible is False
    assert results[0].total_score == 10.0