from typing import List, Dict, Any, Optional, Tuple

from app.utils.db import db_rpc, db_select
from app.core.config import settings

def _normalize_labels_from_select(res_nuclei) -> List[str]:
    if not res_nuclei:
        return []
    if isinstance(res_nuclei, list) and len(res_nuclei) > 0 and isinstance(res_nuclei[0], dict):
        return [str(x.get("name", "")).upper().strip() for x in res_nuclei if x.get("name")]
    return [str(x).upper().strip() for x in res_nuclei]

def fetch_nuclei_labels() -> List[str]:
    """
    Busca labels oficiais dos núcleos.
    """
    res_nuclei = db_select("nuclei", "name", None, False)
    return _normalize_labels_from_select(res_nuclei)

def fetch_training_dataset_chunk(
    after_pm_id: int,
    limit: int,
    courses: Optional[List[str]] = None,
) -> Dict[str, Any]:
    """
    Busca um chunk incremental via RPC.

    Requer uma RPC nova no Supabase:
      get_training_dataset_v2_chunk(p_after_pm_id bigint, p_limit int, p_courses text[])

    Retorno esperado (ideal):
      [
        {
          "pm_id": 123,
          "course": "...",
          "semester_at_entry": 1,
          "academic_history": [...],
          "outcomes": [...]
        },
        ...
      ]

    Esta função retorna um dict padronizado:
      {
        "rows": [...],
        "next_after_pm_id": <int>,
        "has_more": <bool>
      }
    """
    payload = {
        "p_after_pm_id": int(after_pm_id),
        "p_limit": int(limit),
        "p_courses": courses,  # pode ser None
    }

    res = db_rpc("get_training_dataset_v2_chunk", payload)

    if not res:
        return {"rows": [], "next_after_pm_id": after_pm_id, "has_more": False}

    if not isinstance(res, list):
        return {"rows": [], "next_after_pm_id": after_pm_id, "has_more": False}

    next_after = after_pm_id
    
    for r in res:
        if isinstance(r, dict):
            pm_id = r.get("pm_id")
            if isinstance(pm_id, int) and pm_id > next_after:
                next_after = pm_id

    has_more = len(res) == int(limit)

    # !=============================== PRINT ==================================
    print("[DBG][CURSOR] after_pm_id=", after_pm_id, "-> next_after=", next_after)
    print("[DBG][CURSOR] has_more=", has_more, "(regra atual)")
    # !=============================== PRINT ==================================

    return {"rows": res, "next_after_pm_id": next_after, "has_more": has_more}

def fetch_training_dataset(
    after_pm_id: Optional[int] = None,
    limit: Optional[int] = None,
    courses: Optional[List[str]] = None,
    chunks_per_call: int = 1,
) -> Tuple[List[Dict[str, Any]], List[str], Dict[str, Any]]:
    """
    Wrapper compatível e pronto pra Parte 3.

    Retorna:
      raw_data: List[dict]      -> dataset (1 ou N chunks concatenados)
      nuclei_labels: List[str]  -> labels
      meta: dict               -> metadados úteis (cursor, has_more, etc.)

    Parâmetros:
      after_pm_id: cursor inicial (default 0)
      limit: tamanho do chunk (default settings.ML_DB_CHUNK_SIZE)
      courses: filtro opcional
      chunks_per_call: quantos chunks concatenar em uma chamada (cuidado com RAM!)
    """
    if after_pm_id is None:
        after_pm_id = 0
    if limit is None:
        # se você ainda não tem no settings, crie:
        # ML_DB_CHUNK_SIZE: int = 256
        limit = getattr(settings, "ML_DB_CHUNK_SIZE", 256)

    nuclei_labels = fetch_nuclei_labels()

    all_rows: List[Dict[str, Any]] = []
    cursor = int(after_pm_id)
    has_more = True

    # busca 1..N chunks (por padrão 1, para não explodir RAM)
    for _ in range(max(int(chunks_per_call), 1)):
        chunk = fetch_training_dataset_chunk(after_pm_id=cursor, limit=limit, courses=courses)
        rows = chunk["rows"]
        all_rows.extend(rows)

        cursor = int(chunk["next_after_pm_id"])
        has_more = bool(chunk["has_more"])

        if not has_more or len(rows) == 0:
            break

    meta = {
        "after_pm_id": int(after_pm_id),
        "next_after_pm_id": int(cursor),
        "has_more": bool(has_more),
        "limit": int(limit),
        "chunks_per_call": int(chunks_per_call),
        "returned_rows": int(len(all_rows)),
        "courses": courses,
    }

    return all_rows, nuclei_labels, meta

def save_classification_result(user_id: str, predictions: Dict[str, float]) -> None:
    """
    Salva o resultado da classificação no banco de dados.
    """
    payload = {
        "user_id": user_id,
        "predictions": predictions
    }
    print("Salvando classificação para user_id=", user_id)
    pass
    # db_rpc("save_classification_result", payload)