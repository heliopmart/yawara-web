import re
from typing import Optional, List
from datetime import datetime

# Ajuste os imports conforme sua estrutura real
from app.services.neural_resolver import get_resolver
from app.schemas.historic import SubjectRecord, AcademicRecord, academic_exclude_status
from app.utils.pdf import extract_text_from_pdf

def _get_ai_resolver():
    try:
        return get_resolver() 
    except Exception as e:
        print(f"[Y-SNA] Aviso: Resolver Neural indisponível ({e}). Usando fallback.")
        return None

# ? <CODIGO> - <NOME_DISCIPLINA> <FALTAS> <CH> <NOTA_OU_STATUS> <STATUS> <TIPO>
DISCIPLINE_LINE_REGEX = re.compile(
    r"""
    ^\s*
    (?P<code>\d{8,11})          # código numérico (8 a 11 dígitos)
    \s*-\s*
    (?P<name>.+?)               # nome da disciplina (lazy)
    \s+
    (?P<absences>\d+)           # faltas
    \s+
    (?P<workload>\d+)           # carga horária

    # --- AQUI ESTÁ O PULO DO GATO ---
    # opcionalmente, pode vir uma nota numérica antes do status
    \s+
    (?:(?P<grade>\d+(?:[.,]\d+)?)\s+)?   # grade opcional: 7.80 ou 7,80

    (?P<status>\S+)              # AP, RP, DS, MA, etc.
    \s+
    (?P<dtype>\S+)               # OBR, OPT, ELT, etc.
    \s*$
    """,
    re.VERBOSE | re.UNICODE,
)
# ? <PERIODO> - formato AAAA.N (ex: 2024.2)
PERIOD_LINE_REGEX = re.compile(r"^\s*(\d{4}\.\d)\s*$")

def _try_parse_float(value: Optional[str]) -> Optional[float]:
    if value is None:
        return None
    value = value.replace(',', '.')
    try:
        return float(value)
    except ValueError:
        return None

def parse_subject_line(line: str, period: str) -> Optional[SubjectRecord]:
    """
    Converte uma linha bruta do histórico em SubjectRecord.
    Retorna None se a linha NÃO for uma disciplina válida.
    """
    m = DISCIPLINE_LINE_REGEX.match(line)
    if not m:
        return None

    code = m.group("code").strip()
    name_raw = m.group("name").strip()
    absences = int(m.group("absences"))
    workload = int(m.group("workload"))

    grade_raw = m.group("grade")
    grade = _try_parse_float(grade_raw)

    status = m.group("status").strip()  
    dtype = m.group("dtype").strip()

    # --- INTEGRAÇÃO NEURAL V2 ---
    # Aqui a mágica acontece. O resolver agora é o "porteiro" semântico.
    _resolver = _get_ai_resolver()
    
    # Valor padrão caso a rede esteja offline
    subject_canonical_name = "AI_UNAVAILABLE"
    
    if _resolver:
        try:
            # O resolve retorna um dict: {'canonical': '...', 'confidence': ...}
            # Nós só precisamos do nome canônico para o SubjectRecord por enquanto.
            resolution_result = _resolver.resolve(name_raw)
            subject_canonical_name = resolution_result.get("canonical", "UNKNOWN_ERROR")
            confidence = resolution_result.get("confidence", 0.0)
            
            # TODO: Se o SubjectRecord tiver campo para 'metadata' ou 'confidence',
            # seria ótimo salvar resolution_result['confidence'] lá para auditoria.
            
        except Exception as e:
            print(f"[Y-SNA] Erro na resolução de '{name_raw}': {e}")
            subject_canonical_name = "ERROR_RESOLVING"
            
    # -------------------------

    return SubjectRecord(
        period=period,
        code=code,
        name_raw=name_raw,
        subject_canonical=subject_canonical_name, # Agora passamos a string limpa
        grade=grade,
        status=status,
        workload_hours=workload,
        absences=absences,
        type=dtype,
        confidence=confidence if _resolver else None,
    )

def parse_academic_history(
    text: str,
    candidate_id: str,
    cycle_id: str,
    source: str = "UFGD_HISTORICO_OFICIAL",
) -> AcademicRecord:
    current_period = "UNKNOWN"
    subjects: List[SubjectRecord] = []

    for raw_line in text.splitlines():
        line = raw_line.strip()
        if not line:
            continue 

        m_period = PERIOD_LINE_REGEX.match(line)
        if m_period:
            current_period = m_period.group(1)
            continue

        subj = parse_subject_line(raw_line, current_period)
        if subj is not None:
            if subj.status in academic_exclude_status:
                continue
            subjects.append(subj)
            continue

    return AcademicRecord(
        candidate_id=candidate_id,
        cycle_id=cycle_id,
        generated_at=datetime.utcnow(),
        source=source,
        subjects=subjects,
    )

def ingest_academic_record_from_pdf(
    pdf_bytes: bytes,
    candidate_id: str,
    cycle_id: str,
    source: str = "UFGD_HISTORICO_OFICIAL",
) -> AcademicRecord:
    text = extract_text_from_pdf(pdf_bytes)
    return parse_academic_history(
        text=text,
        candidate_id=candidate_id,
        cycle_id=cycle_id,
        source=source,
    )