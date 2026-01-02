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
                public_id = remote_name,
                overwrite = True,
                unique_filename = False
            )
            return response.get('secure_url')
        except Exception as e:
            print(f"❌ Erro no upload Cloudinary: {e}")
            return None

    @staticmethod
    def download_file(remote_name: str, local_dest: str) -> bool:
        """
        Baixa o arquivo 'raw' do Cloudinary para o disco local.
        Necessário porque o TensorFlow precisa ler o arquivo do disco.
        """
        try:
            resource = cloudinary.api.resource(remote_name, resource_type="raw")
            download_url = resource.get("secure_url")
            
            if not download_url:
                print("⚠️ Arquivo não encontrado no Cloudinary (URL vazia).")
                return False

            print(f"⬇️ Baixando de {remote_name}...")
            
            response = requests.get(download_url, stream=True)
            
            if response.status_code == 200:
                with open(local_dest, 'wb') as f:
                    for chunk in response.iter_content(chunk_size=8192):
                        f.write(chunk)
                print(f"✅ Download salvo em: {local_dest}")
                return True
            else:
                print(f"❌ Falha ao baixar arquivo. Status: {response.status_code}")
                return False
                
        except cloudinary.exceptions.NotFound:
            print(f"ℹ️ Arquivo '{remote_name}' não existe no Cloudinary (Primeiro treino?).")
            return False
        except Exception as e:
            print(f"❌ Erro crítico no download: {e}")
            return False

# Singleton Pattern
storage_service = StorageService()