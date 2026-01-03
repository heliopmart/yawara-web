from typing import Dict
from app.utils.db import db_update

def save_classification_result(user_id: str, edition_id: str, predictions: Dict[str, float]) -> None:
    """
    Salva o resultado da classificação no banco de dados.
    """
    try:
        db_update(
        table="ps_user_cards",
        data={
            "nuclei_eligible": predictions,
            "updated_at": "now()" ,
            "is_eligible": (True if len(predictions) > 0 else False)
        },
        filters={"user_id": user_id, "edition_id": edition_id}
    )
    except Exception as e:
        print(f"🚨 Erro ao salvar resultado de classificação para User {user_id}: {e}")