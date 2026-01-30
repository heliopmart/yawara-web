import re
from typing import Optional, List
from datetime import datetime
import asyncio

# HANDLES IMPORT ----------------------------------------------
from app.utils.text import try_parse_float
from app.utils.text import normalize_text_strict

# SERVICE IMPORT ----------------------------------------------
from app.services.neural_resolver import get_resolver, DynamicNeuralResolver
from app.schemas.historic import SubjectRecord, AcademicRecord, academic_exclude_status
from app.utils.pdf import extract_text_from_pdf

# AUXILIARY FUNCTIONS ---------------------------------------------

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

# REGEX TYPING ----------------------------------------------------

# Regex compilada para extração de dados de linhas de disciplina.
# Utiliza flag re.VERBOSE para permitir comentários inline e quebras de linha.
#
# Formato esperado da linha no PDF (UFGD):
# "CODIGO - NOME DA MATERIA   FALTAS   CH   [NOTA]   STATUS   TIPO"
#
# Exemplo com nota:
# "12345678 - CALCULO 1       0        68   7,5      AP       OBR"
#
# Exemplo sem nota (aprovado sem nota ou matriculado):
# "12345678 - ESTAGIO SUP     0        100           MT       OBR"
# 
# Observação: ?P<code> são grupos nomeados para fácil acesso.

DISCIPLINE_LINE_REGEX = re.compile(
    r"""
    ^\s*                        # Início da linha (ignora espaços iniciais) 
    (?P<code>\d{8,11})          # Grupo 1: Código da disciplina (8 a 11 dígitos)
    \s*-\s*                     # Separador (hífen com espaços opcionais)
    (?P<name>.+?)               # Grupo 2: Nome da disciplina (match preguiçoso/lazy)
    \s+                         # Espaço obrigatório antes das métricas
    (?P<absences>\d+)           # Grupo 3: Número de faltas (inteiro)
    \s+
    (?P<workload>\d+)           # Grupo 4: Carga horária (inteiro)

    # Bloco da Nota (Opcional)
    # Explicação: Tenta casar um número decimal (7.5 ou 7,5).
    # Se não existir nota (ex: disciplina em curso 'MT' ou 'MA'), este grupo retorna None.
    \s+
    (?:(?P<grade>\d+(?:[.,]\d+)?)\s+)?   

    (?P<status>\S+)             # Grupo 6: Status (AP, RP, MA, MT, etc.)
    \s+
    (?P<dtype>\S+)              # Grupo 7: Tipo (OBR, OPT, ELT)
    \s*$                        # Fim da linha
    """,
    re.VERBOSE | re.UNICODE,
)

# Regex para identificar cabeçalhos de período letivo.
# Captura o formato "AAAA.S" (Ano.Semestre).
# Exemplo: "2024.1" ou "2023.2"

PERIOD_LINE_REGEX = re.compile(
    r"""
    ^\s*            # Início da linha
    (\d{4}\.\d)     # Grupo 1: Ano (4 dígitos) + Ponto + Semestre (1 dígito)
    \s*$            # Fim da linha (garante que a linha só tem isso)
    """,
    re.VERBOSE
)

async def parse_subject_line(line: str, period: str) -> Optional[SubjectRecord]:
    """
        Processa uma linha de texto crua e a converte em um registro de disciplina estruturado.

        Esta função atua como a ponte entre o OCR (texto bruto) e o modelo de dados.
        Ela utiliza expressões regulares para extrair campos e, crucialmente, integra-se
        ao **Resolvedor Neural (Y-CSNN)** para normalizar semanticamente o nome da disciplina.

        Se a linha não corresponder ao padrão de uma disciplina (ex: cabeçalho, rodapé, lixo),
        retorna `None`.

        Args:
            line (str): A linha de texto extraída do PDF.
            period (str): O período letivo atual (contexto) ex: "2023.1".

        Returns:
            Optional[SubjectRecord]: O objeto da disciplina preenchido e normalizado,
            ou None se a linha for inválida.

        Flow:
            1. Match Regex -> Extrai dados brutos.
            2. Type Conversion -> Str para Int/Float.
            3. **Neural Resolution** -> Consulta IA para obter `subject_canonical`.
            4. Object Creation -> Retorna SubjectRecord.
    """

    # Extraction using regex
    m = DISCIPLINE_LINE_REGEX.match(line)
    
    # invalid line (does not match expected format)
    if not m:
        return None

    # Extracted Fields ( group(<code>) on regex )
    code = m.group("code").strip()
    name_raw = m.group("name").strip()
    absences = int(m.group("absences"))
    workload = int(m.group("workload"))
    grade_raw = m.group("grade")
    
    # safe note convert 
    grade = try_parse_float(grade_raw)

    status = m.group("status").strip()  
    dtype = m.group("dtype").strip()

    # --- NEURAL INTEGRATION V2 ---
    
    # Call the neural network switch (if available)
    _resolver = _get_ai_resolver()
    
    # Default value if the network is offline
    subject_canonical_name = "AI_UNAVAILABLE"

    # Default value to avoid errors
    confidence = None
    
    if _resolver:
        try:
            search_term = normalize_text_strict(name_raw)

            # Call the neural resolver to get the canonical name. Return { "canonical", "confidence", ... }
            resolution_result = await _resolver.resolve(search_term)

            # Extract fields from the result
            subject_canonical_name = resolution_result.get("canonical", "UNKNOWN_ERROR")
            confidence = resolution_result.get("confidence", 0.0)       

        except Exception as e:
            print(f"[Y-CSNN] Error resolving '{name_raw}': {e}")
            subject_canonical_name = "ERROR_RESOLVING"
            
    # Return the structured object
    return SubjectRecord(
        period=period,
        code=code,
        name_raw=name_raw,
        subject_canonical=subject_canonical_name,
        grade=grade,
        status=status,
        workload_hours=workload,
        absences=absences,
        type=dtype,
        confidence=confidence if _resolver else None,
    )

