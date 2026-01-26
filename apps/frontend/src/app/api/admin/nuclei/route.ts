import { NextRequest } from 'next/server';
import { handle_error } from '@/utils/error'
import { getCookie } from '@/utils/cookie'
import { authService } from '@/lib/services/auth/auth.service'
import { ALLOWED_ROLES } from '@/lib/validations/auth.validation'
import { updateNucleiConfigSchema } from '@/lib/validations/nuclei.validation'
import { successResponse, errorResponse } from '@/lib/helpers/response';
import { NucleiService } from '@/lib/services/nuclei/nuclei.service';
import { NucleiShowProps } from '@yawara/types';

export async function GET(request: NextRequest) {
    try {
        const user_token = await getCookie('user-session')

        let user_data = null;
        if (user_token) {
            user_data = await authService.getSession(user_token)
        }

        const res = await new NucleiService(user_data ? user_data : undefined).getNuclei();
       
        return successResponse<NucleiShowProps[]>(res, 200);

    } catch (error) {
        console.error('admin/nuclei/route.GET error:', error);

        const errorDetail = handle_error(error);
        return errorResponse(
            errorDetail.message,
            errorDetail.code || 'INTERNAL_SERVER_ERROR',
            errorDetail.statusCode,
        );
    }
}
