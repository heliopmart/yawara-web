import logging
import numpy as np
import tensorflow as tf
import os
import json
from typing import List, Dict, Any, Optional

# ------- CONFIGS ----------
from app.core.config import settings
from app.core.deprecated import deprecated

# ------- SCHEMAS ----------
from app.schemas.candidate import CandidateInput
from app.schemas.historic import SubjectRecord

# ------- SERVICES ----------
from app.services.neural_resolver import get_resolver
from app.services.ingestion import ingest_academic_record_from_pdf 
from app.services.storage import storage_service
from app.utils.academic_math import optimized_history_from_map

logger = logging.getLogger("yawara.ml.engine_v2")

# --- HIPERPARÂMETROS GLOBAIS (Devem dar match com o treino) ---
MAX_SUBJECTS_PER_STUDENT = 100
MAX_SUBJECTS = 100
HASHING_BINS = 5000
EMBEDDING_DIM = 64

class EngineDataProcessor:
    """
    Processador de Dados para a Engine V2.
    
    Responsabilidade:
        Transformar objetos Pydantic e listas de disciplinas em Tensores (NumPy arrays)
        formatados e normalizados para a entrada da Rede Neural.
        Também integra com o 'Neural Resolver' para normalizar nomes de matérias.
    """

    def __init__(self):
        # O Resolver usa NLP para corrigir "Calc. 1" -> "CALCULO_DIFERENCIAL_I"
        self.resolver = get_resolver()

    @staticmethod
    def normalize_grade(grade: Optional[float]) -> float:
        """Normaliza nota 0-10 para 0.0-1.0."""

        if grade is None: return 0.0
        try:
            val = float(grade)
            return min(max(val / 10.0, 0.0), 1.0)
        except (ValueError, TypeError):
            return 0.0

    @staticmethod
    def normalize_workload(hours: Optional[int]) -> float:
        """Normaliza carga horária. Assume ~100h como 1.0."""
        if not hours: return 0.6 # Default 60h
        return min(float(hours) / 100.0, 1.2)

    @staticmethod
    def normalize_semester(semester: int) -> float:
        """Normaliza semestre 1-10 para 0.1-1.0."""
        return min(float(semester) / 10.0, 1.0)

    async def ingest_and_prepare(self, candidate: CandidateInput, pdf_bytes: bytes) -> Dict[str, np.ndarray]:
        """
        Helper para testes: Recebe PDF bruto e devolve tensores prontos.
        """
        try:
            academic_record = await ingest_academic_record_from_pdf(pdf_bytes)
            subjects = academic_record.subjects
        except Exception as e:
            logger.error(f"[Processor] Falha na ingestão do PDF: {e}")
            subjects = []

        return self.records_to_tensor(candidate, subjects)

    def records_to_tensor(self, candidate: CandidateInput, historic: List[SubjectRecord]) -> Dict[str, np.ndarray]:
        """
        Converte histórico escolar em dicionário de tensores numpy.
        
        Outputs:
            - subject_names: (1, 100) strings (Input de Embedding)
            - subject_meta: (1, 100, 2) floats (Nota, Carga Horária)
            - student_context: (1, 1) float (Semestre atual)
        """

        optimized_map = optimized_history_from_map(historic)
        
        batch_names = np.full((1, MAX_SUBJECTS_PER_STUDENT), "", dtype=object)
        batch_meta = np.zeros((1, MAX_SUBJECTS_PER_STUDENT, 2), dtype=np.float32)
        batch_context = np.zeros((1, 1), dtype=np.float32)

        count = 0
        for record in optimized_map:
            if count >= MAX_SUBJECTS_PER_STUDENT: break
            
            # --- INTEGRAÇÃO COM NEURAL RESOLVER ---
            # Se a matéria não tem canônico, tentamos resolver agora.
            canonical_name = record.subject_canonical
            
            if not canonical_name:
                # logger.debug(f"Resolvendo on-the-fly: {record.name_raw}")
                resolution = self.resolver.resolve(record.name_raw)
                canonical_name = resolution["canonical"]

            batch_names[0, count] = canonical_name.upper()

            batch_meta[0, count, 0] = self.normalize_grade(record.grade)
            batch_meta[0, count, 1] = self.normalize_workload(record.workload_hours)
            
            count += 1

        batch_context[0, 0] = self.normalize_semester(candidate.semester)

        # Nota: O 'course' não está sendo retornado aqui, pois a arquitetura pode variar,
        # mas quem chama geralmente adiciona manualmente se necessário.
        return {
            "subject_names": batch_names,
            "subject_meta": batch_meta,
            "student_context": batch_context
        }

# Instância Global do Processor
processor = EngineDataProcessor()

