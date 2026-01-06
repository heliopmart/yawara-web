# Utilitários e Ferramentas

Módulos auxiliares que fornecem funcionalidades transversais para as Engines, Services e APIs.

## 📐 Matemática e Lógica Acadêmica

Funções puras para tratamento de notas, médias e normalização de histórico escolar.

::: app.utils.academic_math
    options:
      heading_level: 3
      show_source: true

## 🤖 Integração com IA (LLM)

Cliente para comunicação com modelos generativos (Google Gemini) usado na desambiguação de nomes de disciplinas.

::: app.utils.llm_client
    options:
      heading_level: 3
      show_source: true

## 💾 Banco de Dados e Persistência

Helpers para conexão com Supabase/Postgres e salvamento de resultados.

### Conector DB
::: app.utils.db
    options:
      heading_level: 3

### Salva Predições
::: app.utils.save_engine_predictions
    options:
      heading_level: 3

### Loader para Treinamento
::: app.utils.db_loader_trainer
    options:
      heading_level: 3

## 📊 Logging e Monitoramento

Sistema especializado de logs para rastreabilidade das decisões da IA (ML Ops).

::: app.utils.ml_logger
    options:
      heading_level: 3

## 📄 Processamento de Texto e Arquivos

Ferramentas de baixo nível para OCR e manipulação de strings.

### Parser de PDF
::: app.utils.pdf
    options:
      heading_level: 3

### Tratamento de Texto
::: app.utils.text
    options:
      heading_level: 3

## 🏋️ Treinamento (Keras Callbacks)

Utilitários específicos para o ciclo de vida de treinamento do TensorFlow (Early Stopping, Checkpoints).

::: app.utils.training_callbacks
    options:
      heading_level: 3