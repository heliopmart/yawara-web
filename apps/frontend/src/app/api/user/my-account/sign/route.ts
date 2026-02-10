import { NextRequest } from 'next/server';
import { handle_error } from '@/utils/error'
import { successResponse, errorResponse } from '@/lib/helpers/response';
import { getCookie } from '@/utils/cookie'
import { authService } from '@/lib/services/auth/auth.service'
import { MyTeamService } from "@/lib/services/myTeam/myTeam.service"
import { SignDocs } from '@yawara/types'

export async function GET(request: NextRequest) {
    try {
        const user_token = await getCookie('user-session')
        const { searchParams } = new URL(request.url);
        const sign = searchParams.get('sign');

        if (!user_token) {
            throw 'UNAUTHORIZED_ERROR';
        }

        const user_data = await authService.getSession(user_token)

        if (!sign) {
            throw 'MISSING_SIGN';
        }

        const response = await new MyTeamService(user_data).getSign(sign);

        return successResponse<SignDocs>(response, 200);

    } catch (error) {
        console.error('user/my-account/sign/route.GET error:', error);

        const errorDetail = handle_error(error);
        return errorResponse(
            errorDetail.message,
            errorDetail.code || 'INTERNAL_SERVER_ERROR',
            errorDetail.statusCode,
        );
    }
}


export async function POST(request: NextRequest) {
    try {
        const user_token = await getCookie('user-session')

        if (!user_token) {
            throw 'UNAUTHORIZED_ERROR';
        }

        const user_data = await authService.getSession(user_token)

        if(!user_data){
            throw 'UNAUTHORIZED_ERROR';
        }
        
        const response = await new MyTeamService(user_data).createSign();

        return successResponse<string>(response, 200);

    } catch (error) {
        console.error('user/my-account/sign/route.POST error:', error);

        const errorDetail = handle_error(error);
        return errorResponse(
            errorDetail.message,
            errorDetail.code || 'INTERNAL_SERVER_ERROR',
            errorDetail.statusCode,
        );
    }
}


