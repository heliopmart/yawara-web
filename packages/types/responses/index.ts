/**
 * Interface para uma resposta de ERRO padrão da API.
 */
export interface ApiErrorResponse {
  success: false;
  /** O HTTP status code */
  status: number;
  /** O objeto de erro */
  error: {
    /** Uma mensagem legível para o frontend (ou para o usuário) */
    message: string;
    /** Um código de erro programático (para o frontend fazer switch/case) */
    code: string;
    /** (Opcional) Detalhes de validação do Zod ou outros erros */
    details?: any;
  };
  /** Timestamp da resposta */
  timestamp: string;
}

/**
 * Interface para uma resposta de SUCESSO padrão da API.
 * É genérica (T) para que você possa tipar os dados de retorno.
 */
export interface ApiSuccessResponse<T> {
  success: true;
  /** O HTTP status code */
  status: number;
  /** Os dados da resposta */
  data: T;
  /** Timestamp da resposta */
  timestamp: string;
}

/**
 * O tipo de união que o frontend irá receber.
 * O TypeScript entenderá que:
 * - Se `success` for `true`, `data` existe e `error` não.
 * - Se `success` for `false`, `error` existe e `data` não.
 */
export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;