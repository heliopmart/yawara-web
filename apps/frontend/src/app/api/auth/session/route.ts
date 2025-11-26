import { NextRequest } from 'next/server';
import { getCookie } from '@/utils/cookie'
import {handle_error} from '@/utils/error'
import { successResponse, errorResponse } from '@/lib/helpers/response';
import { authService } from '@/lib/services/auth/auth.service'

export async function GET(request: NextRequest) {
    try {
        const user_session = await getCookie("user-session");

        if(!user_session){
            throw 'TOKEN_NOT_EXIST'
        }

        const isValid = await authService.verifySession(user_session);

        if(!isValid){
            throw 'TOKEN_INVALID'
        }

        return successResponse<boolean>(true, 200);
    } catch (error) {
        const errorDetail = handle_error(error);
        return errorResponse(
            errorDetail.message,
            errorDetail.code || 'INTERNAL_SERVER_ERROR',
            errorDetail.statusCode,
        );
    }
}