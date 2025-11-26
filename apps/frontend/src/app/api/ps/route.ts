import { NextRequest } from 'next/server';
import { handle_error } from '@/utils/error'
import { successResponse, errorResponse } from '@/lib/helpers/response';
import { getCookie } from '@/utils/cookie'
import { updateNucleiChosenSchema } from '@/lib/validations/ps.validation'
import { authService } from '@/lib/services/auth/auth.service'
import { PsService } from '@/lib/services/ps/ps.service'
import { ps_full_data } from '@yawara/types'

export async function GET(request: NextRequest) {
    try {
        const user_token = await getCookie('user-session')

        if (!user_token) {
            throw 'UNAUTHORIZED_ERROR';
        }

        const user_data = await authService.getSession(user_token)

        const response = await new PsService(user_data).getPsEditionAvailable();

        return successResponse<ps_full_data>(response, 200);

    } catch (error) {
        console.error('ps/route.GET error:', error);

        const errorDetail = handle_error(error);
        return errorResponse(
            errorDetail.message,
            errorDetail.code || 'INTERNAL_SERVER_ERROR',
            errorDetail.statusCode,
        );
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const user_token = await getCookie('user-session')

        if (!user_token) {
            throw 'UNAUTHORIZED_ERROR';
        }

        const user_data = await authService.getSession(user_token)

        const body = await request.json();

        const validationResult = updateNucleiChosenSchema.safeParse(body);

        if (!validationResult.success) {
            const errorMessage = validationResult.error.message;
            return errorResponse(errorMessage, 'VALIDATION_ERROR', 400);
        }

        const { nuclei_chosen, edition_id, card_id } = validationResult.data;

        const response = await new PsService(user_data).updateUserChoices(
            parseInt(card_id),
            edition_id,
            nuclei_chosen
        );

        return successResponse<boolean>(response, 200);

    } catch (error) {
        console.error('ps/route.GET error:', error);

        const errorDetail = handle_error(error);
        return errorResponse(
            errorDetail.message,
            errorDetail.code || 'INTERNAL_SERVER_ERROR',
            errorDetail.statusCode,
        );
    }
}