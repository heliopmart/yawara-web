# Relatórios e Explainable AI (XAI)

Este módulo é responsável por traduzir os vetores matemáticos e tensores das Engines em documentos legíveis para humanos (PDFs) e feedback pedagógico.

## Fluxo de Geração

1.  **Analista (Report Analyst):** Recebe o dado bruto da Engine e calcula o arquétipo do aluno ("Analista em Potencial", etc).
2.  **XAI (Mathematicians):** Gera explicações (Gradientes para V2, Pesos para V1).
3.  **Renderizador (HTML Service):** Desenha gráficos com Matplotlib e converte HTML para PDF via WeasyPrint.

## Componentes

### 1. Analista de Negócio
::: app.services.report_analyst
    options:
      heading_level: 3

### 2. Gerador de PDF e Gráficos
::: app.services.html_report_service
    options:
      heading_level: 3

### 3. Explicadores (XAI)
::: app.ml.xai.deterministic_explainer
::: app.ml.xai.neural_explainer