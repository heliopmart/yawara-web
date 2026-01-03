import logging
import numpy as np
import tensorflow as tf
import os
import json
from typing import List, Dict, Any, Optional

# ------- CONFIGS ----------
from app.core.config import settings

# ------- SCHEMAS ----------
from app.schemas.candidate import CandidateInput
from app.schemas.historic import SubjectRecord, AcademicRecord

# ------- CLASS ----------
from app.services.neural_resolver import get_resolver
from app.services.ingestion import ingest_academic_record_from_pdf 

# --- IMPORTANDO A ARQUITETURA ---
from app.ml.architectures.nucleus_recommender_nn import build_deep_set_architecture

logger = logging.getLogger("yawara.ml.engine_v2")

# --- CONFIGURAÇÕES GLOBAIS ---
MAX_SUBJECTS_PER_STUDENT = 100
MAX_SUBJECTS=100
HASHING_BINS = 5000
EMBEDDING_DIM = 64

class EngineDataProcessor:
    """
    Responsável por transformar PDF/Dados Brutos em Tensores para a Rede Neural.
    Agora integrado com o DynamicNeuralResolver para garantir a qualidade do dado.
    """

    def __init__(self):
        self.resolver = get_resolver()

    @staticmethod
    def normalize_grade(grade: float | None) -> float:
        if grade is None: return 0.0
        return float(grade) / 10.0

    @staticmethod
    def normalize_workload(hours: int) -> float:
        return min(float(hours) / 100.0, 1.2)

    @staticmethod
    def normalize_semester(semester: int) -> float:
        return min(float(semester) / 10.0, 1.0)

    async def ingest_and_prepare(self, candidate: CandidateInput, pdf_bytes: bytes) -> Dict[str, np.ndarray]:
        """
        Orquestra o pipeline completo: 
        PDF -> Texto Sujo -> Canonical (Resolver) -> Tensor (Engine).
        """
        try:
            academic_record = await ingest_academic_record_from_pdf(pdf_bytes)
            subjects = academic_record.subjects
        except Exception as e:
            logger.error(f"[Engine 2] Falha na ingestão do PDF: {e}")
            subjects = []

        return self.records_to_tensor(candidate, subjects)

    def records_to_tensor(self, candidate: CandidateInput, historic: List[SubjectRecord]) -> Dict[str, np.ndarray]:
        """Converte a lista de registros (já com nomes brutos) em tensores."""
        
        batch_names = np.full((1, MAX_SUBJECTS_PER_STUDENT), "", dtype=object)
        batch_meta = np.zeros((1, MAX_SUBJECTS_PER_STUDENT, 2), dtype=np.float32)
        batch_context = np.zeros((1, 1), dtype=np.float32)

        count = 0
        for record in historic:
            if count >= MAX_SUBJECTS_PER_STUDENT: break
            
            # --- INTEGRAÇÃO COM NEURAL RESOLVER ---
            canonical_name = record.subject_canonical
            
            if not canonical_name:
                logger.info(f"[Engine 2] Resolvendo on-the-fly: {record.name_raw}")
                resolution = self.resolver.resolve(record.name_raw)
                canonical_name = resolution["canonical"]

            batch_names[0, count] = canonical_name

            batch_meta[0, count, 0] = self.normalize_grade(record.grade)
            batch_meta[0, count, 1] = self.normalize_workload(record.workload_hours)
            
            count += 1

        batch_context[0, 0] = self.normalize_semester(candidate.semester)

        return {
            "subject_names": batch_names,
            "subject_meta": batch_meta,
            "student_context": batch_context
        }

# Instância global
processor = EngineDataProcessor()

class NucleusRecommendationEngine:
    """
    Engine 2: Realiza a inferência usando o modelo treinado.
    """
    _instance = None

    def __init__(self):
        self.model_path = settings.ML_ENGINE_2_PATH
        self.labels_path = settings.ML_ENGINE_2_LABELS_PATH
        self.model = None
        self.labels = []
        self._load_artifacts()

    def _load_artifacts(self):
        if not os.path.exists(self.model_path):
            logger.warning("[Engine 2] Modelo não encontrado. Rode o script de treino primeiro.")
            return

        try:
            self.model = tf.keras.models.load_model(self.model_path)
            with open(self.labels_path, "r") as f:
                self.labels = json.load(f)
            logger.info(f"[Engine 2] Carregado. Núcleos conhecidos: {len(self.labels)}")
        except Exception as e:
            logger.error(f"[Engine 2] Erro fatal no loading: {e}")

    def predict(self, candidate: CandidateInput, historic: List[SubjectRecord]) -> Dict[str, Any]:
        """
        Retorna as probabilidades para cada núcleo.
        """
        if not self.model:
            return {"error": "Model not loaded", "recommendations": []}

        # 1. Preparar Input (Exatamente como no treino)
        # Batch size = 1
        X_names = np.full((1, MAX_SUBJECTS), "", dtype=object)
        X_meta = np.zeros((1, MAX_SUBJECTS, 2), dtype=float)
        X_sem = np.zeros((1, 1), dtype=float)
        X_course = np.full((1, 1), "", dtype=object)

        # Preenche Histórico
        for i, rec in enumerate(historic):
            if i >= MAX_SUBJECTS: break
            # Usa canonical se tiver, senão raw
            name = rec.subject_canonical or rec.name_raw.upper()
            X_names[0, i] = name
            
            grade = float(rec.grade) if rec.grade is not None else 0.0
            workload = float(rec.workload_hours) if rec.workload_hours else 60.0
            
            X_meta[0, i, 0] = grade / 10.0
            X_meta[0, i, 1] = workload / 100.0

        # Preenche Contexto
        X_sem[0, 0] = float(candidate.semester) / 10.0
        X_course[0, 0] = candidate.course.upper() # Importante ser UPPER

    
        X_names_tf = tf.constant(X_names, dtype=tf.string)
        X_course_tf = tf.constant(X_course, dtype=tf.string)

        # 2. Inferência
        probs = self.model.predict([X_names_tf, X_meta, X_sem, X_course_tf], verbose=0)[0]
        # 3. Formatar Saída
        result = {}
        unlocked = []
        
        for i, label in enumerate(self.labels):
            score = float(probs[i])
            status = "UNLOCKED" if score >= 0.5 else "LOCKED" # Threshold arbitrário
            
            result[label] = {
                "score": round(score, 4),
                "status": status
            }
            if status == "UNLOCKED":
                unlocked.append(label)

        return {
            "predictions": result,
            "recommended_nuclei": unlocked
        }

# Factory
def get_recommender():
    if NucleusRecommendationEngine._instance is None:
        NucleusRecommendationEngine._instance = NucleusRecommendationEngine()
    return NucleusRecommendationEngine._instance