import { NextRequest } from 'next/server';
import { handle_error } from '@/utils/error'
import { getCookie } from '@/utils/cookie'
import { authService } from '@/lib/services/auth/auth.service'
import { createArtSchema } from '@/lib/validations/myTeam.validation'
import { ALLOWED_ROLES } from '@/lib/validations/auth.validation'
import { successResponse, errorResponse } from '@/lib/helpers/response';
import { MyTeamService } from '@/lib/services/myTeam/myTeam.service';
import { TeamMemberMinify } from "@yawara/types"

export async function GET(request: NextRequest) {
    try {
        const user_token = await getCookie('user-session')

        if (!user_token) {
            throw 'UNAUTHORIZED_ERROR';
        }
        const user_data = await authService.getSession(user_token)
    
        if (user_data.role !== ALLOWED_ROLES[1]) {
            throw 'FORBIDDEN_ERROR';
        }

        const res = await new MyTeamService(user_data).getMyTeamDataForNote();

        return successResponse<TeamMemberMinify[]>(res, 200);

    } catch (error) {
        console.error('myTeam/art/route.GET error:', error);

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

        if (user_data.role !== ALLOWED_ROLES[1]) {
            throw 'FORBIDDEN_ERROR';
        }

        const data = await request.json();
        const validatedData = createArtSchema.parse(data);

        const res = await new MyTeamService(user_data).createArt(
            validatedData.title,
            validatedData.description,
            validatedData.members
        );

        return successResponse<string>(res, 200);

    } catch (error) {
        console.error('team/score/route.PATCH error:', error);

        const errorDetail = handle_error(error);
        return errorResponse(
            errorDetail.message,
            errorDetail.code || 'INTERNAL_SERVER_ERROR',
            errorDetail.statusCode,
        );
    }
}
