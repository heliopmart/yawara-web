import unicodedata
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

    text = text.upper().replace(" ", "_")

    return text
