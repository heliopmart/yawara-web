"""
Módulo de Logging para Machine Learning (ML Logger).

Responsável por capturar 'snapshots' das decisões tomadas pela Engine v1
e persistí-las de forma estruturada para o treinamento futuro da Engine v2.
"""

import logging
import json
from typing import List

from app.utils.db import db_insert
from app.schemas.historic import SubjectRecord
from app.schemas.engine_v1 import NucleusEligibilityResult, NucleusRequirementsInput
from app.utils.academic_math import optimize_student_history

logger = logging.getLogger("yawara.utils.ml_logger")

class MLTrainingLogger:
    """
    Coletor de dados para o Dataset de Treinamento da IA.
    """

    def log_decision_batch(
        self,
        candidate_id: str,
        ps_edition_id: str,
        history: List[SubjectRecord],
        results: List[NucleusEligibilityResult],
        nuclei_configs: List[NucleusRequirementsInput]
    ):
        """
        Registra um lote de decisões (uma para cada núcleo) no banco de dados.
        
        Args:
            candidate_id: ID do usuário avaliado.
            ps_edition_id: ID da edição do processo seletivo.
            history: O histórico bruto do candidato.
            results: A lista de vereditos gerados pela Engine.
            nuclei_configs: As regras que foram usadas (para snapshot de contexto).
        """
        try:
            # 1. Prepara o vetor de entrada (Input Features)

            # Usamos o mapa otimizado (ex: {"calculo_1": 7.5})
            input_vector = optimize_student_history(history)
            
            rows_to_insert = []

            # 2. Mapeia configurações para acesso rápido por ID
            config_map = {n.nucleus_id: n for n in nuclei_configs}

            # 3. Itera sobre os resultados para criar uma linha por núcleo
            for res in results:
                nucleus_rule = config_map.get(res.nucleus_id)
                
                # Snapshot da Regra (Contexto)
                # Salva os pesos e o baseline usados NAQUELE MOMENTO.
                rule_snapshot = {
                    "weights": nucleus_rule.weights if nucleus_rule else {},
                    "baseline_applied": res.baseline_score
                }

                row = {
                    "candidate_id": candidate_id,
                    "ps_edition_id": ps_edition_id,
                    "nucleus_id": res.nucleus_id,
                    "input_features": input_vector, # JSONB: As notas do aluno
                    "rule_snapshot": rule_snapshot, # JSONB: A régua usada
                    "raw_score": res.total_score,   # Output Regressão
                    "is_eligible": res.is_eligible, # Output Classificação
                    "human_override": False         # Padrão inicial
                }
                rows_to_insert.append(row)

            # 4. Bulk Insert (Inserção em Lote) para eficiência
            if rows_to_insert:
                db_insert("ps_ml_training_data", rows_to_insert)
                logger.info(f"ML Logger: {len(rows_to_insert)} snapshots salvos para User {candidate_id}")

        except Exception as e:
            # O Logger nunca deve derrubar a aplicação principal.
            logger.error(f"Falha ao salvar dados de treino ML: {str(e)}")

# Singleton
ml_logger = MLTrainingLogger()