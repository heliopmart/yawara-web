import { NextRequest } from 'next/server';
import {handle_error} from '@/utils/error'
import { successResponse, errorResponse } from '@/lib/helpers/response';
import {getCookie} from '@/utils/cookie'
import { authService } from '@/lib/services/auth/auth.service'
import { PsService } from '@/lib/services/ps/ps.service'
import { ps_full_data } from '@yawara/types'

export async function GET(request: NextRequest) {
    try {
        const user_token = await getCookie('user-session')

        if(!user_token){
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