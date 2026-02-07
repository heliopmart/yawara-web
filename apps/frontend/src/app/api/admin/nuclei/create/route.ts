import { NextRequest } from 'next/server';
import { handle_error } from '@/utils/error'
import { getCookie } from '@/utils/cookie'
import { authService } from '@/lib/services/auth/auth.service'
import { ALLOWED_ROLES } from '@/lib/validations/auth.validation'
import { createNucleusSchema } from '@/lib/validations/nuclei.validation'
import { successResponse, errorResponse } from '@/lib/helpers/response';
import { NucleiService } from '@/lib/services/nuclei/nuclei.service';
import { MemberToCreateNucleus } from '@yawara/types';

export async function GET(request: NextRequest) {
    try {
        const user_token = await getCookie('user-session')

        if(!user_token){
            throw "UNAUTHORIZED";
        }

        const user_data = await authService.getSession(user_token)

        if(ALLOWED_ROLES[0] !== user_data.role){
            throw "FORBIDDEN";
        }

        const res = await new NucleiService(user_data).getMembersForNucleusAdm();
       
        return successResponse<MemberToCreateNucleus[]>(res, 200);

    } catch (error) {
        console.error('admin/nuclei/create/route.GET error:', error);

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

        if(!user_token){
            throw "UNAUTHORIZED";
        }

        const user_data = await authService.getSession(user_token)

        if(ALLOWED_ROLES[0] !== user_data.role){
            throw "FORBIDDEN";
        }

        const data = await request.json();
        const validation = createNucleusSchema.safeParse(data);

        if(!validation.success){
            throw validation.error;
        }

        const res = await new NucleiService(user_data).createNucleus(validation.data);
       
        return successResponse<boolean>(res, 200);

    } catch (error:string | any) {
        console.error('admin/nuclei/create/route.POST error:', error);

        const errorDetail = handle_error(error);
        return errorResponse(
            error,
            errorDetail.code || 'INTERNAL_SERVER_ERROR',
            errorDetail.statusCode,
        );
    }
}
