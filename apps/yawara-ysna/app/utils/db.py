import logging
import os
from typing import List, Dict, Any, Optional, Union
from supabase import create_client, Client
from app.core.config import settings

logger = logging.getLogger("yawara.utils.db")

# --- Inicialização do Cliente ---
try:
    url: str = settings.SUPABASE_URL
    key: str = settings.SUPABASE_KEY
    supabase: Client = create_client(url, key)
except Exception as e:
    logger.critical(f"FATAL: Não foi possível conectar ao Supabase. Verifique as variáveis de ambiente. Erro: {e}")
    raise e

# --- Funções Utilitárias de CRUD ---

def db_select(
    table: str, 
    columns: str = "*", 
    filters: Optional[Dict[str, Any]] = None,
    single: bool = False
) -> Union[List[Dict], Dict, None]:
    """
    Executa um SELECT genérico no Supabase.

    Args:
        table (str): Nome da tabela.
        columns (str): Colunas para retornar (ex: "id, name" ou "*, relation(*)").
        filters (dict): Dicionário de filtros de igualdade {coluna: valor}.
                        Ex: {"status": "ACTIVE", "user_id": 123}
        single (bool): Se True, retorna apenas o primeiro objeto (ou None). 
                       Se False, retorna uma lista.

    Returns:
        Dados da consulta ou None se der erro/não encontrar (em modo single).
    """
    try:
        query = supabase.table(table).select(columns)

        # Aplica filtros de igualdade (EQ)
        if filters:
            for column, value in filters.items():
                query = query.eq(column, value)

        # Executa a query
        response = query.execute()
        data = response.data

        if single:
            return data[0] if data and len(data) > 0 else None
            
        return data

    except Exception as e:
        logger.error(f"DB SELECT Error | Table: {table} | Filters: {filters} | Error: {str(e)}")
        # Em produção, podemos decidir se lançamos o erro ou retornamos vazio. 
        # Para resiliência, retornaremos estrutura vazia ou None.
        return None if single else []


def db_insert(
    table: str, 
    data: Union[Dict, List[Dict]]
) -> Union[List[Dict], None]:
    """
    Insere um ou múltiplos registros no Supabase.

    Args:
        table (str): Nome da tabela.
        data (dict | list): Dicionário (um registro) ou Lista de Dicionários (bulk insert).

    Returns:
        Os dados inseridos (incluindo IDs gerados) ou None em caso de erro.
    """
    try:
        response = supabase.table(table).insert(data).execute()
        logger.info(f"DB INSERT Success | Table: {table} | Count: {len(response.data)}")
        return response.data

    except Exception as e:
        logger.error(f"DB INSERT Error | Table: {table} | Error: {str(e)}")
        return None


def db_update(
    table: str, 
    data: Dict[str, Any], 
    filters: Dict[str, Any]
) -> Union[List[Dict], None]:
    """
    Atualiza registros baseados em filtros.

    Args:
        table (str): Nome da tabela.
        data (dict): Campos para atualizar.
        filters (dict): Filtros para identificar quais linhas atualizar (Obrigatório para segurança).

    Returns:
        Os dados atualizados ou None.
    """
    if not filters:
        logger.error(f"DB UPDATE Aborted | Table: {table} | Motivo: Tentativa de update sem filtros (perigoso).")
        return None

    try:
        query = supabase.table(table).update(data)

        for column, value in filters.items():
            query = query.eq(column, value)

        response = query.execute()
        logger.info(f"DB UPDATE Success | Table: {table} | Rows: {len(response.data)}")
        return response.data

    except Exception as e:
        logger.error(f"DB UPDATE Error | Table: {table} | Filters: {filters} | Error: {str(e)}")
        return None

def db_rpc(function_name: str, params: Dict[str, Any] = None) -> Any:
    """
    Executa uma Stored Procedure (RPC) no Supabase.
    Útil para lógicas complexas que já existem no banco.
    """
    try:
        response = supabase.rpc(function_name, params or {}).execute()
        return response.data
    except Exception as e:
        logger.error(f"DB RPC Error | Function: {function_name} | Error: {str(e)}")
        return None