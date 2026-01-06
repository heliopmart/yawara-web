# Engine V2 (Neural)

A **Engine V2** utiliza Deep Learning (TensorFlow/Keras) para identificar padrões não-lineares nos históricos escolares. Diferente da V1, ela não segue regras explícitas, mas aprende com as aprovações passadas.

## Arquitetura

O modelo é um **Recommender System** baseado em conteúdo.
* **Input:** Sequência de disciplinas (Embeddings) + Metadados (Notas/Carga).
* **Output:** Probabilidade de sucesso (0.0 a 1.0) para cada Núcleo Tecnológico (Multi-label classification).

## Componentes

### 1. Serviço (Orquestrador)
::: app.services.engine_v2_service
    options:
      heading_level: 3

### 2. Processador de Dados & Inferência
::: app.ml.engine_v2
    options:
      heading_level: 3