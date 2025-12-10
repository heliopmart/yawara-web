# Yawara System Neural Architecture (Y-SNA)

Bem-vindo à documentação técnica do **Y-SNA**, o subsistema de inteligência artificial responsável pela automação da triagem de candidatos do projeto Yawara MotoStudent da UFGD.

## 📖 Visão Geral

Conforme definido na [Especificação Técnica de Arquitetura v3](assets/Yawara_SNA_Technical_Architecture_v3.pdf), o Y-SNA é uma solução híbrida projetada para resolver o desafio de normalizar e avaliar históricos escolares não estruturados.

O sistema implementa uma abordagem **Neuro-Simbólica Evolutiva** para solucionar o problema do *Cold Start* (ausência inicial de dados históricos), utilizando uma injeção inicial de pesos heurísticos que transiciona organicamente para um modelo estocástico via *Transfer Learning*.

## 🧠 Componentes Principais

A arquitetura do sistema é dividida em módulos funcionais que operam em pipeline:

### 1. Y-CSNN (Canonical Subject Neural Network)
*No código: `app.ml.canonical_subject_engine`*

Esta é a implementação prática da **"Sub Rede Neural de Classificação"** descrita no documento arquitetural. O **Y-CSNN** atua como o núcleo semântico do sistema.

* **Função:** Mapear strings ruidosas ("Calc. 1", "Cálculo I") para entidades canônicas ("CALCULO_DIFERENCIAL_INTEGRAL_1").
* **Tecnologia:** Rede Neural Convolucional em nível de caractere (Char-CNN) com *Contrastive Learning* (InfoNCE Loss).
* **Evolução:** O motor aprende novos sinônimos automaticamente através do feedback do orquestrador.

### 2. Pipeline de Ingestão (OCR/NLP)
*No código: `app.services.ingestion`*

Responsável pela extração e estruturação dos dados brutos. Utiliza `pdfplumber` para preservação de layout visual (tabelas) e Regex Contextual para identificar disciplinas e notas, alimentando o Y-CSNN com os dados extraídos.

### 3. Orquestrador Híbrido (Resolvedor)
*No código: `app.services.neural_resolver`*

O "Gerente" do sistema. Implementa a lógica de decisão:
1.  **Fast Path:** Consulta a memória vetorial do Y-CSNN.
2.  **Slow Path:** Em caso de baixa confiança, aciona uma LLM (Gemini) para desambiguação semântica.
3.  **Feedback Loop:** Persiste o aprendizado, permitindo que a "fase determinística" evolua para a "estocástica" conforme previsto na arquitetura.

## 🛡️ Segurança e LGPD

O Y-SNA foi construído seguindo os requisitos não-funcionais de privacidade:

* **Anonimização:** O pipeline de treinamento dissocia os dados acadêmicos da identidade civil dos candidatos.
* **XAI (Explainable AI):** O sistema não é uma "caixa preta". Ele fornece metadados de confiança (`confidence score`) e rastreabilidade da decisão (se veio da Memória ou da LLM), permitindo auditoria do "Portão de Ferro".

## 🚀 Como Navegar

Utilize o menu lateral para explorar a referência técnica detalhada:

* **[Arquitetura](ARCHITECTURE.md):** Diagramas visuais do fluxo de dados.
* **[Referência da API](reference/neural_resolver.md):** Documentação das classes e métodos Python (Docstrings).