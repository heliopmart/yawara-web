# app/ml/train_engine_v2.py
import json
import logging
import numpy as np
import tensorflow as tf
import os
from typing import List, Dict, Tuple, Optional

from app.services.system_configs import get_active_config, SystemConfigModel
from app.utils.training_callbacks import CheckpointAndStateCallback
from app.utils.db_loader_trainer import fetch_training_dataset
from app.ml.architectures.nucleus_recommender_nn import build_deep_set_architecture

from app.training.artifacts import TrainingState
from app.services.storage import StorageService
from app.core.config import settings

logger = logging.getLogger("yawara.training.train_engine_v2")


class TrainingEngineV2:
    def __init__(self, is_test: bool = False):
        self.is_test = is_test

        # Configs (SystemConfig)
        self.configs = get_active_config()
        self.storage_service = StorageService()

        # Estado volátil (memória)
        self.model = None
        self.labels: List[str] = []
        self.last_processed_id: int = 0
        self.total_epochs_trained: int = 0

        # Constantes / Settings
        self.max_subjects = settings.ML_MAX_SUBJECTS
        self.batch_size = settings.ML_BATCH_SIZE
        self.local_tmp_dir = settings.ML_LOCAL_TMP_DIR

        self.synthetic_data_path = settings.SYNTHETIC_DATA_PATH
        self.synthetic_train_path = settings.SYNTHETIC_TRAIN_PATH

        # IDs remotos (Cloudinary)
        self.model_build_id = settings.ML_CLOUD_MODEL_NAME
        self.labels_name = settings.ML_CLOUD_LABELS_NAME
        self.ml_cloud_state = settings.ML_CLOUD_STATE_NAME
        self.checkpoint_id = settings.ML_CLOUD_CHECKPOINT_NAME

        # Paths locais padronizados
        self.local_checkpoint = os.path.join(self.local_tmp_dir, f"{self.checkpoint_id}.weights.h5")
        self.local_labels_path = os.path.join(self.local_tmp_dir, self.labels_name)
        self.local_state_path = os.path.join(self.local_tmp_dir, self.ml_cloud_state)

        # Hashing bins / arquitetura
        self.HASH_BINS_SUBJ = 5000
        self.HASH_BINS_COURSE = 100

    # -----------------------
    # LOADERS
    # -----------------------

    def _load_system_config(self) -> SystemConfigModel:
        return get_active_config()

    def _load_synthetic_data(self) -> List[Dict]:
        with open(self.synthetic_data_path, "r", encoding="utf-8") as f:
            return json.load(f)

    def _load_data_bd(self) -> Tuple[List[Dict], List[str]]:
        try:
            if self.is_test:
                raw_data = self._load_synthetic_data()
                nuclei = [
                    "NÚCLEO DE HIDROGÊNIO",
                    "NÚCLEO DE COMBUSTÃO",
                    "NÚCLEO DE SISTEMAS EMBARCADOS",
                    "NÚCLEO DE AERODINÂMICA",
                ]
                return raw_data, nuclei

            raw_data, nuclei, meta = fetch_training_dataset(
                after_pm_id=self.last_processed_id,
                limit=settings.ML_DB_CHUNK_SIZE,
                courses=None,
                chunks_per_call=1
            )

            self.last_processed_id = meta["next_after_pm_id"]

            return raw_data, nuclei

        except Exception as e:
            logger.warning(f"Erro ao buscar dados reais. Usando fallback sintético. Erro: {e}")
            raw_data = self._load_synthetic_data()
            nuclei = [
                "NÚCLEO DE HIDROGÊNIO",
                "NÚCLEO DE COMBUSTÃO",
                "NÚCLEO DE SISTEMAS EMBARCADOS",
                "NÚCLEO DE AERODINÂMICA",
            ]
            return raw_data, nuclei

    def _load_data_checkpoint(self) -> None:
        # weights
        try:
            self.storage_service.download_file(self.checkpoint_id, self.local_checkpoint)
        except Exception:
            pass

        # labels
        try:
            self.storage_service.download_file(self.labels_name, self.local_labels_path)
        except Exception:
            pass

        # state
        try:
            self.storage_service.download_file(self.ml_cloud_state, self.local_state_path)
        except Exception:
            pass

    def _load_labels_if_exists(self) -> Optional[List[str]]:
        if not os.path.exists(self.local_labels_path):
            return None
        try:
            with open(self.local_labels_path, "r", encoding="utf-8") as f:
                labels = json.load(f)
            return [str(x).upper().strip() for x in labels]
        except Exception:
            return None

    def _load_state_if_exists(self) -> Optional[Dict]:
        if not os.path.exists(self.local_state_path):
            return None
        try:
            with open(self.local_state_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return None

    def _normalize_nuclei_from_db(self, nuclei_from_db) -> List[str]:
        if not nuclei_from_db:
            return []
        if isinstance(nuclei_from_db, list) and len(nuclei_from_db) > 0:
            first = nuclei_from_db[0]
            if isinstance(first, dict) and "name" in first:
                return [str(x["name"]).upper().strip() for x in nuclei_from_db if "name" in x]
            return [str(x).upper().strip() for x in nuclei_from_db]
        return []

    def _ensure_labels_local(self, nuclei_labels: List[str]) -> None:
        os.makedirs(os.path.dirname(self.local_labels_path), exist_ok=True)
        with open(self.local_labels_path, "w", encoding="utf-8") as f:
            json.dump(list(nuclei_labels), f, ensure_ascii=False, indent=2)

    def _state_provider(self, nuclei_labels: List[str]) -> Dict:
        # state mínimo pra retomar

        state = TrainingState(
            run_id=self.model_build_id, # ou outro ID único
            model_id=self.model_build_id,
            labels_id=self.labels_name,
            checkpoint_id=self.checkpoint_id,
            state_id=self.ml_cloud_state,
            total_epochs_trained=int(self.total_epochs_trained),
            last_processed_id=int(self.last_processed_id),
            labels=nuclei_labels,
        )

        return state.to_dict()

        return {
            "total_epochs_trained": int(self.total_epochs_trained),
            "last_processed_id": int(self.last_processed_id),
            "labels": list(nuclei_labels),
        }

    # -----------------------
    # TARGET
    # -----------------------

    def _calculate_training_target(self, outcomes: List[Dict], nuclei_labels: List[str]) -> np.ndarray:
        target_vector = np.zeros(len(nuclei_labels), dtype=float)

        for outcome in outcomes:
            raw_name = outcome.get("nucleus", "")
            nuc_name = str(raw_name).upper().strip()
            if nuc_name not in nuclei_labels:
                continue

            idx = nuclei_labels.index(nuc_name)

            if outcome.get("status") == 0:
                score = 0.0
            else:
                social = outcome.get("social") or {}
                tech = outcome.get("tech") or {}

                social_avg = float(np.mean(list(social.values()))) if social else 0.0
                tech_vol = float(sum(tech.values())) if tech else 0.0

                norm_social = min(social_avg / 10.0, 1.0)
                norm_tech = min(tech_vol / 10.0, 1.0)

                score = (norm_social * 0.6) + (norm_tech * 0.4)

            target_vector[idx] = score

        return target_vector

    # -----------------------
    # UPLOAD FINAL MODEL (somente quando "100% treinado")
    # -----------------------

    def _upload_final_model(self, nuclei_labels: List[str]) -> None:
        self._ensure_labels_local(nuclei_labels)

        if self.is_test:
            os.makedirs(os.path.dirname(self.synthetic_train_path), exist_ok=True)
            self.model.save(self.synthetic_train_path)
            return

        local_final_model = os.path.join(self.local_tmp_dir, f"{self.model_build_id}.keras")
        self.model.save(local_final_model)
        self.storage_service.upload_file(local_final_model, self.model_build_id)

        self.storage_service.upload_file(self.local_labels_path, self.labels_name)

    # -----------------------
    # HELPERS: pegar valores (SystemConfig -> fallback settings)
    # -----------------------

    def _get_time_budget_min(self, system_config: SystemConfigModel) -> int:
        # se existir no SystemConfig (DB), usa; senão fallback settings
        v = getattr(system_config, "trainingTimeBudgetMin", None)
        if v is None:
            v = getattr(self.configs, "trainingTimeBudgetMin", None)
        if v is None:
            v = settings.ML_TRAIN_TIME_BUDGET_MIN
        return int(v)

    def _get_epochs_per_run(self, system_config: SystemConfigModel) -> int:
        v = getattr(system_config, "maxEpochsPerRun", None)
        if v is None:
            v = getattr(self.configs, "maxEpochsPerRun", None)
        if v is None:
            v = settings.ML_MAX_EPOCHS_PER_RUN
        return int(v)

    def _get_target_total_epochs(self, system_config: SystemConfigModel) -> int:
        v = getattr(system_config, "targetTotalEpochs", None)
        if v is None:
            v = settings.ML_TARGET_TOTAL_EPOCHS
        return int(v)

    # -----------------------
    # PIPELINE
    # -----------------------

    def pipeline_training(self) -> Dict:
        system_config = self._load_system_config()

        if not system_config.autoTrainingEnabled:
            logger.info("Auto-treinamento desabilitado. Pulando.")
            return {"status": "skipped", "reason": "disabled_by_config"}

        # 1) baixar artefatos para /tmp
        self._load_data_checkpoint()

        # 2) carregar state/labels
        state = self._load_state_if_exists() or {}
        self.total_epochs_trained = int(state.get("total_epochs_trained", 0))
        self.last_processed_id = int(state.get("last_processed_id", 0))
        labels_from_cloud = self._load_labels_if_exists()

        # 3) dados
        raw_data, nuclei_from_db = self._load_data_bd()
        nuclei_labels_db = self._normalize_nuclei_from_db(nuclei_from_db)

        # 4) labelset final
        nuclei_labels = labels_from_cloud or nuclei_labels_db
        if not nuclei_labels:
            return {"status": "error", "reason": "no_nuclei_labels"}

        self._ensure_labels_local(nuclei_labels)

        # 5) preparar tensores (Etapa 3 vai chunkar)
        n = len(raw_data)

        X_names = np.full((n, self.max_subjects), "", dtype=object)
        X_meta = np.zeros((n, self.max_subjects, 2), dtype=float)
        X_sem = np.zeros((n, 1), dtype=float)
        X_course = np.full((n, 1), "", dtype=object)
        Y = np.zeros((n, len(nuclei_labels)), dtype=float)

        for i, row in enumerate(raw_data):
            hist = row.get("academic_history", [])
            for j, subj in enumerate(hist):
                if j >= self.max_subjects:
                    break
                X_names[i, j] = str(subj.get("name", ""))
                X_meta[i, j, 0] = float(subj.get("grade", 0)) / 10.0
                X_meta[i, j, 1] = float(subj.get("workload", 0)) / 100.0

            X_sem[i, 0] = float(row.get("semester_at_entry", 0)) / 10.0
            X_course[i, 0] = str(row.get("course", ""))

            Y[i] = self._calculate_training_target(row.get("outcomes", []), nuclei_labels)

        X_names_tensor = tf.constant(X_names, dtype=tf.string)
        X_course_tensor = tf.constant(X_course, dtype=tf.string)

        # 6) build
        self.model = build_deep_set_architecture(
            max_subjects=self.max_subjects,
            hashing_bins_subjects=self.HASH_BINS_SUBJ,
            hashing_bins_courses=self.HASH_BINS_COURSE,
            embedding_dim=64,
            nuclei_labels=nuclei_labels
        )

        # 7) resume
        resumed = False
        if os.path.exists(self.local_checkpoint):
            try:
                self.model.load_weights(self.local_checkpoint)
                resumed = True
                print("🔄 Resume OK: pesos carregados do checkpoint.")
            except Exception as e:
                print(f"⚠️ Checkpoint incompatível. Reiniciando do zero. Erro: {e}")

        # 8) guardian + checkpoint periódico
        time_budget = self._get_time_budget_min(system_config)
        epochs_run = self._get_epochs_per_run(system_config)
        stop_ratio = float(getattr(system_config, "guardianStopAtRatio", None) or settings.ML_GUARDIAN_STOP_AT_RATIO)

        cb = CheckpointAndStateCallback(
            time_budget_minutes=time_budget,
            checkpoint_remote_name=self.checkpoint_id,
            checkpoint_local_path=self.local_checkpoint,
            state_remote_name=self.ml_cloud_state,
            state_local_path=self.local_state_path,
            labels_remote_name=self.labels_name,
            labels_local_path=self.local_labels_path,
            save_every_epochs=1,
            save_every_seconds=120,
            stop_at_ratio=stop_ratio,
            state_provider=lambda: self._state_provider(nuclei_labels),
            is_test=self.is_test,
            verbose=True
        )

        history = self.model.fit(
            x=[X_names_tensor, X_meta, X_sem, X_course_tensor],
            y=Y,
            epochs=epochs_run,
            callbacks=[cb],
            verbose=1
        )

        trained_now = len(history.history.get("loss", []))
        self.total_epochs_trained += trained_now

        # 9) Publicar SOMENTE quando "100% treinado"
        target_total = self._get_target_total_epochs(system_config)

        # Se o guardian parou, sempre "partial"
        if getattr(self.model, "stop_training", False):
            return {
                "status": "partial",
                "reason": "guardian_stop",
                "resumed": resumed,
                "epochs_trained_now": trained_now,
                "total_epochs_trained": self.total_epochs_trained,
                "target_total_epochs": target_total,
                "published": False,
            }

        # Se não parou, mas ainda não atingiu o total, também é partial (continua amanhã/na próxima execução)
        if self.total_epochs_trained < target_total:
            return {
                "status": "partial",
                "reason": "not_finished",
                "resumed": resumed,
                "epochs_trained_now": trained_now,
                "total_epochs_trained": self.total_epochs_trained,
                "target_total_epochs": target_total,
                "published": False,
            }

        # Aqui sim: terminou
        self._upload_final_model(nuclei_labels)
        return {
            "status": "success",
            "reason": "finished_and_published",
            "resumed": resumed,
            "epochs_trained_now": trained_now,
            "total_epochs_trained": self.total_epochs_trained,
            "target_total_epochs": target_total,
            "published": True,
        }
