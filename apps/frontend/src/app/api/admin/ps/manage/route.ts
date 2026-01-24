import { NextRequest } from 'next/server';
import { handle_error } from '@/utils/error'
import { successResponse, errorResponse } from '@/lib/helpers/response';
import { getCookie } from '@/utils/cookie'
import { putUserPresenceSchema } from '@/lib/validations/ps.validation'
import { ALLOWED_ROLES } from '@/lib/validations/auth.validation'
import { authService } from '@/lib/services/auth/auth.service'
import { PsService } from '@/lib/services/ps/ps.service'
import {DashboardPresenceResponse} from '@yawara/types'

export async function GET(request: NextRequest) {
    try {
        const user_token = await getCookie('user-session')

        if (!user_token) {
            throw 'UNAUTHORIZED_ERROR';
        }

        const user_data = await authService.getSession(user_token)

        if (ALLOWED_ROLES.includes(user_data.role) === false) {
            throw 'UNAUTHORIZED_ERROR';
        }

        const response = await new PsService(user_data).getPsUserPresence();

        return successResponse<DashboardPresenceResponse>(response, 200);

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

        const bodyValidationResult = putUserPresenceSchema.safeParse(body);

        if(!bodyValidationResult.success){
            const errorMessage = bodyValidationResult.error.message;
            console.error('Body Validation Error:', errorMessage);
            throw 'VALIDATION_ERROR';
        }

        const response = await new PsService(user_data).updatePsUserPresence(bodyValidationResult.data.updates);

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