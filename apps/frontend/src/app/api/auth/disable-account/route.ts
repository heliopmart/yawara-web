import { NextRequest } from 'next/server';
import { handle_error } from '@/utils/error'
import { successResponse, errorResponse } from '@/lib/helpers/response';
import { getCookie } from '@/utils/cookie'
import { authService } from '@/lib/services/auth/auth.service'

export async function PUT(request: NextRequest) {
    try {
        const user_token = await getCookie('user-session')

        if (!user_token) {
            throw 'UNAUTHORIZED_ERROR';
        }

        const user_data = await authService.getSession(user_token)

        const response = await authService.disableAccount(user_data.user_id, user_token);

        return successResponse<boolean>(response, 200);

    } catch (error) {
        console.error('user/my-account/route.GET error:', error);

        const errorDetail = handle_error(error);
        return errorResponse(
            errorDetail.message,
            errorDetail.code || 'INTERNAL_SERVER_ERROR',
            errorDetail.statusCode,
        );
    }
}
