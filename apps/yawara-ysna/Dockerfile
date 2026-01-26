FROM python:3.11-slim

# AMBIENT VARIABLES
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# WORK DIRECTORY
WORKDIR /app

RUN apt-get update && apt-get install -y \
    build-essential \
    python3-dev \
    gcc \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libgdk-pixbuf-2.0-0 \
    libffi-dev \
    shared-mime-info \
    libcairo2 \
    libgobject-2.0-0 \
    libglib2.0-0 \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*


# CREATE A NON-ROOT USER
RUN useradd -m -u 1000 user

RUN chown user:user /app 

# SWITCH TO NON-ROOT USER
USER user
ENV PATH="/home/user/.local/bin:${PATH}"

# INSTALL DEPENDENCIES AS NON-ROOT USER
COPY --chown=user:user requirements.txt .
RUN pip install --no-cache-dir --user --upgrade -r requirements.txt

# RUN pip install --no-cache-dir --upgrade -r requirements.txt

# COPY . .
COPY --chown=user:user . .

# DEV CONFIG
# EXPOSE 8000

# HUGGIN SPACE CONFIG
EXPOSE 7860

# DEFAULT DEV CONFIG
# CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

# HUGGIN SPACE CONFIG
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "7860"]