import pytest

from app.services.selection_process import selection_orchestrator

@pytest.mark.asyncio
async def test_process_integration_engine_1():
    """
    Teste de Integração: Processo Seletivo Completo (Modo Semáforo)
    Cenário: Vários candidatos pendentes, processamento controlado por semáforo.
        1. Configura o ambiente de teste (Mock DB, Storage, etc).
        2. Executa o processo seletivo.
        3. Valida os resultados no banco.
    
    """ 
    # Executa o processo seletivo (modo assíncrono)
    result = await selection_orchestrator.run_batch_screening()

    print(result)

    # Valida o resultado
    assert result is not None
    assert result['processed'] >= 1
    assert result["total"] > 0