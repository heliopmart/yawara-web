# Base Image: Python 3.11 Slim (Leve e segura) [cite: 59]
FROM python:3.11-slim

# Variáveis de ambiente para otimizar o Python no Docker
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# Define diretório de trabalho
WORKDIR /app

# Instala dependências do sistema necessárias para compilar certas libs
# (gcc e python3-dev às vezes são necessários para bibliotecas matemáticas)
RUN apt-get update \
    && apt-get install -y --no-install-recommends gcc python3-dev \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Copia e instala as dependências Python
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade -r requirements.txt

# Copia o restante do código
COPY . .

# Expõe a porta que o FastAPI usa
EXPOSE 8000

# Comando de inicialização (Uvicorn)
# O host 0.0.0.0 permite acesso externo ao container
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]