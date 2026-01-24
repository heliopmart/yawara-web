import { NextRequest } from 'next/server';
import { handle_error } from '@/utils/error'
import { getCookie } from '@/utils/cookie'
import { authService } from '@/lib/services/auth/auth.service'
import { ALLOWED_ROLES } from '@/lib/validations/auth.validation'
import { updateNucleiConfigSchema } from '@/lib/validations/nuclei.validation'
import { successResponse, errorResponse } from '@/lib/helpers/response';
import { NucleiService } from '@/lib/services/nuclei/nuclei.service';
import { PsEditionAndNucleiConfigs, NucleiRepositoryFactory } from '@yawara/types';

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

        const res = await new NucleiService(user_data).getActivePsEdition();
       
        return successResponse<PsEditionAndNucleiConfigs>(res, 200);

    } catch (error) {
        console.error('admin/nucleus/route.GET error:', error);

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

        if (ALLOWED_ROLES.includes(user_data.role) === false) {
            throw 'UNAUTHORIZED_ERROR';
        }

        const body = await request.json();

        const bodyValidation = updateNucleiConfigSchema.safeParse(body);

        if (!bodyValidation.success) {
            console.error('POST /nuclei validation error:', bodyValidation.error);
            throw 'INVALID_REQUEST_DATA';
        }


        const nucleiService = new NucleiService(user_data);
        const res = await nucleiService.updateNucleiConfig(bodyValidation.data);
        return successResponse<NucleiRepositoryFactory>(res, 200);

    } catch (error) {
        console.error('admin/nucleus/route.PATCH error:', error);

        const errorDetail = handle_error(error);
        return errorResponse(
            errorDetail.message,
            errorDetail.code || 'INTERNAL_SERVER_ERROR',
            errorDetail.statusCode,
        );
    }
}
