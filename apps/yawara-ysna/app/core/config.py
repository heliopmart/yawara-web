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
    NN_MODEL_MEMORY_FILE_ID : str = "vector_memory_npz"

    # ENVIRONMENT
    ACADEMIC_DEFAULT_DISPENSA_GRADE: float = 7.0

    # (DEVELOPMENT | PRODUCTION | TESTING) | (development_local_mock)
    ENVIRONMENT: str = "development" 

    # Cloudinary Configuration
    CLOUDINARY_CLOUD_NAME: str
    CLOUDINARY_API_KEY: str
    CLOUDINARY_API_SECRET: str
    CLOUDINARY_DOCS_FOLDER_NAME: str = "yawara-docs"

    # --- YAWARA ML CONFIGS ---
    ML_MAX_SUBJECTS: int = 100
    ML_BATCH_SIZE: int = 32
    ML_LOCAL_TMP_DIR: str = "/tmp"
    
    # Nomes no Cloudinary

    SYNTHETIC_DATA_PATH: str = "app/resources/data/synthetic_dataset_v2.json"
    SYNTHETIC_TRAIN_PATH: str = "app/resources/models/engine_v2_synthetic.keras"

    ML_ENGINE_2_PATH: str = "app/resources/models/engine_v2.keras"
    ML_ENGINE_2_LABELS_PATH: str = "app/resources/models/engine_v2_labels.json"

    ML_CLOUD_CHECKPOINT_NAME: str = "yawara_v2_checkpoint.weights.h5"
    ML_CLOUD_BEST_CHECKPOINT_NAME: str = "yawara_best_checkpoint_v2.weights.h5"
    ML_CLOUD_STATE_NAME: str = "yawara_v2_training_state.json"
    ML_CLOUD_LABELS_NAME: str = "yawara_v2_labels.json"
    ML_CLOUD_MODEL_NAME: str = "yawara_v2_model.keras"

    ML_TRAIN_TIME_BUDGET_MIN: int = 20         
    ML_GUARDIAN_STOP_AT_RATIO: float = 0.92   
    ML_MAX_EPOCHS_PER_RUN: int = 3              
    ML_TARGET_TOTAL_EPOCHS: int = 30   

    # Tamanho do chunk vindo do Supabase RPC
    ML_DB_CHUNK_SIZE: int = 256

    # Quantos chunks (máximo) treinar em uma execução (controle de RAM/tempo)
    ML_MAX_CHUNKS_PER_RUN: int = 10

    # Validação fixa (holdout) vindo do mesmo RPC
    ML_VAL_CHUNK_SIZE: int = 256
    ML_VAL_COURSES: list[str] | None = None 

    # Early stopping global (entre runs)
    ML_EARLYSTOP_PATIENCE_RUNS: int = 8      
    ML_EARLYSTOP_MIN_DELTA: float = 0.0005      

    ML_CLOUD_BEST_CHECKPOINT_NAME: str = "yawara_best_checkpoint_v2"
    ML_USE_BALANCED_LOSS: bool = True

    # define o que é “positivo” no seu y (regressão 0..1)
    ML_POSITIVE_THRESHOLD: float = 0.001

    # clipes para não explodir peso em classes raras
    ML_CLASS_WEIGHT_MIN: float = 0.25
    ML_CLASS_WEIGHT_MAX: float = 8.0

    # smoothing para não gerar infinito
    ML_CLASS_WEIGHT_EPS: float = 1e-6

    model_config = SettingsConfigDict(
        case_sensitive=True,
        env_file=".env",
        extra="ignore"
    )

settings = Settings()