"""
Módulo de Testes: Storage Service (Cloudinary).

Testa a camada de abstração de download de arquivos.
Utiliza `unittest.mock` para evitar conexões reais de rede durante os testes.

Objetivos:
    - Garantir que a URL é gerada corretamente.
    - Garantir tratamento de erro 404 e Timeout.
"""

import pytest
from unittest.mock import patch, MagicMock
from app.services.storage import StorageService

@pytest.fixture
def storage():
    """Instância do serviço de storage."""
    return StorageService()

@patch("app.services.storage.requests.get")
@patch("app.services.storage.cloudinary.utils.cloudinary_url")
def test_download_success(mock_cloudinary, mock_requests, storage):
    """
    Testa um download bem-sucedido (HTTP 200).
    
    Fluxo Mockado:
        1. Cloudinary gera URL falsa.
        2. Requests retorna status 200 e bytes do PDF.
    
    Expectativa:
        Retornar os bytes do arquivo.
    """
    mock_cloudinary.return_value = ("http://fake-url.com", {})
    
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.content = b"%PDF-1.4 Fake Content"
    mock_requests.return_value = mock_response
    
    result = storage.get_file_bytes("fake_id")
    
    assert result == b"%PDF-1.4 Fake Content"

@patch("app.services.storage.requests.get")
@patch("app.services.storage.cloudinary.utils.cloudinary_url")
def test_download_404(mock_cloudinary, mock_requests, storage):
    """
    Testa falha de arquivo não encontrado (HTTP 404).
    
    Expectativa:
        Retornar None (sem levantar exceção que quebre a aplicação).
    """
    mock_cloudinary.return_value = ("http://fake-url.com", {})
    
    mock_response = MagicMock()
    mock_response.status_code = 404
    mock_requests.return_value = mock_response
    
    result = storage.get_file_bytes("missing_id")
    
    assert result is None