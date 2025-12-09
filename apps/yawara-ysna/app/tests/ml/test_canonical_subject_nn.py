# app/tests/process/test_confidence_gate.py

import pytest
import numpy as np
from app.services.neural_resolver import get_resolver

# Mockamos a LLM para não gastar créditos no teste automatizado
def mock_ask_gemini(self, raw, vec, candidates):
    return {
        "canonical": "MOCK_DECISION",
        "confidence": 1.0,
        "source": "LLM_MOCK",
        "new_concept": True
    }

def test_confidence_threshold_logic(monkeypatch):
    """
    Testa se o 'Portão de Ferro' (Threshold) está barrando incertezas.
    """
    resolver = get_resolver()
    
    # Injetamos alguns conceitos na memória para ter o que buscar
    resolver.memory_bank = {}
    seeds = ["CALCULO_DIFERENCIAL_INTEGRAL_1", "ALGORITMOS_PROGRAMACAO"]
    vectors = resolver.nn.embed_batch(seeds)
    for name, vec in zip(seeds, vectors):
        resolver.memory_bank[name] = vec

    # CASO 1: Alta Confiança (Happy Path)
    # "Calculo 1" deve ser muito similar a "CALCULO_DIFERENCIAL_INTEGRAL_1"
    result_ok = resolver.resolve("Calculo 1", threshold=0.85)
    
    print(f"\n[TEST] 'Calculo 1' -> {result_ok['canonical']} ({result_ok['confidence']:.2%})")
    
    assert result_ok["source"] == "NEURAL_MEMORY"
    assert result_ok["confidence"] >= 0.85
    assert result_ok["canonical"] == "CALCULO_DIFERENCIAL_INTEGRAL_1"

    # CASO 2: Baixa Confiança (Intervenção Necessária)
    # "Direito Penal" não tem nada a ver com Cálculo ou Algoritmos.
    # A rede vai achar o vetor "menos pior", mas a confiança deve ser baixa.
    
    # Monkeypatch para evitar chamar o Google de verdade no teste
    monkeypatch.setattr(resolver, "_ask_gemini_for_concept", mock_ask_gemini.__get__(resolver))
    
    result_low = resolver.resolve("Direito Penal", threshold=0.99) # Threshold alto força falha
    
    print(f"[TEST] 'Direito Penal' -> Source: {result_low['source']}")
    
    # O teste passa se ele tiver desviado para a LLM (ou Mock)
    assert result_low["source"] in ["LLM_GENERATION", "LLM_MOCK"]
    
    # CASO 3: Verificação de % Exata (Requisito explícito)
    # Vamos pegar o vetor cru e calcular na mão para garantir que a math bate
    vec_input = resolver.nn.embed_single("Algoritmos")
    vec_memory = resolver.memory_bank["ALGORITMOS_PROGRAMACAO"]
    
    expected_score = np.dot(vec_input, vec_memory)
    api_result = resolver.resolve("Algoritmos")
    
    # A confiança retornada deve ser igual ao produto escalar (arredondado)
    assert np.isclose(api_result["confidence"], expected_score, atol=0.01)
    print(f"[TEST] Score Matemático: {expected_score:.4f} | API: {api_result['confidence']}")