async def parse_academic_history( text: str, candidate_id: str, cycle_id: Optional[str], source: str = "UFGD_HISTORICO_OFICIAL" ) -> AcademicRecord:
    """
        Orquestra o parsing completo do texto de um histórico escolar.

        Esta função itera sobre todas as linhas do texto extraído, gerenciando o estado
        do contexto temporal (período letivo atual) e agregando as disciplinas válidas.

        Lógica de Processamento:
        1. Detecta cabeçalhos de período (ex: "2023.1") e atualiza o contexto `current_period`.
        2. Delega cada linha para `parse_subject_line` tentar extrair uma disciplina.
        3. Filtra disciplinas com status irrelevantes (definidos em `academic_exclude_status`,
        ex: Trancamento, Dispensa sem nota).
        4. Compila tudo em um objeto `AcademicRecord`.

        Args:
            text (str): O texto bruto completo extraído do PDF.
            candidate_id (str): ID do candidato no sistema.
            cycle_id (str): ID do ciclo do processo seletivo.
            source (str, optional): Origem do documento. Defaults to "UFGD_HISTORICO_OFICIAL".

        Returns:
            AcademicRecord: O registro acadêmico estruturado contendo a lista de disciplinas.
    """    
    
    current_period = "UNKNOWN"
    subjects: List[SubjectRecord] = []

    # Iterate over each line of the text
    for raw_line in text.splitlines():
        line = raw_line.strip()
        if not line:
            continue 

        # Check if the line is a period header
        m_period = PERIOD_LINE_REGEX.match(line)
        if m_period:
            # Extract the current period
            current_period = m_period.group(1)
            continue

        # Try to parse the line as a subject
        subj = await parse_subject_line(raw_line, current_period)
        
        # Filter subjects with irrelevant status
        if subj is not None:
            # Ignore subjects with exclusion status
            if subj.status in academic_exclude_status:
                continue
            # Add the valid subject to the list
            subjects.append(subj)
            continue

    # Return the complete academic record
    return AcademicRecord(
        candidate_id=candidate_id,
        cycle_id=cycle_id,
        generated_at=datetime.utcnow(),
        source=source,
        subjects=subjects,
    )

async def ingest_academic_record_from_pdf( pdf_bytes: bytes, candidate_id: str, cycle_id: Optional[str], source: str = "UFGD_HISTORICO_OFICIAL" ) -> AcademicRecord:
    """
        Ponto de entrada principal para a ingestão de históricos escolares em PDF.

        Esta função atua como uma fachada (Facade) que converte o arquivo binário em
        um objeto de domínio utilizável. Ela abstrai a complexidade da extração de texto
        (OCR/PyPDF) e delega o processamento lógico para o parser.

        Args:
            pdf_bytes (bytes): O conteúdo binário do arquivo PDF enviado pelo usuário.
            candidate_id (str): ID único do candidato proprietário do documento.
            cycle_id (Optional[str]): ID do ciclo seletivo ao qual o documento se aplica.
            source (str, optional): Identificador da fonte do documento. Defaults to "UFGD_HISTORICO_OFICIAL".

        Returns:
            AcademicRecord: O registro acadêmico completo, normalizado e validado, pronto para persistência.
    """

    # Extract text from the PDF
    text = await asyncio.to_thread(extract_text_from_pdf, pdf_bytes)
    
    # Delegate to the main parser
    return await parse_academic_history(
        text=text,
        candidate_id=candidate_id,
        cycle_id=cycle_id or None,
        source=source,
    )