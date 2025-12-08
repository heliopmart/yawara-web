# Ponto de entrada (FastAPI)

from fastapi import FastAPI
from app.core.config import settings

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Microsserviço de Inteligência Artificial para Triagem do MotoStudent"
)

@app.get("/")
def root():
    return {
        "system": "Y-SNA",
        "status": "online",
        "phase": settings.CURRENT_PHASE,
        "message": "O Portão de Ferro está ativo."
    }

@app.get("/health")
def health_check():
    return {"status": "ok"}