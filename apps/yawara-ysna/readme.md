---
title: Y-SNA
emoji: 🤖
colorFrom: red
colorTo: black
sdk: docker
pinned: false
---

# 🧠 Yawara System Neural Architecture (Y-SNA)

> **Microsserviço de Inteligência Artificial para Triagem Adaptativa e Seleção de Talentos.**
> *Projeto de Extensão Yawara MotoStudent - UFGD*

---

## 📋 Visão Geral

O **Y-SNA** é o subsistema central de inteligência do projeto Yawara. [cite_start]Diferente de sistemas tradicionais de RH, ele opera como um **Agente de Validação Técnica**, projetado para estabelecer uma barreira objetiva ("O Portão de Ferro") no processo seletivo[cite: 20].

[cite_start]O sistema utiliza uma **Arquitetura Híbrida Evolutiva** que transiciona de um modelo determinístico (regras manuais para resolver o *Cold Start*) para um modelo estocástico (Deep Learning) conforme acumula dados históricos de performance dos membros[cite: 8, 23].

### 🎯 Objetivos Principais
1.  **Automação da Triagem:** Processamento massivo de históricos escolares via OCR/NLP.
2.  **Eliminação de Viés:** Decisão baseada em métricas matemáticas, não em afinidade pessoal.
3.  [cite_start]**Avaliação Multi-Núcleo:** O mesmo candidato é avaliado por $N$ redes neurais distintas (uma para cada núcleo: Powertrain, Gestão, Chassi, etc.), gerando elegibilidade contextual[cite: 136].
4.  [cite_start]**Homeostase Populacional:** Controle automático de fluxo para evitar superpopulação de perfis dominantes (ex: excesso de veteranos)[cite: 158].

---

## 🏗️ Arquitetura Técnica

[cite_start]O projeto é construído como um microsserviço assíncrono containerizado, otimizado para *Zero-Cost Deployment* (Oracle Cloud Free Tier / Render)[cite: 60].

| Componente | Tecnologia | Função |
| :--- | :--- | :--- |
| **Runtime** | Python 3.11 (Slim) | [cite_start]Execução de alta performance e baixo consumo de RAM[cite: 52]. |
| **API Gateway** | FastAPI (ASGI) | [cite_start]Gerenciamento de requisições e processamento assíncrono[cite: 53]. |
| **ML Engine** | TensorFlow / Keras | [cite_start]Motor de inferência neural (MLP)[cite: 55]. |
| **Database** | Supabase (PostgreSQL) | [cite_start]Persistência de logs de decisão e configurações[cite: 56]. |
| **Container** | Docker | Padronização de ambiente e deploy. |

---

## 🧠 Modelagem Matemática e Fases

O sistema opera em dois estágios de maturidade distintos. O parâmetro `CURRENT_PHASE` no arquivo `.env` define qual motor está ativo.

### 🧪 Fase 1: Determinística ("O Portão de Ferro")
[cite_start]*Utilizada para superar o problema do Cold Start (falta de dados históricos).* [cite: 22]

Nesta fase, o sistema simula um neurônio único (Perceptron) com pesos "congelados" definidos manualmente pelos líderes dos núcleos. Não há aprendizado de máquina ativo, apenas cálculo heurístico.

**A Fórmula de Elegibilidade:**
$$z = \sum (x_{grade} \cdot x_{load} \cdot w_{lider}) + B_{nucleo}$$

Onde:
* $x_{grade}$: Nota normalizada da disciplina (0.0 a 1.0).
* $x_{load}$: Densidade da matéria (Carga Horária / 100). *Matérias de 90h valem 3x mais que matérias de 30h.*
* $w_{lider}$: Peso de importância atribuído pelo Líder do Núcleo.
* $B_{nucleo}$: Bias (Viés) de corte para homeostase populacional (ex: -1.5 para aumentar rigor).

**Decisão:**
$$P(aprovado) = \sigma(z) = \frac{1}{1 + e^{-z}}$$
Se $P \ge Threshold$ (ex: 0.6), o candidato é elegível.

---

### 🧬 Fase 2: Estocástica ("A Mente Mestra")
[cite_start]*Ativada quando o dataset atinge massa crítica (Dados Sintéticos ou Reais).* [cite: 26]

A arquitetura evolui para uma **Rede Neural MLP (Multilayer Perceptron)**. O sistema deixa de obedecer aos pesos manuais e passa a detectar **variáveis latentes** e correlações não-lineares (ex: "Calouro com carga horária alta tem maior retenção que veterano com nota alta").

**Topologia da Rede:**
1.  **Input Layer:** Vetor denso ($Notas \times Carga \times Semestre$).
2.  [cite_start]**Hidden Layer:** Neurônios com ativação **ReLU** ($H = \min(2N, 32)$)[cite: 149].
3.  **Output Layer:** Neurônio único com ativação **Sigmoide**.

**Treinamento (Ground Truth):**
A rede é treinada para prever o **Yawara Score ($y$)**, uma métrica composta calculada ao final de cada ciclo:
$$y = (w_1 \cdot Permanência) + (w_2 \cdot Entregas) - (w_3 \cdot Problemas)$$

---

## 📂 Estrutura de Dados (Inputs)

O sistema ingere vetores normalizados. Variáveis categóricas (como Curso de Origem) foram removidas em favor da **Densidade de Competência**.

| Variável | Símbolo | Descrição | Uso |
| :--- | :---: | :--- | :--- |
| **Nota** | $x_{grade}$ | Desempenho acadêmico (0.0 - 1.0) | Input Principal |
| **Densidade** | $x_{load}$ | Carga Horária Normalizada (ex: 72h $\to$ 0.72) | Ponderador de Esforço |
| **Semestre** | $x_{sem}$ | Momento do curso (0.0 - 1.0) | Contexto (Latente na Fase 2) |
| **Participação** | $y_{part}$ | Score de engajamento no projeto | **Target de Treino** (Não é input) |

---

## Estrutura de paginas do projeto

```
yawara-ysna/
├── app/
│   ├── main.py            # Entrypoint FastAPI
│   ├── core/              # Configurações (Pydantic Settings)
│   ├── api/               # Endpoints REST
│   ├── ml/                # Engine de Inteligência
│   │   ├── engine_v1.py   # Lógica Determinística (Fase 1)
│   │   ├── engine_v2.py   # Lógica TensorFlow (Fase 2)
│   │   └── pipeline.py    # Orquestrador de Treino
│   └── schemas/           # Modelos de Dados (JSON)
├── docker-compose.yml     # Orquestração Local
├── Dockerfile             # Imagem Otimizada (Python Slim)
└── requirements.txt       # Dependências (FastAPI, TF, Pandas)

```

---

# 🛡️ Governança e XAI
Em conformidade com a LGPD e princípios éticos acadêmicos, todas as decisões do Y-SNA são auditáveis.

XAI (Explainable AI): O sistema fornece a decomposição vetorial da decisão (quais matérias mais impactaram a aprovação/reprovação).

Imutabilidade: Logs de decisão são gravados com hash da versão do modelo utilizado.

---

## 🚀 Instalação e Execução

### Pré-requisitos
* Docker & Docker Compose instalados.

### 1. Clonar e Configurar
```bash

git clone [https://github.com/heliopmart/yawara-ysna.git](https://github.com/heliopmart/yawara-ysna.git)
cd yawara-ysna

```
---

Desenvolvido por Hélio Peres Martins Neto Engenharia de Computação - UFGD | Engenharia de Software - Unigran
