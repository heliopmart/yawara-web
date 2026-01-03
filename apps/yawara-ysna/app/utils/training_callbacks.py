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

        time_budget_seconds : int = None,  # se quiser sobrescrever
        upload_interval_seconds=None,   # gate de upload por tempo
        upload_on_train_end=True,
        upload_enabled=True,
    ):
        super().__init__()
        self.time_budget_seconds = time_budget_seconds or max(int(time_budget_minutes * 60), 60)
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

        self.upload_interval_seconds = upload_interval_seconds
        self.upload_on_train_end = upload_on_train_end
        self.upload_enabled = upload_enabled

        self._last_upload_ts = 0.0 # timestamp do último upload

    def on_train_begin(self, logs=None):
        self.start_time = time.time()
        self.last_save_time = self.start_time
        if self.verbose:
            print(
                f"🧿 Callback iniciado | budget={self.time_budget_seconds/60:.1f}min | "
                f"guardian_ratio={self.stop_at_ratio:.2f} | "
                f"save_epochs={self.save_every_epochs} | save_seconds={self.save_every_seconds}s"
            )

    def _upload_cloud(self):
        print("[DBG][CB] upload_file ->", self.ckpt_remote)
        StorageService.upload_file(self.ckpt_local, self.ckpt_remote)
        print("[DBG][CB] upload_file ->", self.state_remote)
        StorageService.upload_file(self.state_local, self.state_remote)
        print("[DBG][CB] upload_file ->", self.labels_remote)
        StorageService.upload_file(self.labels_local, self.labels_remote)

    def _save_local(self):
        os.makedirs(os.path.dirname(self.ckpt_local), exist_ok=True)
        self.model.save_weights(self.ckpt_local)

        if self.state_provider:
            state = self.state_provider()
            try:
                state["checkpoint_hash"] = sha256_file(self.ckpt_local)
            except Exception:
                state["checkpoint_hash"] = None
            atomic_write_json(self.state_local, state)

    def _save_all(self, reason: str):
        print("[DBG][CB] chamando _save_all()")
        print("[DBG][CB] salvando local checkpoint/state/labels ...")
        print("[DBG][CB] paths:", self.ckpt_local, self.state_local, self.labels_local)

        self._save_local()

        if self._should_upload(reason):
            print(f"[DBG][CB] upload liberado (reason={reason}) interval={self.upload_interval_seconds}s")
            self._upload_cloud()
            import time
            self._last_upload_ts = time.time()
        else:
            print(f"[DBG][CB] upload BLOQUEADO (reason={reason})")

        if self.verbose:
            print(f"💾 Saved ({reason}) | ckpt={self.ckpt_local}")

    def _should_upload(self, reason: str) -> bool:
        if self.is_test:
            return False

        if not self.upload_enabled:
            return False

        if reason == "train_end" and self.upload_on_train_end:
            return True

        # se não tem intervalo definido, não faz upload automático
        if not self.upload_interval_seconds:
            return False

        import time
        now = time.time()
        return (now - self._last_upload_ts) >= self.upload_interval_seconds

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

class BestCheckpointCallback(tf.keras.callbacks.Callback):
    """
    Salva o "melhor" checkpoint baseado em val_loss (se existir) senão loss.
    - Quando melhora: salva best weights local e faz upload.
    - Pode chamar um hook para o engine atualizar state imediatamente.
    """

    def __init__(
        self,
        best_checkpoint_remote_name: str,
        best_checkpoint_local_path: str,
        state_save_hook=None,  # () -> None
        monitor: str = "val_loss",
        min_delta: float = 0.0,
        is_test: bool = False,
        verbose: bool = True,
    ):
        super().__init__()
        self.best_remote = best_checkpoint_remote_name
        self.best_local = best_checkpoint_local_path
        self.state_save_hook = state_save_hook
        self.monitor = monitor
        self.min_delta = float(min_delta)
        self.is_test = is_test
        self.verbose = verbose

        self.best_value = None

    def on_train_begin(self, logs=None):
        # não reseta best_value aqui porque o "best" é global entre execuções;
        # o engine injeta isso via state, se quiser.
        
        # !=============================== PRINT ==================================
        print("[DBG][CB] CheckpointAndStateCallback.on_train_begin")
        # !=============================== PRINT ==================================

        self.start_time = time.time()
        self.last_save_time = self.start_time
        
        # opcional: salva state/labels cedo (checkpoint ainda não existe)
        # self._save_all("train_begin")  # só faça isso se quiser subir arquivos mesmo antes de treinar
        if self.verbose:
            print(f"🏆 BestCheckpoint monitor={self.monitor} min_delta={self.min_delta}")

    def on_epoch_end(self, epoch, logs=None):
        # !=============================== PRINT ==================================
        print(f"[DBG][CB] on_epoch_end epoch={epoch} logs_keys={list(logs.keys()) if logs else None}")
        # !=============================== PRINT ==================================

        logs = logs or {}
        value = logs.get(self.monitor)

        # fallback automático: se não tem val_loss, usa loss
        if value is None and self.monitor == "val_loss":
            value = logs.get("loss")

        if value is None:
            return

        value = float(value)

        improved = False
        if self.best_value is None:
            improved = True
        else:
            # quanto menor melhor (loss)
            improved = (self.best_value - value) > self.min_delta

        if not improved:
            return

        self.best_value = value

        os.makedirs(os.path.dirname(self.best_local), exist_ok=True)
        self.model.save_weights(self.best_local)

        if not self.is_test:
            StorageService.upload_file(self.best_local, self.best_remote)

        if self.state_save_hook is not None:
            self.state_save_hook()

        if self.verbose:
            print(f"🏆 New BEST at epoch {epoch+1}: {self.monitor}={value:.6f} | saved {self.best_local}")

    def on_train_end(self, logs=None):
        try:
            self._save_all("train_end")
        except Exception as e:
            print(f"⚠️ Falha ao salvar no on_train_end: {e}")