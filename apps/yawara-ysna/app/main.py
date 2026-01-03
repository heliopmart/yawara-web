from fastapi import FastAPI
from app.core.config import settings
from app.api.v1.endpoints import router as api_router  # <--- IMPORTANTE

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Microsserviço de Inteligência Artificial para Triagem do MotoStudent"
)

# --- CONECTANDO AS ROTAS ---
app.include_router(api_router, prefix="/api/v1") 

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