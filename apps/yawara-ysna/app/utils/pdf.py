import pdfplumber
from io import BytesIO


def extract_text_from_pdf(pdf_bytes: bytes) -> str:
    """
        Extrai texto de arquivos PDF preservando o layout visual (tabelas/colunas).

        Esta função utiliza a biblioteca `pdfplumber`, que é especializada em extração
        de dados de PDFs complexos (como históricos escolares e boletos). Diferente
        de bibliotecas como `pypdf` que focam no fluxo de conteúdo, o `pdfplumber`
        analisa a geometria da página, garantindo que espaços entre colunas (ex:
        Nome da Matéria vs Nota) sejam respeitados.

        Isso é crucial para que o Regex no estágio de ingestão consiga separar
        os campos corretamente.

        Args:
            pdf_bytes (bytes): O conteúdo binário cru do arquivo PDF (carregado via UploadFile).

        Returns:
            str: Uma única string contendo todo o texto do PDF, com as páginas unidas
            por quebras de linha (`\\n`).

        Example:
            >>> with open("historico.pdf", "rb") as f:
            ...     texto = extract_text_from_pdf(f.read())
            >>> print(texto[:50])
            "UNIVERSIDADE FEDERAL DA GRANDE DOURADOS..."
    """
    pages_text: list[str] = []

    with pdfplumber.open(BytesIO(pdf_bytes)) as pdf:
        for page in pdf.pages:
            text = page.extract_text() or ""
            pages_text.append(text)

    return "\n".join(pages_text)
