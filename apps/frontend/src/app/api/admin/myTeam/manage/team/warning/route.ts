import { NextRequest } from 'next/server';
import { handle_error } from '@/utils/error'
import { getCookie } from '@/utils/cookie'
import { authService } from '@/lib/services/auth/auth.service'
import { ALLOWED_ROLES } from '@/lib/validations/auth.validation'
import {userIdSchema} from '@/lib/validations/myTeam.validation'
import { successResponse, errorResponse } from '@/lib/helpers/response';
import { MyTeamService } from '@/lib/services/myTeam/myTeam.service';

export async function PATCH(request: NextRequest) {
    try {
        const user_token = await getCookie('user-session')

        if (!user_token) {
            throw 'UNAUTHORIZED_ERROR';
        }

        const user_data = await authService.getSession(user_token)
        
        if (user_data.role !== ALLOWED_ROLES[1]) {
            throw 'FORBIDDEN_ERROR';
        }

        const {team_id} = await request.json();

        const checkData = userIdSchema.parse({team_id: team_id});

        const res = await new MyTeamService(user_data).putWarningUser(checkData.team_id);
       
        return successResponse<boolean>(res, 200);

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