import logging
import requests
import cloudinary
import cloudinary.uploader
import cloudinary.api
import cloudinary.utils
import os
from typing import Optional
from app.core.config import settings

logger = logging.getLogger("yawara.services.storage")

class StorageService:
    """
    Gateway de comunicação com o Cloudinary (Object Storage).

    Responsabilidade:
        Gerenciar upload e download de artefatos grandes (Modelos .keras, Pesos .h5).
        Não salva arquivos em disco permanentemente (Stateless), exceto para cache de modelos.

    Note:
        Os métodos desta classe são SÍNCRONOS (Bloqueantes). 
        Se utilizados em rotas HTTP, devem ser envolvidos em threads.
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
            logger.critical(f"Falha ao configurar credenciais Cloudinary: {e}")

    def get_file_bytes(self, public_id: str) -> Optional[bytes]:
        """
        Baixa o conteúdo de um arquivo diretamente para a memória (RAM).

        Args:
            public_id (str): ID do recurso no Cloudinary (ex: "yawara-docs/arquivo.pdf").

        Returns:
            Optional[bytes]: Conteúdo binário ou None se falhar.
        """
        if not public_id:
            return None

        try:
            # 1. Gerar a URL de Download assinada
            download_url, _ = cloudinary.utils.cloudinary_url(
                public_id,
                resource_type="raw" 
            )

            logger.debug(f"Fetching Bytes from: {download_url}")

            # 2. Executar o Download
            response = requests.get(download_url, timeout=15)

            if response.status_code == 200:
                return response.content
            elif response.status_code == 404:
                logger.warning(f"Arquivo não encontrado (404): {public_id}")
                return None
            else:
                logger.error(f"Erro HTTP {response.status_code} ao baixar {public_id}")
                return None

        except requests.exceptions.Timeout:
            logger.error(f"Timeout (15s) ao tentar baixar {public_id}")
            return None
        except Exception as e:
            logger.error(f"Erro genérico no StorageService para {public_id}: {str(e)}")
            return None

    @staticmethod
    def upload_file(local_path: str, remote_name: str) -> Optional[str]:
        """
        Realiza Upload de um arquivo local para o bucket 'raw'.

        Args:
            local_path (str): Caminho absoluto do arquivo no disco.
            remote_name (str): Nome desejado na nuvem (será prefixado com 'models/').

        Returns:
            Optional[str]: URL segura do arquivo uploadado ou None.
        """
        try:
            logger.info(f"☁️ Iniciando upload para Cloudinary: models/{remote_name}...")
            
            response = cloudinary.uploader.upload(
                local_path, 
                resource_type="raw",
                public_id=f"models/{remote_name}",
                overwrite=True,
                unique_filename=False,
                access_mode="public"
            )
            
            url = response.get('secure_url')
            logger.info(f"✅ Upload concluído: {remote_name}")
            return url

        except Exception as e:
            logger.error(f"❌ Erro no upload Cloudinary: {e}", exc_info=True)
            return None

    @staticmethod
    def download_file(remote_name: str, local_dest: str) -> bool:
        """
        Baixa um arquivo RAW para o disco local (Cache de Modelos).
        
        Logica de Fallback:
            Tenta gerar URL via SDK. Se falhar, constrói URL pública manualmente.
            Isso é necessário pois em alguns ambientes a assinatura de URL raw falha.

        Args:
            remote_name (str): ID do arquivo (sem prefixo models/ se a URL for manual).
            local_dest (str): Caminho local onde salvar.

        Returns:
            bool: True se sucesso, False caso contrário.
        """
        try:
            os.makedirs(os.path.dirname(local_dest), exist_ok=True)
            url = None

            # 1. Tentativa via SDK
            try:
                url, _ = cloudinary.utils.cloudinary_url(remote_name, resource_type="raw")
            except Exception as e:
                logger.warning(f"Falha ao gerar URL via SDK: {e}. Tentando fallback manual.")

            # 2. Fallback Manual (Lógica de Negócio Preservada)
            if not url:
                config = cloudinary.config()
                if config.cloud_name:
                    url = f"https://res.cloudinary.com/{config.cloud_name}/raw/upload/models/{remote_name}"
                else:
                    logger.error("Cloudinary não configurado. Impossível gerar URL.")
                    return False

            logger.debug(f"Downloading Model: {url} -> {local_dest}")

            # Stream=True para não carregar arquivos gigantes na RAM
            with requests.get(url, stream=True, timeout=60) as r:
                if r.status_code == 200:
                    with open(local_dest, "wb") as f:
                        for chunk in r.iter_content(chunk_size=1024 * 1024): # Chunks de 1MB
                            if chunk:
                                f.write(chunk)

                    # Validação de integridade simples
                    if os.path.getsize(local_dest) <= 0:
                        logger.error(f"Download resultou em arquivo vazio: {remote_name}")
                        os.remove(local_dest) # Limpa lixo
                        return False

                    return True

                elif r.status_code == 404:
                    logger.warning(f"Arquivo não existe no Cloudinary: {remote_name}")
                    return False
                
                elif r.status_code in (401, 403):
                    logger.error(f"Acesso negado ({r.status_code}) a {url}. Verifique se o arquivo é 'Public'.")
                    return False

                else:
                    logger.error(f"Erro HTTP {r.status_code} no download de {remote_name}")
                    return False

        except Exception as e:
            logger.error(f"Erro crítico no download de {remote_name}: {e}", exc_info=True)
            return False

# Singleton
storage_service = StorageService()