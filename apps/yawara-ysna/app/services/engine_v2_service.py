import logging
import os
import numpy as np
import tensorflow as tf
from typing import Dict, Any, List
from fastapi.concurrency import run_in_threadpool

# Classe Base
from app.services.base_engine_service import BaseEngineService

# Serviços de Infraestrutura
from app.services.storage import storage_service
from app.core.config import settings
from app.utils.save_engine_predictions import save_classification_result

# Core Neural
from app.ml.engine_v2 import get_recommender, processor

# XAI
from app.ml.xai.neural_explainer import NeuralMathematician

logger = logging.getLogger("yawara.services.engine_v2_service")

class EngineV2Service(BaseEngineService):
    """
    Orquestrador da Estratégia Neural (V2).

    Responsabilidade:
        Gerenciar o ciclo de vida da inferência baseada em Deep Learning (TensorFlow).
        Inclui o download de modelos, predição e geração de explicações complexas (XAI)
        baseadas em gradientes.
    """

    def __init__(self):
        # Limitando as tasks simultâneas pois consome muita RAM/CPU
        super().__init__(max_concurrent_tasks=2)
        self._download_artifacts()
        # O Singleton é carregado aqui. Se falhar, o serviço sobe mas loga erro.
        self.engine_nn = get_recommender()

    def _to_json_safe(self, obj):
        # numpy scalar -> python scalar
        if isinstance(obj, np.generic):
            return obj.item()

        # numpy array -> list
        if isinstance(obj, np.ndarray):
            return obj.tolist()

        # dict -> recurse
        if isinstance(obj, dict):
            return {str(k): self._to_json_safe(v) for k, v in obj.items()}

        # list/tuple -> recurse
        if isinstance(obj, (list, tuple)):
            return [self._to_json_safe(v) for v in obj]

        return obj

    def _download_artifacts(self) -> None:
        """
        Garante que os arquivos .keras e .json (pesos e labels) existam localmente.
        Baixa do Storage (S3/Cloudinary) se necessário.
        """
        model_name_id = settings.ML_CLOUD_MODEL_NAME
        label_name_id = settings.ML_CLOUD_LABELS_NAME
        local_path_engine = settings.ML_ENGINE_2_PATH
        local_path_labels = settings.ML_ENGINE_2_LABELS_PATH

        # Verificação rápida para evitar chamadas de rede desnecessárias
        if os.path.exists(local_path_engine) and os.path.exists(local_path_labels):
            logger.info("✅ Artefatos da Engine V2 encontrados localmente.")
            return
        
        logger.info("⬇️ Baixando artefatos da Engine V2 do Storage...")
        res_model = storage_service.download_file(model_name_id, local_path_engine)
        res_label = storage_service.download_file(label_name_id, local_path_labels)
        
        if res_model and res_label:
            logger.info("✅ Download dos artefatos V2 concluído.")
        else:
            logger.critical("❌ Falha crítica ao baixar artefatos V2. A inferência falhará.")

    async def load_context(self, ps_edition_id: str) -> Dict[str, str]:
        """
        A V2 não carrega regras do banco (os 'pesos' estão no arquivo .keras).
        Retorna metadados de versão.
        """
        return {"model_version": "v2.0-tf-recommender", "edition": ps_edition_id}
    
    async def evaluate_candidate(
        self, 
        user_id: str, 
        candidate_input: Any, 
        history: Any, 
        context: Dict, 
        edition_id: str
    ) -> Dict[str, Any]:
        """
        Executa a inferência Neural + XAI.

        Fluxo Otimizado:
        1. Predição (TensorFlow) -> Threadpool (CPU Bound).
        2. Persistência -> Threadpool (IO Bound).
        3. XAI (Gradientes) -> Threadpool (Heavy CPU Bound).
        """
        try:
            logger.info(f"[V2] Iniciando inferência neural para User {user_id}...")

            # 1. Predição Neural (Pesada)
            # O método .predict() do engine_v2 usa TensorFlow, então bloqueia a thread.
            result = await run_in_threadpool(
                self.engine_nn.predict, 
                candidate_input, 
                history
            )

            if "error" in result:
                raise ValueError(result["error"])

            predictions = result.get("predictions", {})
            recommended = result.get("recommended_nuclei", [])

            # 2. Persistência (Não bloqueante)
            if(not self.is_example):
                await run_in_threadpool(
                    save_classification_result,
                    user_id, 
                    edition_id, 
                    recommended
                )
            
            logger.info(f"[V2] Classificação OK. Recomendados: {len(recommended)}")

            # 3. XAI: Análise de Gradientes (Extremamente Pesada)
            # Calculamos isso apenas se tivermos um modelo carregado.
            xai_reports = []
            
            if self.engine_nn.model:
                # Função auxiliar interna para rodar no threadpool
                def _run_xai_analysis():
                    # A. Recriar Tensores Puros (Input Raw para o GradientTape)
                    tensors_dict = processor.records_to_tensor(candidate_input, history)
                    
                    X_names = tensors_dict["subject_names"]
                    X_meta = tensors_dict["subject_meta"]
                    X_sem = tensors_dict["student_context"]
                    # Hotfix: O processor não retorna course no dict, montamos manual
                    X_course = np.full((1, 1), candidate_input.course.upper(), dtype=object)

                    model_inputs = [
                        tf.constant(X_names, dtype=tf.string),
                        tf.convert_to_tensor(X_meta, dtype=tf.float32),
                        tf.convert_to_tensor(X_sem, dtype=tf.float32),
                        tf.constant(X_course, dtype=tf.string)
                    ]

                    # Decodificação de bytes para string (TF retorna bytes em strings)
                    subject_names_list = [
                        n.decode("utf-8") if isinstance(n, bytes) else str(n) 
                        for n in X_names[0]
                    ]

                    reports = []
                    # B. Full Scan: Gera explicação para TODOS os núcleos (aprovados e reprovados)
                    for idx, label in enumerate(self.engine_nn.labels):
                        explanation = NeuralMathematician.explain_prediction(
                            model=self.engine_nn.model,
                            inputs=model_inputs,
                            target_nucleus_index=idx,
                            target_nucleus_name=label,
                            subject_names_list=subject_names_list
                        )
                        reports.append(explanation.model_dump())
                    return reports

                # Executa o XAI pesado em background
                xai_reports = await run_in_threadpool(_run_xai_analysis)

            logger.info(f"[V2] Ciclo completo finalizado para {user_id}.")

            predictions_safe = self._to_json_safe(predictions)
            xai_reports_safe = self._to_json_safe(xai_reports)
            recommended_safe = self._to_json_safe(recommended)
        
            return {
                "success": True,
                "approved": recommended_safe,
                "xai_reports": xai_reports_safe,
                "predictions_raw": predictions_safe
            }

        except Exception as e:
            logger.error(f"[V2] Erro Crítico User {user_id}: {str(e)}", exc_info=True)
            return {"success": False, "error": str(e)}
        
engine_v2_service = EngineV2Service()

if __name__ == "__main__":
    import asyncio
    # Teste rápido de carga
    asyncio.run(engine_v2_service.run_batch())