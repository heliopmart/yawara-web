from typing import List, Dict
from app.core.config import settings
from app.schemas.historic import SubjectRecord

# Configuração de Negócio
# Nota atribuída para matérias com status "DS" (Dispensa/Transferência) ou "AP" sem nota.
DEFAULT_DISPENSA_GRADE = settings.ACADEMIC_DEFAULT_DISPENSA_GRADE or 7.0
VALID_DISPENSA_STATUSES = ["DS", "DISPENSA", "AP", "APROVADO", "AM", "DISP"]

# Nota de corte para considerar a disciplina como "Sucesso" para fins de cálculo de competência.
MIN_PASSING_GRADE = 6.0 

def optimize_student_history(history: List[SubjectRecord]) -> Dict[str, float]:
    """
    Transforma a lista bruta de histórico em um mapa otimizado {disciplina_canon: nota}.
    
    Regras de Negócio (v2):
    1. Se tem nota numérica >= 6.0, usa a nota (Maior nota prevalece em caso de duplicata).
    2. Se status é 'DS' (Dispensa) ou 'AP' (Aprovado sem nota), usa DEFAULT_DISPENSA_GRADE.
    3. Reprovações (< 6.0 ou status RP/RE) são ignoradas nesta etapa (não geram competência).
    
    Args:
        history (List[SubjectRecord]): Lista de registros brutos do PDF.
        
    Returns:
        Dict[str, float]: Mapa normalizado (ex: {'CALCULO_1': 8.5}).
    """
    optimized_map: Dict[str, float] = {}

    for item in history:
        # Se não tiver nome canônico resolvido, usamos o raw sanitizado
        canonical = item.subject_canonical
       
        if not canonical:
             # Fallback simples se o resolver falhou
             #?  key = item.name_raw.upper().strip().replace(" ", "_")
             key = item.name_raw.lower().strip().replace(" ", "_")
        else:
             key = canonical.lower().strip()

        current_grade = 0.0
        should_process = False
        
        # --- Lógica de Decisão ---

        status_clean = item.status.strip().upper()

        if item.grade is not None and item.grade >= MIN_PASSING_GRADE:
             current_grade = float(item.grade)
             should_process = True

        elif status_clean in VALID_DISPENSA_STATUSES:
            if status_clean == "DS":
                current_grade = float(DEFAULT_DISPENSA_GRADE)
                should_process = True

        if not should_process:
            continue

        # --- Lógica de Otimização (Maior Nota Vence) ---
        # Se o aluno fez a matéria 2 vezes (passou com 6.0 e depois melhorou para 8.0),
        # ficamos com o 8.0.
        if key in optimized_map:
            if current_grade > optimized_map[key]:
                optimized_map[key] = current_grade
        else:
            optimized_map[key] = current_grade

    return optimized_map


def _opt_key_like_academic_math(rec: SubjectRecord) -> str:
    """
    Replica a MESMA chave usada por optimize_student_history (lowercase + underscore no fallback).
    Isso é crucial: se a chave divergir, você não consegue casar com optimized_map.
    """
    canonical = rec.subject_canonical
    if not canonical:
        return rec.name_raw.lower().strip().replace(" ", "_")
    return canonical.lower().strip()


def _effective_grade_like_academic_math(rec: SubjectRecord) -> float | None:
    """
    Replica a regra de elegibilidade do optimize_student_history:
    - DS/AP/... => DEFAULT_DISPENSA_GRADE
    - nota numérica >= MIN_PASSING_GRADE => nota
    - caso contrário => None (ignora)
    """
    status_clean = (rec.status or "").strip().upper()

    if rec.grade is not None:
        try:
            g = float(rec.grade)
            if g >= float(MIN_PASSING_GRADE):
                return g
        except (TypeError, ValueError):
            pass

    if status_clean in VALID_DISPENSA_STATUSES:
        if(status_clean == "DS"):
            return float(DEFAULT_DISPENSA_GRADE)
        else:
            pass

    return None


def optimized_history_from_map(historic: List[SubjectRecord]) -> List[SubjectRecord]:
    """
    Converte o Dict[str, float] do optimize_student_history em uma List[SubjectRecord]
    pronta para ser consumida pelo seu loop.

    Estratégia:
    - optimized_map diz quais chaves entram e com qual nota final (max).
    - varremos o historic bruto e escolhemos 1 record por chave cujo effective_grade == optimized_map[key].
    - garantimos que record.grade fique com a nota efetiva e subject_canonical fique consistente.
    """
    optimized_map = optimize_student_history(historic) 

    picked: Dict[str, SubjectRecord] = {}

    for rec in historic:
        key = _opt_key_like_academic_math(rec)

        if key not in optimized_map:
            continue

        eff = _effective_grade_like_academic_math(rec)

        if eff is None:
            continue

        if abs(eff - float(optimized_map[key])) > 1e-9:
            continue

        if key not in picked:
            rec.subject_canonical = key       
            rec.grade = float(optimized_map[key])  
            picked[key] = rec

    return list(picked.values())