import pdfplumber
from io import BytesIO


def extract_text_from_pdf(pdf_bytes: bytes) -> str:
    """
    Extração de texto robusta para PDFs com tabelas (históricos, boletins, etc.)
    Preserva melhor o layout que o pypdf.
    """
    pages_text: list[str] = []

    with pdfplumber.open(BytesIO(pdf_bytes)) as pdf:
        for page in pdf.pages:
            text = page.extract_text() or ""
            pages_text.append(text)

    return "\n".join(pages_text)
