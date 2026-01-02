# app/utils/training_callbacks.py
import tensorflow as tf
from app.services.storage import StorageService
from app.training.artifacts import atomic_write_json, sha256_file

import time
import os
import json
import hashlib

class CheckpointAndStateCallback(tf.keras.callbacks.Callback):
    """
    Callback "Guardian + Persistência":
    - Salva pesos + state periodicamente
    - Interrompe quando o orçamento de tempo (com margem) estoura
    - Faz upload de checkpoint/state/labels para Cloudinary (fonte de verdade)
    """

    def __init__(
        self,
        time_budget_minutes: int,
        checkpoint_remote_name: str,
        checkpoint_local_path: str,
        state_remote_name: str,
        state_local_path: str,
        labels_remote_name: str,
        labels_local_path: str,
        # frequência
        save_every_epochs: int = 1,
        save_every_seconds: int = 120,
        # guardian (margem para salvar/upload)
        stop_at_ratio: float = 0.92,
        # função para gerar state em runtime
        state_provider=None,
        is_test: bool = False,
        verbose: bool = True,
    ):
        super().__init__()
        self.time_budget_seconds = max(int(time_budget_minutes * 60), 60)
        self.stop_at_ratio = float(stop_at_ratio)

        self.ckpt_remote = checkpoint_remote_name
        self.ckpt_local = checkpoint_local_path

        self.state_remote = state_remote_name
        self.state_local = state_local_path

        self.labels_remote = labels_remote_name
        self.labels_local = labels_local_path

        self.save_every_epochs = max(int(save_every_epochs), 1)
        self.save_every_seconds = max(int(save_every_seconds), 10)

        self.state_provider = state_provider
        self.is_test = is_test
        self.verbose = verbose

        self.start_time = None
        self.last_save_time = None

    def on_train_begin(self, logs=None):
        self.start_time = time.time()
        self.last_save_time = self.start_time
        if self.verbose:
            print(
                f"🧿 Callback iniciado | budget={self.time_budget_seconds/60:.1f}min | "
                f"guardian_ratio={self.stop_at_ratio:.2f} | "
                f"save_epochs={self.save_every_epochs} | save_seconds={self.save_every_seconds}s"
            )

    def _save_all(self, reason: str):
        # 1) checkpoint local
        os.makedirs(os.path.dirname(self.ckpt_local), exist_ok=True)
        self.model.save_weights(self.ckpt_local)

        # 2) state local (atômico)
        if self.state_provider:
            state = self.state_provider()
            try:
                state["checkpoint_hash"] = sha256_file(self.ckpt_local)
            except Exception:
                state["checkpoint_hash"] = None
            atomic_write_json(self.state_local, state)

        # 3) upload (se não for teste)
        if not self.is_test:
            StorageService.upload_model(self.ckpt_local, self.ckpt_remote)
            StorageService.upload_model(self.state_local, self.state_remote)
            StorageService.upload_model(self.labels_local, self.labels_remote)

        if self.verbose:
            print(f"💾 Saved ({reason}) | ckpt={self.ckpt_local}")

    def on_epoch_end(self, epoch, logs=None):
        now = time.time()
        elapsed = now - self.start_time
        since_last = now - self.last_save_time

        # (A) GUARDIAN: para com margem antes do limite real
        limit = self.time_budget_seconds * self.stop_at_ratio
        if elapsed >= limit:
            if self.verbose:
                print(f"\n🛑 Guardian: parando na época {epoch+1} (elapsed={elapsed:.1f}s / limit={limit:.1f}s)")
            self._save_all("guardian_time_budget")
            self.model.stop_training = True
            return

        # (B) Salvamento periódico
        should_save_epoch = ((epoch + 1) % self.save_every_epochs) == 0
        should_save_time = since_last >= self.save_every_seconds

        if should_save_epoch or should_save_time:
            self._save_all("periodic")
            self.last_save_time = now
