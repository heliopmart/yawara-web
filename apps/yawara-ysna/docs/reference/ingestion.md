# Pipeline de Ingestão

Funções responsáveis por transformar o PDF bruto e texto sujo em objetos estruturados (`AcademicRecord`).

## Processo Principal

::: app.services.ingestion.ingest_academic_record_from_pdf
    options:
      show_root_heading: true

## Lógica de Parsing

::: app.services.ingestion.parse_academic_history
    options:
      show_root_heading: true

::: app.services.ingestion.parse_subject_line
    options:
      show_root_heading: true