import logging
import requests
import cloudinary
import cloudinary.uploader
import cloudinary.api
import cloudinary.utils
import os
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

    @staticmethod
    def upload_file(local_path: str, remote_name: str) -> str:
        """
        Sobe um arquivo local para o Cloudinary como 'raw'.
        Args:
            local_path: Caminho do arquivo no servidor (ex: /tmp/model.keras)
            remote_name: Nome único para o arquivo na nuvem (public_id)
        Returns:
            URL pública do arquivo ou None se falhar.
        """
        
        try:
            print(f"☁️ Iniciando upload para Cloudinary: {remote_name}...")
            response = cloudinary.uploader.upload(
                local_path, 
                resource_type = "raw",
                public_id = "models/" + remote_name,
                overwrite = True,
                unique_filename = False,
                access_mode="public"
            )
            print("[DBG][STORAGE] upload OK remote=", remote_name)
            return response.get('secure_url')
        except Exception as e:
            print(f"❌ Erro no upload Cloudinary: {e}")
            return None

    @staticmethod
    def download_file(remote_name: str, local_dest: str) -> bool:
        """
        Baixa o arquivo RAW do Cloudinary para disco local.
        Sem Admin API: depende do arquivo estar PUBLIC.
        Retorna True se baixou, False caso não exista/erro.
        """

        try:
            os.makedirs(os.path.dirname(local_dest), exist_ok=True)

            try:
                url, _ = cloudinary.utils.cloudinary_url(
                    remote_name,
                    resource_type="raw"
                )
            except Exception:
                print("[DBG][STORAGE] download FAILED:", str(e)[:200])
                url = None

            # 2) Fallback manual (evita helper gerar rota errada em alguns setups)
            if not url:
                cloud_name = cloudinary.config().cloud_name
                url = f"https://res.cloudinary.com/{cloud_name}/raw/upload/models/{remote_name}"

            logger.debug(f"Downloading: {url}")

            r = requests.get(url, stream=True, timeout=30)

            if r.status_code == 200:
                with open(local_dest, "wb") as f:
                    for chunk in r.iter_content(chunk_size=1024 * 1024):
                        if chunk:
                            f.write(chunk)

                if os.path.getsize(local_dest) <= 0:
                    logger.error(f"Download vazio para: {remote_name}")
                    return False

                return True

            if r.status_code == 404:
                logger.warning(f"(info) Arquivo ainda não existe no Cloudinary: {remote_name}")
                return False

            if r.status_code in (401, 403):
                logger.error(
                    f"Sem permissão para baixar {remote_name} (HTTP {r.status_code}). "
                    f"Para baixar sem Admin API, o RAW precisa ser PUBLIC (access_mode='public')."
                )
                return False

            logger.error(f"Erro HTTP {r.status_code} ao baixar {remote_name}")
            return False

        except requests.exceptions.Timeout:
            logger.error(f"Timeout ao tentar baixar {remote_name}")
            return False
        except Exception as e:
            logger.error(f"Erro genérico no StorageService para {remote_name}: {e}")
            return False

# Singleton Pattern
storage_service = StorageService()