from typing import List, Dict
from app.core.config  import settings
from app.schemas.historic import SubjectRecord

# Configuração de Negócio
# Nota atribuída para matérias com status "DS" (Dispensa/Transferência).
DEFAULT_DISPENSA_GRADE = settings.ACADEMIC_DEFAULT_DISPENSA_GRADE

def optimize_student_history(history: List[SubjectRecord]) -> Dict[str, float]:
    """
    Transforma a lista rica de histórico em um mapa otimizado para cálculo vetorial.
    
    Lógica de Negócio Atualizada:
    1. Se tem nota numérica, usa a nota.
    2. Se não tem nota, mas o status é 'DS' (Dispensa), usa a DEFAULT_DISPENSA_GRADE.
    3. Registros sem nota e sem status de dispensa são ignorados (ex: Trancamentos).
    4. Resolve duplicatas mantendo a MAIOR nota (Política Otimista).
    
    Args:
        history: Lista de SubjectRecord (padrão do sistema).
        
    Returns:
        Dict[str, float]: { 'nome_materia_lower': nota_final }
    """
    optimized_map: Dict[str, float] = {}
    
    for item in history:
        current_grade = 0.0
        should_process = False

        # Caso 1: Existe nota numérica válida
        if item.grade is not None:
            current_grade = item.grade
            should_process = True
            
        # Caso 2: Não tem nota, mas é Dispensa (DS)
        # Normalizamos o status para evitar erros de caixa alta/baixa ou espaços
        elif item.status and item.status.strip().upper() == "DS":
            current_grade = DEFAULT_DISPENSA_GRADE
            should_process = True

        # Se não caiu em nenhum caso (ex: trancamento, reprovação sem nota), pula
        if not should_process:
            continue
            
        # Normalização da Chave (Nome da Matéria)
        key = item.subject_canonical.lower().strip()

        # Lógica de Duplicatas (Política Otimista)
        if key in optimized_map:
            if current_grade > optimized_map[key]:
                optimized_map[key] = current_grade
        else:
            optimized_map[key] = current_grade
            
    return optimized_map