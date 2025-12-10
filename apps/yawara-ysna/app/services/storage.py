import logging
import requests
import cloudinary
import cloudinary.utils
from typing import Optional
from app.core.config import settings

# Configuração de Log
logger = logging.getLogger("yawara.services.storage")

class StorageService:
    """
    Serviço responsável pela comunicação com o Cloudinary.
    Foca apenas em baixar o arquivo para a memória (bytes),
    sem salvar em disco para manter o container 'stateless'.
    """

    def __init__(self):
        try:
            cloudinary.config(
                cloud_name=settings.CLOUDINARY_CLOUD_NAME,
                api_key=settings.CLOUDINARY_API_KEY,
                api_secret=settings.CLOUDINARY_API_SECRET,
                secure=True
            )
        except Exception as e:
            logger.critical(f"Falha ao configurar Cloudinary: {e}")

    def get_file_bytes(self, public_id: str) -> Optional[bytes]:
        """
        Gera a URL segura e baixa o conteúdo do arquivo.

        Args:
            public_id (str): O ID do arquivo no Cloudinary (ex: "yawara-docs/ps/uuid/arquivo")

        Returns:
            bytes: O conteúdo binário do PDF.
            None: Se houver erro ou arquivo não encontrado.
        """
        if not public_id:
            return None

        try:
            # 1. Gerar a URL de Download
            download_url, _ = cloudinary.utils.cloudinary_url(
                public_id,
                resource_type="raw" 
            )

            logger.debug(f"Fetching URL: {download_url}")

            # 2. Executar o Download (HTTP GET)
            # Timeout de 15s para evitar que a thread fique presa para sempre
            response = requests.get(download_url, timeout=15)

            # 3. Validar Resposta
            if response.status_code == 200:
                return response.content
            elif response.status_code == 404:
                logger.warning(f"Arquivo não encontrado no Cloudinary: {public_id}")
                return None
            else:
                logger.error(f"Erro HTTP {response.status_code} ao baixar {public_id}")
                return None

        except requests.exceptions.Timeout:
            logger.error(f"Timeout ao tentar baixar {public_id}")
            return None
        except Exception as e:
            logger.error(f"Erro genérico no StorageService para {public_id}: {str(e)}")
            return None

# Singleton Pattern
storage_service = StorageService()