import logging
from typing import List, Dict, Tuple
from app.utils.db import db_select
from app.schemas.engine_v1 import NucleusRequirementsInput

logger = logging.getLogger("yawara.services.data")

class SelectionDataService:
    """
    Serviço focado EXCLUSIVAMENTE em buscar e estruturar dados do banco.
    Não toma decisões, apenas entrega insumos para o Processador.
    """

    def get_nuclei_configuration(self, ps_edition_id: str) -> List[NucleusRequirementsInput]:
        """
        Busca as regras do jogo: Quais núcleos existem e o que eles pedem.
        """
        configs = db_select("nuclei_configs", filters={"ps_edition_id": ps_edition_id})
        if not configs: return []

        requirements = []
        for config in configs:
            # Join manual otimizado
            nucleus = db_select("nuclei", filters={"id": config["nucleus_id"]}, single=True)
            weights = db_select("nuclei_subject_weights", filters={"nucleus_config_id": config["id"]})
            
            # Monta o dicionário {materia: peso}
            weights_map = {w["subject_canonical"]: float(w["weight"]) for w in weights}

            requirements.append(NucleusRequirementsInput(
                nucleus_id=config["nucleus_id"],
                nucleus_name=nucleus["name"],
                baseline_score=float(config["learned_baseline_score"]),
                weights=weights_map
            ))
        return requirements

    def get_pending_candidates_queue(self, ps_edition_id: str) -> List[Dict[str, str]]:
        """
        Gera a 'Work Queue': Lista leve contendo apenas IDs para iteração.
        Retorna: [{user_id: "...", file_id: "..."}, ...]
        """
        # Busca cards de usuários dessa edição
        user_cards = db_select(
            table="ps_user_cards",
            filters={"edition_id": ps_edition_id},
            columns="id, user_id, cards_progress"
        )

        queue = []
        for row in user_cards:
            cards = row.get("cards_progress", [])
            # Lógica para achar o PDF do histórico (Card ID 1 + COMPLETED)
            target_card = next(
                (c for c in cards if c.get("card_id") == 1 and c.get("state") == "COMPLETED"), 
                None
            )
            
            if target_card and target_card.get("file_id"):
                queue.append({
                    "user_id": row["user_id"],
                    "file_id": target_card["file_id"]
                })
        
        return queue

data_service = SelectionDataService()