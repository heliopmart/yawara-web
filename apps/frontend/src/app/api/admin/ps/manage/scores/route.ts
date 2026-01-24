import { NextRequest } from 'next/server';
import { handle_error } from '@/utils/error'
import { successResponse, errorResponse } from '@/lib/helpers/response';
import { getCookie } from '@/utils/cookie'
import { putUserScoreSchema } from '@/lib/validations/ps.validation'
import { ALLOWED_ROLES } from '@/lib/validations/auth.validation'
import { authService } from '@/lib/services/auth/auth.service'
import { PsService } from '@/lib/services/ps/ps.service'

export async function PATCH(request: NextRequest) {
    try {
        const user_token = await getCookie('user-session')

        if (!user_token) {
            throw 'UNAUTHORIZED_ERROR';
        }

        const user_data = await authService.getSession(user_token)
        const body = await request.json();
        
        if (ALLOWED_ROLES.includes(user_data.role) === false) {
            throw 'UNAUTHORIZED_ERROR';
        }

        const bodyValidationResult = putUserScoreSchema.safeParse(body);

        if(!bodyValidationResult.success){
            const errorMessage = bodyValidationResult.error.message;
            console.error('Body Validation Error:', errorMessage);
            throw 'VALIDATION_ERROR';
        }

        const response = await new PsService(user_data).updatePsUserScore(bodyValidationResult.data.updates);

        return successResponse<boolean>(response, 200);

    } catch (error) {
        console.error('admin/ps/route.PATCH error:', error);

        const errorDetail = handle_error(error);
        return errorResponse(
            errorDetail.message,
            errorDetail.code || 'INTERNAL_SERVER_ERROR',
            errorDetail.statusCode,
        );
    }
}