import os
from typing import Optional, List, Union
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import AnyHttpUrl, validator

class Settings(BaseSettings):
    # --- CORE INFO ---
    PROJECT_NAME: str = "Yawara System Neural Architecture (Y-SNA)"
    VERSION: str = "3.1.0"
    API_V1_STR: str = "/api/v1"
    
    # --- DATABASE (Supabase) ---
    SUPABASE_URL: str = ""
    SUPABASE_KEY: str = ""
    
    # --- SECURITY & CORS ---
    # Adicionei SECRET_KEY pois é vital para JWT/Auth se houver
    SECRET_KEY: str = "CHANGE_THIS_IN_PROD_TO_A_REAL_SECRET_KEY_SUPER_SECURE"
    CORS_ORIGINS: List[AnyHttpUrl] = []

    @validator("CORS_ORIGINS", pre=True)
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)

    # --- IA CONFIGURATION (PHASES) ---
    CURRENT_PHASE: str = "PHASE_1_DETERMINISTIC" # ou "PHASE_2_STOCHASTIC"

    # --- LLM CONFIGURATION (GOOGLE) ---
    GOOGLE_API_KEY: Optional[str] = None

    # --- PATHS & ARTIFACTS  ---
    
    # 1. Canonical Subject Engine (O Resolvedor de Nomes)
    NN_MODEL_MEMORY_FILE_PATH: str = "app/resources/data/vector_memory.npz"
    NN_MODEL_MEMORY_FILE_ID: str = "vector_memory_npz"
    # [CORREÇÃO] Adicionada a variável que faltava para o neural_resolver.py
    ML_CANONICAL_WEIGHTS_PATH: str = "app/resources/models/yawara_canonical_subject_model_v1.weights.h5"

    # 2. Engine V2 (A Rede Neural Principal)
    # [CORREÇÃO] Adicionados caminhos locais para o engine_v2_service.py carregar o modelo
    ML_ENGINE_2_PATH: str = "app/resources/models/engine_v2.keras"
    ML_ENGINE_2_LABELS_PATH: str = "app/resources/models/engine_v2_labels.json"

    # --- CLOUD ARTIFACTS (Cloudinary/Training) ---
    # Nomes remotos para download/upload
    ML_CLOUD_BEST_CHECKPOINT_NAME: str = "yawara_best_checkpoint_v2.weights.h5"
    ML_CLOUD_STATE_NAME: str = "yawara_v2_training_state.json"
    ML_CLOUD_LABELS_NAME: str = "yawara_v2_labels.json"
    ML_CLOUD_MODEL_NAME: str = "yawara_v2_model.keras"

    # --- TRAINING HYPERPARAMETERS (Mantidos originais) ---
    ML_TRAIN_TIME_BUDGET_MIN: int = 20         
    ML_GUARDIAN_STOP_AT_RATIO: float = 0.92   
    ML_MAX_EPOCHS_PER_RUN: int = 3              
    ML_TARGET_TOTAL_EPOCHS: int = 30   

    # Banco de Dados Chunking
    ML_DB_CHUNK_SIZE: int = 256
    ML_MAX_CHUNKS_PER_RUN: int = 10
    ML_VAL_CHUNK_SIZE: int = 256
    ML_VAL_COURSES: Optional[List[str]] = None 

    # Early Stopping
    ML_EARLYSTOP_PATIENCE_RUNS: int = 8      
    ML_EARLYSTOP_MIN_DELTA: float = 0.0005      

    # --- BUSINESS RULES ---
    ACADEMIC_DEFAULT_DISPENSA_GRADE: float = 7.0

    # --- ENVIRONMENT ---
    # (DEVELOPMENT | PRODUCTION | TESTING) | (development_local_mock)
    ENVIRONMENT: str = "development" 

    # --- STORAGE (Cloudinary) ---
    CLOUDINARY_CLOUD_NAME: str = ""
    CLOUDINARY_API_KEY: str = ""
    CLOUDINARY_API_SECRET: str = ""

    # Configuração Pydantic
    model_config = SettingsConfigDict(
        env_file=".env", 
        case_sensitive=True,
        extra="ignore" # [CORREÇÃO] Ignora variáveis extras no .env para não quebrar o boot
    )

settings = Settings()