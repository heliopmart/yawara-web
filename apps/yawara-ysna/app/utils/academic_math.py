from typing import List, Dict
from app.core.config  import settings
from app.schemas.historic import SubjectRecord
import json

# Configuração de Negócio
# Nota atribuída para matérias com status "DS" (Dispensa/Transferência).
DEFAULT_DISPENSA_GRADE = settings.ACADEMIC_DEFAULT_DISPENSA_GRADE

from typing import List, Dict
from app.core.config  import settings
from app.schemas.historic import SubjectRecord

# Configuração de Negócio
# Nota atribuída para matérias com status "DS" (Dispensa/Transferência).
DEFAULT_DISPENSA_GRADE = settings.ACADEMIC_DEFAULT_DISPENSA_GRADE

# [NOVO] Nota de corte para considerar a disciplina como "Sucesso".
# Se o aluno tirou menos que isso, para fins de competência técnica, é como se não tivesse cursado.
MIN_PASSING_GRADE = 6.0 

def optimize_student_history(history: List[SubjectRecord]) -> Dict[str, float]:
    """
    Transforma a lista rica de histórico em um mapa otimizado para cálculo vetorial.
    
    Lógica de Negócio Atualizada (v2):
    1. Se tem nota numérica >= 6.0, usa a nota. (FILTRO DE APROVAÇÃO)
    2. Se não tem nota, mas o status é 'DS' (Dispensa), usa a DEFAULT_DISPENSA_GRADE.
    3. Reprovações (Nota < 6.0 ou Status RP) são ignoradas sumariamente.
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

        # DEBUG
        # print("--- Processando Item de Histórico ---")
        # print(json.dumps(item.model_dump(), ensure_ascii=False, indent=2))

        # Caso 1: Existe nota numérica E O ALUNO PASSOU
        # Corrigimos o bug onde nota 0.3 contava pontos.
        if item.grade is not None:
            if item.grade >= MIN_PASSING_GRADE:
                current_grade = item.grade
                should_process = True
            else:
                # Se a nota é menor que 6.0, ignoramos.
                # Isso faz com que a matéria não entre no dict, e a Engine assuma 0.0 depois.
                should_process = False 
            
        # Caso 2: Não tem nota, mas é Dispensa (DS)
        elif item.status and item.status.strip().upper() == "DS":
            current_grade = DEFAULT_DISPENSA_GRADE
            should_process = True
            
        # Caso Extra: Se quiser garantir que status 'AP' sem nota entre (ex: TCC as vezes)
        # elif item.status == 'AP' and item.grade is None:
        #     current_grade = MIN_PASSING_GRADE # Assume o mínimo
        #     should_process = True

        # Se não caiu em nenhum caso (Reprovação, Trancamento), pula
        if not should_process:
            continue
            
        # Normalização da Chave (Nome da Matéria)
        key = item.subject_canonical.lower().strip()

        # Lógica de Duplicatas (Política Otimista)
        # Ex: O aluno reprovou (3.0 - ignorado acima) e depois passou (7.0).
        # O 7.0 entra aqui.
        if key in optimized_map:
            if current_grade > optimized_map[key]:
                optimized_map[key] = current_grade
        else:
            optimized_map[key] = current_grade
            
    return optimized_map