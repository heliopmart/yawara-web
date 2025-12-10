# Estratégia de Testes e QA

O YSNA implementa uma pirâmide de testes robusta para garantir a estabilidade do sistema de ingestão e a integridade da Inteligência Artificial.

Utilizamos o framework **Pytest** com o padrão **AAA (Arrange, Act, Assert)**.

---

## 🏗️ Testes de Ingestão (Parsing Unitário)

Focados na lógica de extração de texto, validação de regex e integridade dos Schemas de dados. Estes testes rodam isolados e não dependem de GPU.

### Lógica de Parsing
::: app.tests.ingestion.ingestion_test.TestIngestionLogic
    options:
      show_root_heading: true
      show_source: true

### Schemas e Modelos
::: app.tests.ingestion.historic_test.TestHistoricSchemas
    options:
      show_root_heading: true
      show_source: true

### Validação com PDF Real
::: app.tests.ingestion.ingestion_from_real_pdf_test.TestRealPDFIngestion
    options:
      show_root_heading: true
      show_source: true

---

## 🧠 Testes de Machine Learning (ML Unitário)

Validam a matemática da Rede Neural, o pré-processamento de tensores e o determinismo do modelo. Não requerem pesos treinados.

::: app.tests.ml.test_canonical_subject_nn.TestCanonicalSubjectNN
    options:
      show_root_heading: true
      show_source: true

---

## 🔄 Testes de Integração (Processo End-to-End)

Simulam o pipeline completo: **Upload -> PDF -> Regex -> IA (Mock) -> JSON**. Garantem que os componentes conversam entre si e que o sistema é resiliente a falhas da IA.

::: app.tests.process.test_integration.TestEndToEndPipeline
    options:
      show_root_heading: true
      show_source: true