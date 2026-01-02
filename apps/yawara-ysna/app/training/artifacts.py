import os
import json
import hashlib
from dataclasses import dataclass, asdict
from typing import Optional, Dict, Any, List


# ----------------------------
# Util: escrita atômica
# ----------------------------
def atomic_write_text(path: str, text: str) -> None:
    os.makedirs(os.path.dirname(path), exist_ok=True)
    tmp = path + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        f.write(text)
        f.flush()
        os.fsync(f.fileno())
    os.replace(tmp, path)  # rename atômico no mesmo filesystem


def atomic_write_json(path: str, data: Dict[str, Any]) -> None:
    atomic_write_text(path, json.dumps(data, ensure_ascii=False, indent=2))


def sha256_file(path: str) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


# ----------------------------
# State
# ----------------------------
@dataclass
class TrainingState:
    run_id: str
    model_id: str
    labels_id: str
    checkpoint_id: str
    state_id: str

    # progresso
    total_epochs_trained: int = 0
    last_processed_id: int = 0

    # integridade/compatibilidade
    labels_hash: Optional[str] = None
    checkpoint_hash: Optional[str] = None

    # observabilidade
    last_checkpoint_at_iso: Optional[str] = None

    # Labels
    labels : Optional[List[str]] = None

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)

    @staticmethod
    def from_dict(d: Dict[str, Any]) -> "TrainingState":
        return TrainingState(**d)


# ----------------------------
# ArtifactStore: interface mínima
# ----------------------------
class ArtifactStore:
    """
    Encapsula Cloudinary (ou qualquer storage).
    Você pluga sua StorageService aqui.
    """
    def __init__(self, storage_service, local_tmp_dir: str):
        self.storage = storage_service
        self.tmp_dir = local_tmp_dir

    def local_path(self, filename: str) -> str:
        return os.path.join(self.tmp_dir, filename)

    def download_if_exists(self, remote_id: str, local_path: str) -> bool:
        try:
            self.storage.download_file(remote_id, local_path)
            return True
        except Exception:
            return False

    def upload(self, local_path: str, remote_id: str) -> None:
        # No seu projeto isso está como StorageService.upload_model(...)
        # Aqui eu chamo via storage_service se você tiver método instanciado,
        # ou você adapta conforme seu StorageService real.
        self.storage.upload_model(local_path, remote_id)

    # ------------- state helpers -------------
    def save_state_local(self, state: TrainingState, local_path: str) -> None:
        atomic_write_json(local_path, state.to_dict())

    def load_state_local(self, local_path: str) -> Optional[TrainingState]:
        if not os.path.exists(local_path):
            return None
        try:
            with open(local_path, "r", encoding="utf-8") as f:
                data = json.load(f)
            return TrainingState.from_dict(data)
        except Exception:
            return None
