import logging
import json
from typing import List, Dict, Optional
from app.utils.db import db_select
from app.schemas.engine_v1 import NucleusRequirementsInput
from app.services.neural_resolver import get_resolver, DynamicNeuralResolver

def _get_ai_resolver() -> Optional['DynamicNeuralResolver']:
    """
        Função Auxiliar. Recupera a instância do resolvedor neural com tratamento de falhas.

        Atua como um wrapper de segurança para o singleton `get_resolver`. Se o modelo
        neural falhar ao carregar (ex: arquivo de pesos ausente ou erro do TensorFlow),
        esta função captura a exceção e retorna `None`, permitindo que o fluxo de
        ingestão continue em modo de fallback (sem inteligência semântica).

        Returns:
            Optional[DynamicNeuralResolver]: A instância do resolvedor se carregada com sucesso,
            ou None em caso de erro crítico.

        Errors: 
            [Y-CSNN] Error: Resolver Neural indisponível (...). Usando fallback.
    """
    try:
        return get_resolver() 
    except Exception as e:
        print(f"[Y-CSNN] Error: Resolver Neural indisponível ({e}). Usando fallback.")
        return None


logger = logging.getLogger("yawara.services.data")

class SelectionDataService:
    """
    Serviço focado EXCLUSIVAMENTE em buscar e estruturar dados do banco.
    Não toma decisões, apenas entrega insumos para o Processador.
    """
    def get_ps_edition_active(self) -> str:
        """
        Retorna o ID da edição de processo seletivo ativa.
        """
        edition = db_select(
            table="ps_editions",
            filters={"is_active": True},
            columns="id",
            single=True
        )
        if not edition:
            logger.error("Nenhuma edição ativa encontrada.")
            raise ValueError("Nenhuma edição ativa encontrada.")
        
        return edition["id"]

    def get_nuclei_configuration(self, ps_edition_id: str) -> List[NucleusRequirementsInput]:
        """
        Busca as regras do jogo: Quais núcleos existem e o que eles pedem.
        """
        configs = db_select("nuclei_configs", filters={"ps_edition_id": ps_edition_id})
        if not configs: return []

        _resolve = _get_ai_resolver()

        requirements = []
        for config in configs:
            # Join manual otimizado
            nucleus = db_select("nuclei", filters={"id": config["nucleus_id"]}, single=True)
            weights = db_select("nuclei_subject_weights", filters={"config_id": config["id"]})

            # Monta o dicionário {materia: peso}
            weights_map = {}
            
            for w in weights:
                # 1. Tenta pegar a coluna oficial do futuro ("canonical_name") 
                # ou a atual ("subject_canonical") se existir.
                canonical_name = w.get("canonical_name") or w.get("subject_canonical")
                
                # 2. Se não existir no banco, chamamos a "Mágica" (IA)
                if not canonical_name:
                    raw_name = w.get("subject_name") # O nome sujo/cru que temos hoje
                    
                    if raw_name and _resolve:
                        # O resolve retorna um DICT, pegamos só a chave 'canonical'
                        res = _resolve.resolve(raw_name)
                        canonical_name = res.get("canonical")
                    else:
                        # Fallback do Fallback: Se não tem IA e não tem coluna, usa o cru mesmo
                        canonical_name = raw_name

                if canonical_name:
                    # Garantimos que é float para a Engine matemática não reclamar
                    weights_map[canonical_name] = float(w["weight"])
            
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
            columns="id, user_id, cards_progress, nuclei_eligible, user: user_id ( course, semester )"
        )

        queue = []
        for row in user_cards:
            if row.get("nuclei_eligible") or (len(row.get("nuclei_eligible")) > 0 if row.get("nuclei_eligible") else False): 
                continue

            cards = row.get("cards_progress", [])
            target_card = next(
                (c for c in cards if c.get("card_id") == 1 and c.get("state") == "COMPLETED"), 
                None
            )
            
            if target_card and target_card.get("file_id"):
                queue.append({
                    "user_id": row["user_id"],
                    "file_id": target_card["file_id"],
                    "data": {
                        "course": row["user"].get("course"),
                        "semester": row["user"].get("semester")
                    }
                })
        
        return queue

    def get_candidate_task_data(self, candidate_id: str) -> List[Dict]:
        """
        Retorna dados adicionais necessários para processar cada candidato.
        Exemplo: Histórico escolar, preferências, etc.
        """
        row = db_select(
            table="ps_user_cards",
            filters={"id": candidate_id },
            columns="user_id, cards_progress, nuclei_eligible, user: user_id ( course, semester, name )",
            single=True
        )

        if row.get("nuclei_eligible") or (len(row.get("nuclei_eligible")) > 0 if row.get("nuclei_eligible") else False): 
            return None

        cards = row.get("cards_progress", [])
        target_card = next(
            (c for c in cards if c.get("card_id") == 1 and c.get("state") == "COMPLETED"), 
            None
        )

        return (
            {
                "user_id": row["user_id"],
                "file_id": target_card["file_id"],
                "data": {
                    "name": row['user'].get('name'),
                    "course": row["user"].get("course"),
                    "semester": row["user"].get("semester")
                }
            }
        )

data_service = SelectionDataService()