import tensorflow as tf
from app.services.storage import StorageService
import time
import os

class ResourcesGuardianCallback(tf.keras.callbacks.Callback):
    """
    A "Mãe" do treinamento. 
    1. Manda parar se passar da hora de dormir (time_budget).
    2. Salva o progresso (pesos) antes de desligar.
    """
    def __init__(self, time_budget_minutes: int, checkpoint_path: str):
        super().__init__()
        self.time_budget_seconds = time_budget_minutes * 60
        self.start_time = None
        self.checkpoint_path = checkpoint_path
        self.local_temp_path = f"/tmp/{checkpoint_path}.weights.h5"

    def on_train_begin(self, logs=None):
        self.start_time = time.time()
        print(f"🕒 Guardião iniciado. Orçamento de tempo: {self.time_budget_seconds/60} min.")

    def on_epoch_end(self, epoch, logs=None):
        elapsed = time.time() - self.start_time
        
        # Verifica se já passamos de 90% do tempo (pra dar tempo de salvar)
        if elapsed >= self.time_budget_seconds:
            print(f"\n🛑 TEMPO ESGOTADO! Parando treinamento na época {epoch + 1}...")
            self.model.stop_training = True
            
            self.model.save_weights(self.local_temp_path)
            
            StorageService.upload_model(
                local_path=self.local_temp_path, 
                remote_name=self.checkpoint_path
            )

            print(f"💾 Checkpoint de emergência salvo em: {self.local_temp_path}")