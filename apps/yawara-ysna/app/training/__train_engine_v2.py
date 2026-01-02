import json
import logging
import numpy as np
import tensorflow as tf
import os
from typing import List, Dict

# --- IMPORTS  ---
from app.services.system_configs import get_active_config, SystemConfigModel
from app.utils.training_callbacks import ResourcesGuardianCallback
from app.utils.db_loader_trainer import fetch_training_dataset
from app.ml.architectures.nucleus_recommender_nn import build_deep_set_architecture

# --- INFRA ---
from app.services.storage import StorageService 
from app.core.config import settings 

logger = logging.getLogger("yawara.training.train_engine_v2")

class TrainingEngineV2: 
    def __init__(self, is_test: bool = False):
        self.is_test = is_test
        self.config = get_active_config()
        self.storage_service = StorageService()

        # Estado Volátil (Memória)
        self.model = None
        self.labels: List[str] = []
        self.last_processed_id: int = 0
        self.total_epochs_trained: int = 0

        # Caminhos Locais (Temp)
        self.local_state_path = f"{settings.ML_LOCAL_TMP_DIR}/training_state.json"
        self.local_ckpt_path = f"{settings.ML_LOCAL_TMP_DIR}/{settings.ML_CLOUD_CHECKPOINT_NAME}.weights.h5"

        # Constantes de Arquitetura
        self.MAX_SUBJECTS = settings.ML_MAX_SUBJECTS

        self.MAX_SUBJECTS = 100
        self.HASH_BINS_SUBJ = 5000
        self.HASH_BINS_COURSE = 100

        self.max_subjects = settings.ML_MAX_SUBJECTS
        self.batch_size = settings.ML_BATCH_SIZE
        self.local_tmp_dir = settings.ML_LOCAL_TMP_DIR
        self.synthetic_data_path = settings.SYNTHETIC_DATA_PATH
        self.model_build_id = settings.ML_CLOUD_MODEL_NAME
        self.labels_name = settings.ML_CLOUD_LABELS_NAME
        self.ml_cloud_state = settings.ML_CLOUD_STATE_NAME
        self.checkpoint_id = settings.ML_CLOUD_CHECKPOINT_NAME
        self.local_checkpoint = os.path.join(self.local_tmp_dir, f"{self.checkpoint_id}.weights.h5")
        self.synthetic_train_path = settings.SYNTHETIC_TRAIN_PATH
    
    def _load_data_bd(self) -> tuple[List[Dict], List[str]]:
        """
        Carrega os dados de treinamento do banco.
        Se falhar, carrega dados sintéticos locais como fallback.
        """
        try:
            if self.is_test: 
                raw_data = self._load_synthetic_data()
                all_nuclei = ["NÚCLEO DE HIDROGÊNIO", "NÚCLEO DE COMBUSTÃO", 'NÚCLEO DE SISTEMAS EMBARCADOS', 'NÚCLEO DE AERODINÂMICA']
            else:
                raw_data, all_nuclei = fetch_training_dataset()
        except:
            Exception("Erro ao buscar dados reais. Usando fallback sintético local.")
        
        return raw_data, all_nuclei
        
    def _load_data_checkpoint(self) -> None:
        """
        Baixa o checkpoint do Cloudinary para /tmp.
        """
        try: 
            self.storage_service.download_file(self.checkpoint_id, self.local_checkpoint)
            self.storage_service.download_file(self.labels_name, os.path.join(self.local_tmp_dir, "labels.json"))
            self.storage_service.download_file(self.ml_cloud_state, os.path.join(self.local_tmp_dir, "training_state.json"))
        except Exception as e:
            print(f"Erro ao baixar checkpoint: {e}")
            return 

    def _load_system_config(self) -> SystemConfigModel:
        """
        Carrega as configurações do sistema.
        """
        return get_active_config()
    
    def _load_weight_model(self) -> None:
        """
        Carrega os pesos do modelo a partir do checkpoint local, se existir.
        """
        if os.path.exists(self.local_checkpoint):
            print("🔄 Carregando pesos recuperados...")
            try:
                self.model.load_weights(self.local_checkpoint)
            except:
                print("⚠️ Pesos incompatíveis. Reiniciando.")

    def _load_synthetic_data(self) -> List[Dict]:
        """
        Carrega dados sintéticos de fallback a partir do arquivo local.
        """
        with open(self.synthetic_data_path, "r") as f:
            synthetic_data = json.load(f)
        return synthetic_data

    def _upload_final_model(self, nuclei_labels) -> None:
        """
        Faz upload do modelo final treinado e dos labels para o armazenamento.
        """

        if not self.is_test: 
            local_final_train = f"{self.local_tmp_dir}/{self.model_build_id}.h5"
            local_final_label = f"{self.local_tmp_dir}/{self.labels_name}"
            self.model.save(local_final_train)
            
            StorageService.upload_model(local_final_train, self.model_build_id)
            StorageService.upload_model(local_final_label, self.labels_name)
        else:
            os.makedirs(os.path.dirname(self.synthetic_train_path), exist_ok=True)
            self.model.save(self.synthetic_train_path)


        with open(self.labels_name, "w") as f:
            json.dump(nuclei_labels, f)

    def pipeline_training(self) -> Dict:
        """
        Pipeline completa de treinamento da Engine 2.
        """
        # 1. Load system configs
        system_config = self._load_system_config()

        # ============= VERIFY CONFIGS AND STATE ================

        if not system_config.autoTrainingEnabled:
            logger.logging.info("Auto-treinamento desabilitado nas configs do sistema. Pulando treinamento.")
            return {"status": "skipped", "reason": "disabled_by_config"} 
        
        # 1. Load bd train data and nuclei labels name
        raw_data, nuclei_labels = self._load_data_bd()

        # 2. Data checkpoint Download
        self._load_data_checkpoint()

        # ============= PREPARE MODEL ================

        # 3. Load model weights 
        self._load_weight_model()

        # ============= PREPARE TENSORS ================

        X_names = np.full((len(raw_data), self.max_subjects), "", dtype=object)
        X_meta = np.zeros((len(raw_data), self.max_subjects, 2), dtype=float)
        X_sem = np.zeros((len(raw_data), 1), dtype=float)
        X_course = np.full((len(raw_data), 1), "", dtype=object)

        Y = np.zeros((len(raw_data), len(nuclei_labels)), dtype=float)

        for i, row in enumerate(raw_data):
            hist = row['academic_history']
            for j, subj in enumerate(hist):
                if j >= self.max_subjects: break
                X_names[i, j] = subj['name']
                X_meta[i, j, 0] = subj['grade'] / 10.0      
                X_meta[i, j, 1] = subj['workload'] / 100.0  
                
            X_sem[i, 0] = row['semester_at_entry'] / 10.0
            X_course[i, 0] = row['course']

            Y[i] = self._calculate_training_target(row['outcomes'], nuclei_labels)
        
        
        # 3. Model Building
        self.model = build_deep_set_architecture(
            max_subjects=self.max_subjects,
            hashing_bins_subjects=self.HASH_BINS_SUBJ,
            hashing_bins_courses=self.HASH_BINS_COURSE,
            embedding_dim=64,
            nuclei_labels=nuclei_labels
        )

        X_names_tensor = tf.constant(X_names, dtype=tf.string)
        X_course_tensor = tf.constant(X_course, dtype=tf.string)
        
        # =================== SAVE CHECKPOINTS ===================

        guardian = ResourcesGuardianCallback(
            time_budget_minutes=self.config.trainingTimeBudgetMin,
            checkpoint_path=self.checkpoint_id
        )

        history = self.model.fit(
            x=[X_names_tensor, X_meta, X_sem, X_course_tensor],
            y=Y,
            epochs=self.config.maxEpochsPerRun,
            callbacks=[guardian],
            verbose=1
        )

        # =================== SAVE FINAL MODEL ===================
        self._upload_final_model(nuclei_labels)

        if not self.model.stop_training:
            logging.info("Treinamento concluído. Publicando modelo final.")
            
        
        return {"status": "success", "epochs_trained": len(history.history['loss'])}



    def _calculate_training_target(self, outcomes: List[Dict], nuclei_labels: List[str]) -> np.ndarray:
        """
        Transforma a REALIDADE COMPLEXA em um vetor de probabilidades (Target).
        
        Lógica:
        - Se status == 0 (Saiu): Target = 0.0
        - Se status == 1 (Ativo): 
            Target = (Norm(Social) + Norm(Tecnico)) / 2
        """
        target_vector = np.zeros(len(nuclei_labels), dtype=float)
        
        for outcome in outcomes:
            raw_name = outcome['nucleus']
            nuc_name = raw_name.upper().strip()
            if nuc_name not in nuclei_labels: continue
            
            idx = nuclei_labels.index(nuc_name)
            
            # Lógica de "Juiz":
            if outcome['status'] == 0:
                score = 0.0 # Reprovado pela realidade
            else:
                social_avg = np.mean(list(outcome['social'].values())) if outcome['social'] else 0
                tech_vol = sum(outcome['tech'].values())
                
                norm_social = min(social_avg / 10.0, 1.0)
                norm_tech = min(tech_vol / 10.0, 1.0) 
                
                score = (norm_social * 0.6) + (norm_tech * 0.4)
                
            target_vector[idx] = score

        return target_vector