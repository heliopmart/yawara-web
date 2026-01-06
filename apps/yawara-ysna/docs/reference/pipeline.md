# Pipeline de Seleção (The Brain)

O **Selection Pipeline** é o componente central de orquestração do Y-SNA. Ele é responsável por decidir, em tempo de execução, qual "cérebro" avaliará o candidato.

Essa decisão é crítica para resolver o problema do *Cold Start* (frio inicial) em sistemas de IA, permitindo que o projeto comece operando com regras manuais e evolua organicamente para Deep Learning sem downtime.

## Estratégias de Avaliação

O pipeline implementa o padrão de design *Strategy*, alternando entre:

1.  **V1 (Determinística):**
    * **Lógica:** Álgebra Linear (Produto Escalar de Pesos x Notas).
    * **Uso:** Início do projeto, auditoria ou quando a IA falha.
    * **Vantagem:** Previsibilidade total e explicabilidade matemática simples.

2.  **V2 (Estocástica/Neural):**
    * **Lógica:** Deep Learning (TensorFlow Recommender).
    * **Uso:** Quando há histórico suficiente (> 4 ciclos).
    * **Vantagem:** Captura padrões não-lineares e correlações ocultas entre disciplinas.

3.  **AUTO (Híbrido):**
    * O sistema consulta o banco de dados para ver quantos Processos Seletivos já foram concluídos.
    * Se `count(PS_Concluidos) >= minCyclesForNeural`: Ativa **V2**.
    * Caso contrário: Mantém **V1**.

## Mecanismo de Fallback (Safety Net)

O pipeline possui um bloco `try/except` robusto. Se a **Engine V2** falhar (ex: erro de tensores, memória insuficiente, modelo corrompido), o pipeline **automaticamente** reverte para a **Engine V1** e loga o erro crítico. Isso garante que o candidato nunca fique sem resposta.

## Referência da API

::: app.ml.pipeline
    options:
      heading_level: 3
      show_root_heading: true
      show_source: true
      members:
        - SelectionPipeline
        - process_candidate
        - get_count_completed_ps