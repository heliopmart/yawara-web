from typing import List, Dict
from app.core.config import settings
from app.schemas.historic import SubjectRecord

# Configuração de Negócio
# Nota atribuída para matérias com status "DS" (Dispensa/Transferência) ou "AP" sem nota.
DEFAULT_DISPENSA_GRADE = settings.ACADEMIC_DEFAULT_DISPENSA_GRADE or 7.0

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
        if not item.subject_canonical:
             # Fallback simples se o resolver falhou
             key = item.name_raw.upper().strip().replace(" ", "_")
        else:
             key = item.subject_canonical.lower().strip() # Chave sempre minúscula para comparação

        current_grade = 0.0
        should_process = False
        
        # --- Lógica de Decisão ---

        # Caso 1: Tem nota numérica válida
        if item.grade is not None:
            if item.grade >= MIN_PASSING_GRADE:
                current_grade = float(item.grade)
                should_process = True
            else:
                # Nota vermelha: Ignora (não conta como competência adquirida)
                should_process = False 
            
        # Caso 2: Sem nota, mas é Dispensa (DS) ou Aproveitamento (AP)
        elif item.status:
            status_clean = item.status.strip().upper()
            if status_clean in ["DS", "DISPENSA", "AP", "APROVADO", "AM"]:
                current_grade = float(DEFAULT_DISPENSA_GRADE)
                should_process = True
        
        # Se não é elegível, pula
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