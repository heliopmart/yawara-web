import { NextRequest } from 'next/server';
import {handle_error} from '@/utils/error'
import { successResponse, errorResponse } from '@/lib/helpers/response';
import { resetPasswordSchema } from '@/lib/validations/auth.validation'
import { authService } from '@/lib/services/auth/auth.service'

export async function PATCH(request: NextRequest) {
    try {
        const body = await request.json();

        const validation = resetPasswordSchema.safeParse(body);
        if (!validation.success) {
            return errorResponse(
                'Dados de entrada inválidos.',
                'VALIDATION_ERROR',
                400,
            );
        }
        const res = await authService.resetPassword(validation.data);

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