class NucleusRecommendationEngine:
    """
    Wrapper da Rede Neural (TensorFlow/Keras).
    Carrega o modelo .keras e executa inferências.
    """
    _instance = None

    def __init__(self, is_test: bool = False):
        self.is_test = is_test
        self.model = None
        self.labels = []

        self._configure_paths()
        self._load_artifacts()

    def _configure_paths(self):
        if self.is_test:
            self.model_path = settings.SYNTHETIC_DATA_PATH
            self.labels_path = settings.SYNTHETIC_TRAIN_PATH
        else:
            self.model_path = settings.ML_ENGINE_2_PATH
            self.labels_path = settings.ML_ENGINE_2_LABELS_PATH

    @deprecated
    def _load_artifacts_v1(self):
        if not os.path.exists(self.model_path):
            logger.warning(f"[Engine 2] Modelo não encontrado em {self.model_path}. Modo de inferência desativado.")
            return
        
        try:
            self.model = tf.keras.models.load_model(self.model_path, compile=False)
            
            if os.path.exists(self.labels_path):
                with open(self.labels_path, "r") as f:
                    self.labels = json.load(f)
            
            logger.info(f"🧠 Engine V2 Carregada. Núcleos: {len(self.labels)}")
        except Exception as e:
            logger.critical(f"🧠 Erro fatal carregando Engine V2: {e}")
            self.model = None

    def _load_artifacts(self):
        """
        Carrega modelo e labels, baixando do Cloudinary se não existirem localmente.
        """
        if not os.path.exists(self.model_path):
            logger.info(f"[Engine 2] Modelo não encontrado em {self.model_path}. Tentando baixar...")
            
            remote_model_name = settings.ML_CLOUD_MODEL_NAME 
            success = storage_service.download_file(remote_model_name, self.model_path)
            
            if not success:
                logger.warning(f"[Engine 2] Falha ao baixar modelo. Modo de inferência desativado.")
                return

        if not os.path.exists(self.labels_path):
            logger.info(f"[Engine 2] Labels não encontrados. Baixando...")
            remote_labels_name = settings.ML_CLOUD_LABELS_NAME 
            storage_service.download_file(remote_labels_name, self.labels_path)

        try:
            self.model = tf.keras.models.load_model(self.model_path, compile=False)
            
            if os.path.exists(self.labels_path):
                with open(self.labels_path, "r") as f:
                    self.labels = json.load(f)
            
            logger.info(f"🧠 Engine V2 Carregada. Núcleos: {len(self.labels)}")
        except Exception as e:
            logger.critical(f"🧠 Erro fatal carregando Engine V2: {e}")
            self.model = None

    def predict(self, candidate: CandidateInput, historic: List[SubjectRecord]) -> Dict[str, Any]:
        """
        Executa a inferência síncrona (Bloqueante - deve ser chamada via threadpool).
        """

        if not self.model:
            return {"error": "Modelo V2 não carregado (Cold Start ou Arquivo ausente).", "recommendations": []}

        optimized_map = optimized_history_from_map(historic)

        # 1. Preparação dos Dados
        X_names = np.full((1, MAX_SUBJECTS), "", dtype=object)
        X_meta = np.zeros((1, MAX_SUBJECTS, 2), dtype=float)
        X_sem = np.zeros((1, 1), dtype=float)
        X_course = np.full((1, 1), "", dtype=object)

        # Preenchimento (Lógica similar ao Processor, mas otimizada para o loop local)
        for i, rec in enumerate(optimized_map):
            if i >= MAX_SUBJECTS: break
            name = rec.subject_canonical or rec.name_raw
            X_names[0, i] = name.upper() if name else ""
            
            # Normalizações inline
            g = float(rec.grade) if rec.grade is not None else 0.0
            w = float(rec.workload_hours) if rec.workload_hours else 60.0
            X_meta[0, i, 0] = min(g / 10.0, 1.0)
            X_meta[0, i, 1] = min(w / 100.0, 1.2)

        X_sem[0, 0] = min(float(candidate.semester) / 10.0, 1.0)
        X_course[0, 0] = candidate.course.upper()

        # Conversão para Tensor (Evita overhead de conversão implícita do Keras)
        inputs = [
            tf.constant(X_names, dtype=tf.string),
            tf.convert_to_tensor(X_meta, dtype=tf.float32),
            tf.convert_to_tensor(X_sem, dtype=tf.float32),
            tf.constant(X_course, dtype=tf.string)
        ]

        # 2. Inferência (Verbose=0 para não sujar logs)
        # O modelo retorna um batch de (1, num_labels). Pegamos o índice [0].
        probs = self.model.predict(inputs, verbose=0)[0]

        # 3. Pós-processamento (Decoding)
        result = {}
        unlocked = []
        
        for i, label in enumerate(self.labels):
            # Proteção caso o modelo retorne menos classes que o JSON de labels
            if i >= len(probs): break
            
            score = float(probs[i])
            # Threshold de 0.5 (Sigmoid padrão). Pode ser ajustado via config.
            status = "UNLOCKED" if score >= 0.5 else "LOCKED"
            
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

# Factory Singleton
def get_recommender():
    if NucleusRecommendationEngine._instance is None:
        NucleusRecommendationEngine._instance = NucleusRecommendationEngine(False)
    return NucleusRecommendationEngine._instance