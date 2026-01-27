import secrets
import base64
from fastapi import Request, HTTPException, status
from fastapi.responses import Response, JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from app.core.config import settings

class YsnaFirewallMiddleware(BaseHTTPMiddleware):
    """
    Middleware de Segurança para 'Network Gating'.
    
    Regras:
    1. /docs/ysna: Não Requer Autenticação, ANON USER.
    2. /api/v*: Requer Header X-YSNA-INTERNAL-TOKEN.
    3. Outros (Health check, etc): Acesso livre ou controlado por outras regras.
    """

    async def dispatch(self, request: Request, call_next):
        path = request.url.path

        # DOCS ACCESS RULES -----------------------------
        if path.startswith("/docs/ysna") or path.startswith("/redoc"):
            pass  # Free access to the documents, maybe add Basic Rules to prohibit bot access

        # API ACCESS RULES ---------------------------
        if path.startswith("/api/v") or path.startswith("/ysna"): 
            if request.method != "OPTIONS":
                token = request.headers.get("X-YSNA-INTERNAL-TOKEN")
                
                if not token or not secrets.compare_digest(token, settings.YSNA_INTERNAL_TOKEN):
                    return JSONResponse(
                        content={
                            "subsystem": "Y-SNA Security",
                            "error": "Access Denied",
                            "detail": "Missing or Invalid Internal Token. Begone, intruder."
                        },
                        status_code=status.HTTP_403_FORBIDDEN
                    )

        response = await call_next(request)
        return response