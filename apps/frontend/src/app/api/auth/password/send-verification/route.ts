import { NextRequest } from 'next/server';
import {handle_error} from '@/utils/error'
import { successResponse, errorResponse } from '@/lib/helpers/response';
import { sendResetPasswordSchema } from '@/lib/validations/auth.validation'
import { authService } from '@/lib/services/auth/auth.service'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        if (sendResetPasswordSchema.safeParse(body).success === false) {
            return errorResponse(
                'Dados de entrada inválidos.',
                'VALIDATION_ERROR',
                400,
            );
        }
        const res = await authService.sendPasswordResetVerification(body.email);

        const response = successResponse<boolean>(res, 200);
        return response;

    } catch (error) {
        const errorDetail = handle_error(error);
        return errorResponse(
            errorDetail.message,
            errorDetail.code || 'INTERNAL_SERVER_ERROR',
            errorDetail.statusCode,
        );
    }
}