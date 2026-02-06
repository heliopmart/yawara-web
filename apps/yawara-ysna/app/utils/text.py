import unicodedata
from typing import Optional
import re


def normalize_text_strict(text: str) -> str:
    """
    Normalização forte para IA e indexação:
    - Remove acentos
    - Remove caracteres especiais
    - Remove símbolos invisíveis de PDF
    - Converte para UPPERCASE
    - Substitui múltiplos espaços por um só
    - Mantém apenas letras, números e underscore
    """

    text = unicodedata.normalize("NFD", text)
    text = "".join(
        char for char in text
        if unicodedata.category(char) != "Mn"
    )

    text = re.sub(r"[^A-Za-z0-9_ ]+", " ", text)

    text = re.sub(r"\s+", " ", text).strip()

    # text = text.upper().replace(" ", "_")
    text = text.upper()

    return text

def try_parse_float(value: Optional[str]) -> Optional[float]:
    """
        Converte uma string numérica (formato BR ou US) para float de forma segura.

        Realiza a normalização de separadores decimais (troca vírgula por ponto) e
        trata erros de conversão. Útil para processar notas extraídas de PDFs que
        podem conter formatação brasileira (ex: "7,5") ou valores inválidos.

        Args:
            value (Optional[str]): A string contendo o número (ex: "8,50" ou "8.50").

        Returns:
            Optional[float]: O valor numérico convertido, ou None se a entrada for
            nula ou não for um número válido.
    """
    if value is None:
        return None
    value = value.replace(',', '.')
    try:
        return float(value)
    except ValueError:
        return None

