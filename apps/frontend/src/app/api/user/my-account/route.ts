import { NextRequest } from 'next/server';
import { handle_error } from '@/utils/error'
import { successResponse, errorResponse } from '@/lib/helpers/response';
import { getCookie } from '@/utils/cookie'
import { authService } from '@/lib/services/auth/auth.service'
import { UserService } from '@/lib/services/user/user.service'
import { updateMyAccountUserDataSchema } from "@/lib/validations/user.validation";
import { MyAccountUserDataRepository } from '@yawara/types'

export async function GET(request: NextRequest) {
    try {
        const user_token = await getCookie('user-session')

        if (!user_token) {
            throw 'UNAUTHORIZED_ERROR';
        }

        const user_data = await authService.getSession(user_token)

        const response = await new UserService(user_data).getMyAccountUserData();

        return successResponse<MyAccountUserDataRepository>(response, 200);

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


export async function PATCH(request: NextRequest) {
    try {
        const user_token = await getCookie('user-session')
        const body = await request.json();

        if (!user_token) {
            throw 'UNAUTHORIZED_ERROR';
        }

        const user_data = await authService.getSession(user_token)

        if (!updateMyAccountUserDataSchema.safeParse(body).success) {
            throw 'INVALID_INPUT';
        }

        const response = await new UserService(user_data).updateMyAccountUserData(body);

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


