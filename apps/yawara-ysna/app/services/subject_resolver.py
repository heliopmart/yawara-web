# app/services/subject_resolver.py
from app.utils.text import normalize_text_strict


class CanonicalSubjectResolver:
    """
    Camada de entendimento semântico do nome da disciplina.

    V0 (agora): apenas normaliza o texto.
    V1 (depois): usa rede neural / embeddings / catálogo.
    """

    def resolve(self, name_raw: str) -> str:
        # V0: só limpar texto.
        # Futuro: chamar modelo neural aqui.
        return normalize_text_strict(name_raw)
