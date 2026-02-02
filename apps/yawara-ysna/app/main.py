import pathlib
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.api.v1.endpoints import router as api_router 
from app.core.scheduler import training_scheduler 
from app.core.middleware import YsnaFirewallMiddleware

current_file = pathlib.Path(__file__).resolve()
project_root = current_file.parent.parent
docs_path = project_root / "site"

# ======================================
# ============ MIDDLEWARE ==============
# ======================================

def get_application() -> FastAPI:
    application = FastAPI(
        title=settings.PROJECT_NAME,
        debug=settings.DEBUG,
        version=settings.VERSION,
        description="Microsserviço de Inteligência Artificial para Triagem do MotoStudent",
        docs_url="/docs/ysna", 
        redoc_url=None, 
        openapi_url="/docs/ysna/openapi.json"
    )

    application.add_middleware(YsnaFirewallMiddleware)

    return application

app = get_application()

# --- CONECTANDO AS ROTAS ---
app.include_router(api_router, prefix="/api/v1") 


# ======================================
# ======== DOCUMENTATION PAGE ==========
# ======================================
app.mount("/docs/ysna", StaticFiles(directory=str(docs_path), html=True), name="yawara-ysna-docs")

@app.get("/")
def root():
    return {
        "system": "Y-SNA",
        "status": "online",
        "phase": settings.CURRENT_PHASE,
        "message": "O Portão de Ferro está ativo."
    }


@app.on_event("startup")
async def startup_event():
    training_scheduler.start()