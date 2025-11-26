import { NextResponse } from 'next/server';
import type { ApiSuccessResponse, ApiErrorResponse } from '@yawara/types';

/**
 * Cria uma resposta de SUCESSO padronizada.
 * @param data Os dados para enviar (genérico T)
 * @param status O HTTP status code (default: 200)
 */
export function successResponse<T>(
  data: T,
  status: number = 200,
): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json(
    { success: true, status, data, timestamp: new Date().toISOString() },
    { status },
  );
}

/**
 * Cria uma resposta de ERRO padronizada.
 * @param message A mensagem de erro legível
 * @param code O código de erro programático (ex: 'AUTH_ERROR')
 * @param status O HTTP status code (default: 500)
 * @param details (Opcional) Detalhes do erro
 */
export function errorResponse(
  message: string,
  code: string,
  status: number = 500,
  details?: any,
): NextResponse<ApiErrorResponse> {
  return NextResponse.json(
    {
      success: false,
      status,
      error: { message, code, details },
      timestamp: new Date().toISOString(),
    },
    { status },

  );
}