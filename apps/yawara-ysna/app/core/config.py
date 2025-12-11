# Variáveis de ambiente (Pydantic)

from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict 

class Settings(BaseSettings):
    PROJECT_NAME: str = "Yawara System Neural Architecture (Y-SNA)"
    VERSION: str = "3.1.0"
    API_V1_STR: str = "/api/v1"
    
    # Configurações do Supabase (Banco de Dados) [cite: 56]
    SUPABASE_URL: str
    SUPABASE_KEY: str

    # Configuração da IA
    CURRENT_PHASE: str = "PHASE_1_DETERMINISTIC" # ou "PHASE_2_STOCHASTIC"

    # Configurações do modelo de linguagem
    GOOGLE_API_KEY: Optional[str] = None

    # NN MODEL
    NN_MODEL_MEMORY_FILE_PATH: str = "app/resources/data/vector_memory.npz"

    # ENVIRONMENT
    ACADEMIC_DEFAULT_DISPENSA_GRADE: float = 7.0

    # (DEVELOPMENT | PRODUCTION | TESTING) | (development_local_mock)
    ENVIRONMENT: str = "development" 

    # Cloudinary Configuration
    CLOUDINARY_CLOUD_NAME: str
    CLOUDINARY_API_KEY: str
    CLOUDINARY_API_SECRET: str
    CLOUDINARY_DOCS_FOLDER_NAME: str = "yawara-docs"

    model_config = SettingsConfigDict(
        case_sensitive=True,
        env_file=".env",
        extra="ignore"
    )

settings = Settings()