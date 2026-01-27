import json
import os
# Sessão Critica
import fcntl 
from typing import List, Dict, Any
from app.core.config import settings

LEARNED_DATA_PATH = settings.NN_MODEL_LEARNED_DATA_PATH

class DatasetService:
    def append_new_var(self, raw_input: str, canonical_target: str):
        """
        Salva um novo aprendizado de forma atômica (Thread-safe/Process-safe).
        Formato JSONL: {"target": "CALCULO_I", "var": "CALC 1"}
        """
        entry = json.dumps({"target": canonical_target, "var": raw_input.upper()}) + "\n"
        
        os.makedirs(os.path.dirname(LEARNED_DATA_PATH), exist_ok=True)
        
        with open(LEARNED_DATA_PATH, "a", encoding="utf-8") as f:
            fcntl.flock(f, fcntl.LOCK_EX)
            try:
                f.write(entry)
                f.flush() 
            finally:
                fcntl.flock(f, fcntl.LOCK_UN)
        
        print(f"[DATASET] Novo alias salvo em disco: {raw_input} -> {canonical_target}")

dataset_service = DatasetService()