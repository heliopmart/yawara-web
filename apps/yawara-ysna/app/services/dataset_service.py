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
        Salva um novo aprendizado em um arquivo jsonl. Cada linha do arquivo é um JSON com a estrutura:
        {"canonical": "TARGET_STANDARDIZED", "vars": ["RAW_INPUT1", "RAW_INPUT2", ...]}
        Args:
            raw_input (str): A entrada bruta fornecida pelo usuário.
            canonical_target (str): A forma canônica padronizada da entrada.
        """

        payload = {
            "canonical": canonical_target.upper().strip(), 
            "vars": [raw_input.upper().strip()]
        }
        entry = json.dumps(payload, ensure_ascii=False) + "\n"
        
        os.makedirs(os.path.dirname(LEARNED_DATA_PATH), exist_ok=True)
        
        with open(LEARNED_DATA_PATH, "a", encoding="utf-8") as f:
            fcntl.flock(f, fcntl.LOCK_EX)
            try:
                f.write(entry)
                f.flush() 
            finally:
                fcntl.flock(f, fcntl.LOCK_UN)
        
        print(f"[DATASET] Bufferizado para próximo treino: {raw_input} -> {canonical_target}")

dataset_service = DatasetService()