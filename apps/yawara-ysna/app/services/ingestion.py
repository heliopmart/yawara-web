import re
from typing import Optional, List
from datetime import datetime

from app.services.subject_resolver import CanonicalSubjectResolver
from app.schemas.historic import SubjectRecord, AcademicRecord, academic_exclude_status
from app.utils.pdf import extract_text_from_pdf

_resolver = CanonicalSubjectResolver()

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

# =============================================
# ============== INTERN HANDLE ================
# =============================================


def _try_parse_float(value: Optional[str]) -> Optional[float]:
    if value is None:
        return None
    value = value.replace(',', '.')
    try:
        return float(value)
    except ValueError:
        return None


# =============================================
# ================= HANDLE ====================
# =============================================


def parse_subject_line(line: str, period: str) -> Optional[SubjectRecord]:
    """
    Converte uma linha bruta do histórico em SubjectRecord.
    Retorna None se a linha NÃO for uma disciplina válida.
    """
    m = DISCIPLINE_LINE_REGEX.match(line)
    if not m:
        # linha não bate com o padrão de disciplina
        return None

    code = m.group("code").strip()
    name_raw = m.group("name").strip()
    absences = int(m.group("absences"))
    workload = int(m.group("workload"))

    grade_raw = m.group("grade")      # pode ser '7.80' ou None
    grade = _try_parse_float(grade_raw)

    status = m.group("status").strip()  
    dtype = m.group("dtype").strip()

    # subject_canonical provisório, depois entra a sub-rede aqui
    subject_canonical = _resolver.resolve(name_raw)

    return SubjectRecord(
        period=period,
        code=code,
        name_raw=name_raw,
        subject_canonical=subject_canonical,
        grade=grade,
        status=status,
        workload_hours=workload,
        absences=absences,
        type=dtype,
    )

def parse_academic_history(
    text: str,
    candidate_id: str,
    cycle_id: str,
    source: str = "UFGD_HISTORICO_OFICIAL",
) -> AcademicRecord:
    """
    Percorre TODO o texto do histórico,
    detecta períodos e monta um AcademicRecord completo.
    """
    current_period = "UNKNOWN"
    subjects: List[SubjectRecord] = []

    for raw_line in text.splitlines():
        line = raw_line.strip()
        if not line:
            continue  # ignora linhas vazias

        # 1) Detectar mudança de período
        m_period = PERIOD_LINE_REGEX.match(line)
        if m_period:
            current_period = m_period.group(1)
            continue

        # 2) Tentar parsear como disciplina
        subj = parse_subject_line(raw_line, current_period)
        if subj is not None:
            # regra explícita: ignorar disciplinas em andamento (MA, MT, etc.)
            if subj.status in academic_exclude_status:
                continue

            subjects.append(subj)
            continue

        # 3) Caso contrário, é lixo para o parser (cabeçalho, rodapé etc.) → ignora

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
    """
    Pipeline completo de ingestão:
    PDF bruto -> texto -> AcademicRecord estruturado.
    """
    text = extract_text_from_pdf(pdf_bytes)
    record = parse_academic_history(
        text=text,
        candidate_id=candidate_id,
        cycle_id=cycle_id,
        source=source,
    )
    return record