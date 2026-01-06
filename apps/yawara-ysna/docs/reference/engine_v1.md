### 2. A Engine Determinística

Documenta a lógica matemática "clássica" e o serviço que a executa.

```markdown
# Engine V1 (Determinística)

A **Engine V1** é responsável pela avaliação baseada em regras rígidas e álgebra linear (Vetores de Competência). É a estratégia padrão durante a fase de *Cold Start* do sistema.

## Conceitos Chave

* **Matriz de Pesos:** Cada núcleo define pesos (0.0 a 1.0) para disciplinas específicas.
* **Produto Escalar:** A afinidade é calculada multiplicando o vetor de notas do aluno pelo vetor de pesos do núcleo.
* **Baseline Dinâmico:** A nota de corte é uma porcentagem da pontuação máxima possível, permitindo que a régua suba ou desça sem reconfiguração manual.

## Componentes

### 1. Serviço (Orquestrador)
::: app.services.engine_v1_service
    options:
      heading_level: 3

### 2. Core Matemático (Y-TSE)
::: app.ml.engine_v1
    options:
      heading_level: 3