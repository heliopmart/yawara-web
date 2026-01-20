import { NextRequest } from 'next/server';
import { handle_error } from '@/utils/error'
import { getCookie } from '@/utils/cookie'
import { authService } from '@/lib/services/auth/auth.service'
import { ALLOWED_ROLES } from '@/lib/validations/auth.validation'
import {userIdSchema} from '@/lib/validations/myTeam.validation'
import { successResponse, errorResponse } from '@/lib/helpers/response';
import { MyTeamService } from '@/lib/services/myTeam/myTeam.service';
import {TeamMember} from "@yawara/types"

export async function PATCH(request: NextRequest) {
    try {
        const user_token = await getCookie('user-session')

        if (!user_token) {
            throw 'UNAUTHORIZED_ERROR';
        }

        const user_data = await authService.getSession(user_token)
        
        if(!ALLOWED_ROLES[1].includes(user_data.role)){
            throw 'FORBIDDEN_ERROR';
        }

        const {user_id} = await request.json();

        const checkData = userIdSchema.parse({user_id});

        const res = await new MyTeamService(user_data).putWarningUser(checkData.user_id);
       
        return successResponse<TeamMember>(res, 200);

    } catch (error) {
        console.error('team/manage/warning/route.PUT error:', error);

        const errorDetail = handle_error(error);
        return errorResponse(
            errorDetail.message,
            errorDetail.code || 'INTERNAL_SERVER_ERROR',
            errorDetail.statusCode,
        );
    }
}