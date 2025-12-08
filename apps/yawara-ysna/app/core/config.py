# Variáveis de ambiente (Pydantic)

from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Yawara System Neural Architecture (Y-SNA)"
    VERSION: str = "3.1.0"
    API_V1_STR: str = "/api/v1"
    
    # Configurações do Supabase (Banco de Dados) [cite: 56]
    SUPABASE_URL: str
    SUPABASE_KEY: str

    # Configuração da IA
    CURRENT_PHASE: str = "PHASE_1_DETERMINISTIC" # ou "PHASE_2_STOCHASTIC"

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()