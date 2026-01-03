# app/ml/train_engine_v2.py
import json
import logging
import numpy as np
import tensorflow as tf
import os
from typing import List, Dict, Optional, Any

from app.services.system_configs import get_active_config, SystemConfigModel
from app.utils.training_callbacks import CheckpointAndStateCallback, BestCheckpointCallback
from app.utils.db_loader_trainer import fetch_training_dataset, fetch_nuclei_labels
from app.ml.architectures.nucleus_recommender_nn import build_deep_set_architecture

from app.services.storage import StorageService
from app.core.config import settings

logger = logging.getLogger("yawara.training.train_engine_v2")


class TrainingEngineV2:
    def __init__(self, is_test: bool = False):
        self.is_test = is_test

        self.configs = get_active_config()
        self.storage_service = StorageService()

        self.model = None
        self.labels: List[str] = []
        self.last_processed_id: int = 0
        self.total_epochs_trained: int = 0

        # Global early stopping (entre execuções)
        self.best_val_loss: Optional[float] = None
        self.no_improve_runs: int = 0

        self.max_subjects = settings.ML_MAX_SUBJECTS
        self.batch_size = settings.ML_BATCH_SIZE
        self.local_tmp_dir = settings.ML_LOCAL_TMP_DIR

        self.synthetic_data_path = settings.SYNTHETIC_DATA_PATH
        self.synthetic_train_path = settings.SYNTHETIC_TRAIN_PATH

        self.model_build_id = settings.ML_CLOUD_MODEL_NAME
        self.labels_name = settings.ML_CLOUD_LABELS_NAME
        self.ml_cloud_state = settings.ML_CLOUD_STATE_NAME

        # checkpoint "normal" (continuidade)
        self.checkpoint_id = settings.ML_CLOUD_CHECKPOINT_NAME
        self.local_checkpoint = os.path.join(self.local_tmp_dir, f"{self.checkpoint_id}.weights.h5")

        # best checkpoint (qualidade)
        self.best_checkpoint_id = settings.ML_CLOUD_BEST_CHECKPOINT_NAME
        self.local_best_checkpoint = os.path.join(self.local_tmp_dir, f"{self.best_checkpoint_id}.weights.h5")

        self.local_labels_path = os.path.join(self.local_tmp_dir, self.labels_name)
        self.local_state_path = os.path.join(self.local_tmp_dir, self.ml_cloud_state)

        self.HASH_BINS_SUBJ = 5000
        self.HASH_BINS_COURSE = 100

    # -----------------------
    # Helpers de config (SystemConfig -> fallback settings)
    # -----------------------
    def _load_system_config(self) -> SystemConfigModel:
        return get_active_config()

    def _get_time_budget_min(self, system_config: SystemConfigModel) -> int:
        v = getattr(system_config, "trainingTimeBudgetMin", None) or getattr(self.configs, "trainingTimeBudgetMin", None)
        return int(v) if v is not None else int(settings.ML_TRAIN_TIME_BUDGET_MIN)

    def _get_epochs_per_run(self, system_config: SystemConfigModel) -> int:
        v = getattr(system_config, "maxEpochsPerRun", None) or getattr(self.configs, "maxEpochsPerRun", None)
        return int(v) if v is not None else int(settings.ML_MAX_EPOCHS_PER_RUN)

    def _get_target_total_epochs(self, system_config: SystemConfigModel) -> int:
        v = getattr(system_config, "targetTotalEpochs", None)
        return int(v) if v is not None else int(settings.ML_TARGET_TOTAL_EPOCHS)

    # -----------------------
    # Storage (download state/labels/ckpt)
    # -----------------------
    def _load_data_checkpoint(self) -> None:
        # best checkpoint (qualidade)

        # ! ============================== PRINT ==================================
        print("[DBG][ENGINE] exists(local_state_before_download)=", os.path.exists(self.local_state_path))
        if os.path.exists(self.local_state_path):
            try:
                with open(self.local_state_path, "r", encoding="utf-8") as f:
                    s = json.load(f)
                print("[DBG][ENGINE] local_state_before_download last_processed_id=", s.get("last_processed_id"))
            except Exception as e:
                print("[DBG][ENGINE] local_state_before_download read FAIL:", str(e)[:120])
        # ! ============================== PRINT ==================================

        try:
            self.storage_service.download_file(self.best_checkpoint_id, self.local_best_checkpoint)
        except Exception:
            pass

        # checkpoint normal (continuidade)
        try:
            self.storage_service.download_file(self.checkpoint_id, self.local_checkpoint)
        except Exception:
            pass

        # labels + state
        try:
            self.storage_service.download_file(self.labels_name, self.local_labels_path)
        except Exception:
            pass
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

    def _load_state_if_exists(self) -> Optional[Dict[str, Any]]:
        if not os.path.exists(self.local_state_path):
            return None
        try:
            with open(self.local_state_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return None

    def _ensure_labels_local(self, nuclei_labels: List[str]) -> None:
        os.makedirs(os.path.dirname(self.local_labels_path), exist_ok=True)
        with open(self.local_labels_path, "w", encoding="utf-8") as f:
            json.dump(list(nuclei_labels), f, ensure_ascii=False, indent=2)

    def _state_provider(self, nuclei_labels: List[str], extra: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        state = {
            "total_epochs_trained": int(self.total_epochs_trained),
            "last_processed_id": int(self.last_processed_id),
            "labels": list(nuclei_labels),
            "best_val_loss": self.best_val_loss,
            "no_improve_runs": int(self.no_improve_runs),
        }
        if extra:
            state.update(extra)
        return state

    # -----------------------
    # Target
    # -----------------------
    def _calculate_training_target(self, outcomes: List[Dict], nuclei_labels: List[str]) -> np.ndarray:
        target_vector = np.zeros(len(nuclei_labels), dtype=float)

        for outcome in outcomes:
            nuc_name = str(outcome.get("nucleus", "")).upper().strip()
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
    # Passo 5: Balanceamento (Weighted MSE por núcleo)
    # -----------------------
    def _compute_class_weights(self, Y: np.ndarray) -> np.ndarray:
        thr = float(getattr(settings, "ML_POSITIVE_THRESHOLD", 0.001))
        eps = float(getattr(settings, "ML_CLASS_WEIGHT_EPS", 1e-6))
        wmin = float(getattr(settings, "ML_CLASS_WEIGHT_MIN", 0.25))
        wmax = float(getattr(settings, "ML_CLASS_WEIGHT_MAX", 8.0))

        positives = (Y > thr).astype(np.float32)
        pos_counts = positives.sum(axis=0)
        total = float(Y.shape[0])

        freq = (pos_counts / max(total, 1.0)) + eps
        weights = 1.0 / freq
        weights = weights / (weights.mean() + eps)
        weights = np.clip(weights, wmin, wmax)
        return weights.astype(np.float32)

    def _weighted_mse_loss(self, class_weights: np.ndarray):
        cw = tf.constant(class_weights, dtype=tf.float32)

        def loss(y_true, y_pred):
            err2 = tf.square(y_true - y_pred)
            weighted = err2 * cw
            return tf.reduce_mean(weighted)

        return loss

    # -----------------------
    # Build tensors (chunk -> tensors)
    # -----------------------
    def _build_tensors(self, raw_data: List[Dict[str, Any]], nuclei_labels: List[str]):
        n = len(raw_data)
        X_names = np.full((n, self.max_subjects), "", dtype=object)
        X_meta = np.zeros((n, self.max_subjects, 2), dtype=float)
        X_sem = np.zeros((n, 1), dtype=float)
        X_course = np.full((n, 1), "", dtype=object)
        Y = np.zeros((n, len(nuclei_labels)), dtype=float)

        max_pm_id = None

        for i, row in enumerate(raw_data):
            pm_id = row.get("pm_id")
            if isinstance(pm_id, int):
                max_pm_id = pm_id if (max_pm_id is None or pm_id > max_pm_id) else max_pm_id

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
        return (X_names_tensor, X_meta, X_sem, X_course_tensor, Y, max_pm_id)

    # -----------------------
    # Fixed validation set (estável entre runs)
    # -----------------------
    def _get_fixed_validation(self, nuclei_labels: List[str]) -> Optional[tuple]:
        if self.is_test:
            return None

        val_limit = int(getattr(settings, "ML_VAL_CHUNK_SIZE", 256))
        val_courses = getattr(settings, "ML_VAL_COURSES", None)

        raw_val, _, _meta = fetch_training_dataset(
            after_pm_id=0,
            limit=val_limit,
            courses=val_courses,
            chunks_per_call=1
        )
        if not raw_val:
            return None

        Xn, Xm, Xs, Xc, Yv, _ = self._build_tensors(raw_val, nuclei_labels)
        return (Xn, Xm, Xs, Xc, Yv)

    # -----------------------
    # Global early stopping (entre runs)
    # -----------------------
    def _update_global_earlystop(self, val_loss: Optional[float]) -> bool:
        if val_loss is None:
            return False

        min_delta = float(getattr(settings, "ML_EARLYSTOP_MIN_DELTA", 0.0005))
        patience = int(getattr(settings, "ML_EARLYSTOP_PATIENCE_RUNS", 8))

        if self.best_val_loss is None or (float(self.best_val_loss) - float(val_loss)) > min_delta:
            self.best_val_loss = float(val_loss)
            self.no_improve_runs = 0
            return False

        self.no_improve_runs += 1
        return self.no_improve_runs >= patience

    # -----------------------
    # Upload final model (publica o BEST)
    # -----------------------
    def _upload_final_model(self, nuclei_labels: List[str]) -> None:
        self._ensure_labels_local(nuclei_labels)

        # Publica o BEST (não o último)
        if os.path.exists(self.local_best_checkpoint):
            try:
                self.model.load_weights(self.local_best_checkpoint)
                print("🏆 Publicando modelo FINAL usando BEST checkpoint.")
            except Exception as e:
                print(f"⚠️ Falha ao carregar BEST. Publicando último estado. Erro: {e}")

        if self.is_test:
            os.makedirs(os.path.dirname(self.synthetic_train_path), exist_ok=True)
            self.model.save(self.synthetic_train_path)
            return

        local_final_model = os.path.join(self.local_tmp_dir, f"{self.model_build_id}.keras")
        self.model.save(local_final_model)

        # mantém seu padrão atual: upload_file
        self.storage_service.upload_file(local_final_model, self.model_build_id)
        self.storage_service.upload_file(self.local_labels_path, self.labels_name)

    # -----------------------
    # Pipeline
    # -----------------------
    def pipeline_training(self) -> Dict[str, Any]:
        # !=============================== PRINT ==================================
        print("\n[DBG][ENGINE] ===== pipeline_training START =====")
        print("[DBG][ENGINE] is_test=", self.is_test)
        print("[DBG][ENGINE] last_processed_id inicial=", self.last_processed_id)
        print("[DBG][ENGINE] local_state_path=", self.local_state_path)
        print("[DBG][ENGINE] local_labels_path=", self.local_labels_path)
        # !=============================== PRINT ==================================

        system_config = self._load_system_config()
        if not system_config.autoTrainingEnabled:
            return {"status": "skipped", "reason": "disabled_by_config"}

        # 1) baixar artefatos
        self._load_data_checkpoint()

        # 2) state/labels
        state = self._load_state_if_exists() or {}

        self.total_epochs_trained = int(state.get("total_epochs_trained", 0))
        self.last_processed_id = int(state.get("last_processed_id", 0))
        self.best_val_loss = state.get("best_val_loss", None)
        self.no_improve_runs = int(state.get("no_improve_runs", 0))

        labels_from_cloud = self._load_labels_if_exists()
        nuclei_labels = labels_from_cloud or fetch_nuclei_labels()
        if not nuclei_labels:
            return {"status": "error", "reason": "no_nuclei_labels"}
        self._ensure_labels_local(nuclei_labels)

        # 3) build model
        self.model = build_deep_set_architecture(
            max_subjects=self.max_subjects,
            hashing_bins_subjects=self.HASH_BINS_SUBJ,
            hashing_bins_courses=self.HASH_BINS_COURSE,
            embedding_dim=64,
            nuclei_labels=nuclei_labels
        )

        # 4) resume weights (prioridade: checkpoint normal -> best)
        resumed = False
        if os.path.exists(self.local_checkpoint):
            try:
                self.model.load_weights(self.local_checkpoint)
                resumed = True
                print("🔄 Resume OK: pesos carregados do checkpoint normal.")
            except Exception as e:
                print(f"⚠️ Checkpoint normal incompatível. Continuando sem ele. Erro: {e}")
        elif os.path.exists(self.local_best_checkpoint):
            try:
                self.model.load_weights(self.local_best_checkpoint)
                print("🏆 Loaded BEST checkpoint como inicialização.")
            except Exception:
                pass

        # 5) configs de execução
        time_budget = self._get_time_budget_min(system_config)
        epochs_run = self._get_epochs_per_run(system_config)
        stop_ratio = float(getattr(system_config, "guardianStopAtRatio", None) or settings.ML_GUARDIAN_STOP_AT_RATIO)

        chunk_size = int(getattr(settings, "ML_DB_CHUNK_SIZE", 256))
        max_chunks = int(getattr(settings, "ML_MAX_CHUNKS_PER_RUN", 10))

        courses_filter = None  # plugar seu pipeline depois

        fixed_val = self._get_fixed_validation(nuclei_labels)

        # 6) guardian (checkpoint normal + state + labels)

        time_budget_min = float(system_config.trainingTimeBudgetMin or 30)
        upload_interval_seconds = max(60, int((time_budget_min * 60) / 3))  # 30/3 => 10min

        guardian_cb = CheckpointAndStateCallback(
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
            state_provider=lambda: self._state_provider(
                nuclei_labels,
                extra={"last_run_note": "during_fit"}
            ),
            is_test=self.is_test,
            verbose=True,

            time_budget_seconds=time_budget_min * 60,
            upload_interval_seconds=upload_interval_seconds,
            upload_on_train_end=True,
            upload_enabled=True,
        )

        # 7) best checkpoint (qualidade)
        best_cb = BestCheckpointCallback(
            best_checkpoint_remote_name=self.best_checkpoint_id,
            best_checkpoint_local_path=self.local_best_checkpoint,
            monitor="val_loss",
            min_delta=float(getattr(settings, "ML_EARLYSTOP_MIN_DELTA", 0.0005)),
            is_test=self.is_test,
            verbose=True
        )

        # 8) loop de chunks
        trained_epochs_total_this_run = 0
        trained_rows_total_this_run = 0
        last_chunk_meta = None
        last_val_loss = None

        compiled_once = False

        for _chunk_idx in range(max_chunks):
            raw_chunk, _, meta = fetch_training_dataset(
                after_pm_id=self.last_processed_id,
                limit=chunk_size,
                courses=courses_filter,
                chunks_per_call=1
            )

            # !=============================== PRINT ==================================    
            print("[DBG][ENGINE] raw_chunk type=", type(raw_chunk), "len=", (len(raw_chunk) if isinstance(raw_chunk, list) else "n/a"))

            if not raw_chunk:
                print("[DBG][ENGINE] raw_chunk vazio -> BREAK (sem fit, sem callback, sem upload)")
                break
            # !=============================== PRINT ==================================    

            last_chunk_meta = meta

            if not raw_chunk:
                break

            Xn, Xm, Xs, Xc, Y, max_pm_id = self._build_tensors(raw_chunk, nuclei_labels)

            # cursor
            if isinstance(max_pm_id, int) and max_pm_id > self.last_processed_id:
                self.last_processed_id = max_pm_id

            trained_rows_total_this_run += len(raw_chunk)

            # PASSO 5: compilar com loss balanceada (pelo menos 1x por execução)
            use_bal = bool(getattr(settings, "ML_USE_BALANCED_LOSS", True))
            if (not compiled_once) and use_bal:
                cw = self._compute_class_weights(Y)
                self.model.compile(
                    optimizer=tf.keras.optimizers.Adam(learning_rate=1e-3),
                    loss=self._weighted_mse_loss(cw),
                )
                compiled_once = True
            elif not compiled_once:
                # fallback: compile padrão se sua arquitetura não veio compilada
                try:
                    self.model.compile(
                        optimizer=tf.keras.optimizers.Adam(learning_rate=1e-3),
                        loss="mse",
                    )
                except Exception:
                    pass
                compiled_once = True

            fit_kwargs = dict(
                x=[Xn, Xm, Xs, Xc],
                y=Y,
                epochs=epochs_run,
                callbacks=[guardian_cb, best_cb],
                verbose=1
            )

            if fixed_val is not None:
                vXn, vXm, vXs, vXc, vY = fixed_val
                fit_kwargs["validation_data"] = ([vXn, vXm, vXs, vXc], vY)

            history = self.model.fit(**fit_kwargs)

            # !=============================== PRINT ==================================
            print("[DBG][ENGINE] model.fit terminou")
            # !=============================== PRINT ==================================

            trained_now = len(history.history.get("loss", []))
            trained_epochs_total_this_run += trained_now
            self.total_epochs_trained += trained_now

            if "val_loss" in history.history and len(history.history["val_loss"]) > 0:
                last_val_loss = float(history.history["val_loss"][-1])

            if getattr(self.model, "stop_training", False):
                break
            if not meta.get("has_more", False):
                break

        # 9) early stop global
        should_earlystop = self._update_global_earlystop(last_val_loss)

        # 10) decide publicar ou continuar
        target_total = self._get_target_total_epochs(system_config)
        finished_by_epochs = self.total_epochs_trained >= target_total
        finished_by_earlystop = bool(should_earlystop)



        if getattr(self.model, "stop_training", False):
            return {
                "status": "partial",
                "reason": "guardian_stop",
                "resumed": resumed,
                "trained_rows_this_run": trained_rows_total_this_run,
                "trained_epochs_this_run": trained_epochs_total_this_run,
                "total_epochs_trained": self.total_epochs_trained,
                "target_total_epochs": target_total,
                "val_loss": last_val_loss,
                "best_val_loss": self.best_val_loss,
                "no_improve_runs": self.no_improve_runs,
                "published": False,
                "meta": last_chunk_meta,
            }

        if not (finished_by_epochs or finished_by_earlystop):
            return {
                "status": "partial",
                "reason": "not_finished",
                "resumed": resumed,
                "trained_rows_this_run": trained_rows_total_this_run,
                "trained_epochs_this_run": trained_epochs_total_this_run,
                "total_epochs_trained": self.total_epochs_trained,
                "target_total_epochs": target_total,
                "val_loss": last_val_loss,
                "best_val_loss": self.best_val_loss,
                "no_improve_runs": self.no_improve_runs,
                "published": False,
                "meta": last_chunk_meta,
            }

        # 11) publica final (BEST)
        self._upload_final_model(nuclei_labels)

        return {
            "status": "success",
            "reason": "finished_and_published" if finished_by_epochs else "earlystop_and_published",
            "resumed": resumed,
            "trained_rows_this_run": trained_rows_total_this_run,
            "trained_epochs_this_run": trained_epochs_total_this_run,
            "total_epochs_trained": self.total_epochs_trained,
            "target_total_epochs": target_total,
            "val_loss": last_val_loss,
            "best_val_loss": self.best_val_loss,
            "no_improve_runs": self.no_improve_runs,
            "published": True,
            "meta": last_chunk_meta,
        }
