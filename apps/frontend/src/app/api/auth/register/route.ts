import { NextRequest } from 'next/server';
import {handle_error} from '@/utils/error'
import { successResponse, errorResponse } from '@/lib/helpers/response';
import { registreSchema } from '@/lib/validations/auth.validation'
import { authService } from '@/lib/services/auth/auth.service'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        console.log("INFO: ")
        console.log(body)

        if (registreSchema.safeParse(body).success === false) {
            return errorResponse(
                'Dados de entrada inválidos.',
                'VALIDATION_ERROR',
                400,
            );
        }

        const registre_user_reponse = await authService.register(body);

        const response = successResponse<boolean>(registre_user_reponse, 200);
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