# Yawara System Neural Architecture (Y-SNA)

> **Versão:** 3.1.0 | **Codename:** "Neural Intake"

Bem-vindo à documentação oficial do **Y-SNA**, o subsistema de inteligência artificial da plataforma Yawara.

O Y-SNA é um microsserviço de alta performance projetado para processar dados acadêmicos não estruturados, normalizar informações curriculares e fornecer recomendações estratégicas para a alocação de estudantes em núcleos de engenharia.

---

## 🚀 Começando

Se você é um desenvolvedor e acabou de chegar no projeto, siga estes passos para colocar o cérebro para rodar.

### Pré-requisitos
* **Docker & Docker Compose** (Recomendado)
* **Python 3.12+** (Para execução local sem Docker)
* **Conta no Cloudinary** (Para baixar os modelos neurais)

### Instalação Rápida (Docker)

O Y-SNA foi desenhado para ser *stateless* e executado via containers.

```bash
# 1. Navegue até a pasta do microsserviço
cd apps/yawara-ysna

# 2. Configure as variáveis de ambiente
cp .env.example .env
# Edite o .env com suas credenciais do Cloudinary e Google Gemini

# 3. Suba o serviço
docker-compose up --build
```

O serviço estará disponível em http://localhost:8000.  
A documentação interativa (Swagger) pode ser acessada em http://localhost:8000/docs/ysna.

---

## 🧠 Engines & Modelos

O Y-SNA opera com uma arquitetura de **"Múltiplos Cérebros"**, onde cada engine é especializada em uma tarefa cognitiva.

| Engine | Nome Técnico | Tipo de IA | Função |
|------|-------------|------------|--------|
| CANONICAL Y-CSNN | Canonical Subject Engine | Busca Vetorial (KNN) | Normalização: entende que "Cálculo I", "Matemática A" e "Calc. 1" são a mesma entidade semântica. Possui memória persistente e aprendizado assistido por LLM. |
| V1 | Nucleus Recommendation Engine Probabilistic | Math and statistics | Responsável pela avaliação baseada em regras rígidas e álgebra linear (Vetores de Competência). É a estratégia padrão durante a fase de *Cold Start* do sistema. |
| V2 | Nucleus Recommendation Engine | Deep Learning (Keras/TF) | Predição: analisa o histórico escolar normalizado e prediz a probabilidade de sucesso e afinidade do aluno com núcleos específicos (ex: Aerodinâmica, Gestão). |
| XAI | Explainable AI Service | Heurística + Neural | Explicação: gera relatórios em PDF detalhando por que a Engine V2 tomou aquela decisão, garantindo transparência. |

---

## 🛡️ Dados & Privacidade (LGPD)

O Y-SNA foi construído com os princípios de **Privacy by Design**.

### Retenção de Dados
- **Processamento Efêmero:** o Y-SNA não armazena históricos escolares brutos (PDFs) permanentemente. O arquivo é processado em memória RAM e descartado imediatamente após a extração dos vetores.
- **Anonimização:** para fins de retreino dos modelos (Engine V2), apenas vetores de notas e metadados anonimizados (Curso, Semestre) são mantidos. Nomes, CPFs ou matrículas não entram no dataset.

### Direito ao Esquecimento
Como o sistema não mantém um banco de dados relacional de usuários (responsabilidade do yawara-backend), não há persistência de dados pessoais sensíveis no microsserviço Y-SNA.

---

## 🏗️ Hardware & Infraestrutura

Devido ao uso de TensorFlow e operações vetoriais densas, o Y-SNA possui requisitos específicos para garantir baixa latência (< 200ms).

### Requisitos Mínimos (Inferência)
- **CPU:** 2 vCPUs (x86_64) com suporte a AVX  
- **RAM:** 4 GB (TensorFlow + modelos consomem ~1.8 GB no cold start)  
- **GPU:** Opcional. A inferência é leve o suficiente para CPU moderna.

### Requisitos para Treinamento (Retrain)
- **RAM:** 16 GB+ (recomendado)  
- **GPU:** NVIDIA com CUDA 11.8+ (recomendada)

### Hospedagem Sugerida
- **Google Cloud Run:** ideal pela natureza stateless. Configure `min-instances=1` para evitar cold starts (~15s).
- **AWS ECS (Fargate):** boa alternativa com isolamento de recursos.

---

## 📚 Stack Tecnológica

- **Runtime:** Python 3.12+ (Async-first)
- **Web Framework:** FastAPI
- **Machine Learning:** TensorFlow 2.x, Keras, Scikit-learn
- **Vector Search:** NumPy (otimizado com C-bindings)
- **Processamento de PDF:** PyMuPDF (Fitz)
- **Storage de Modelos:** Cloudinary (CDN Global)

---

## 📞 Suporte

Para dúvidas sobre implementação dos modelos ou ajustes de hiperparâmetros:
- **Maintainer:** Núcleo de Sistemas do Yawara
- **Equipe:** Yawara Development System Team  
- **Issues:** utilize o board do GitHub para reportar anomalias nas predições
