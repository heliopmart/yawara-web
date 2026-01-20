import { NextRequest } from 'next/server';
import { handle_error } from '@/utils/error'
import { getCookie } from '@/utils/cookie'
import { authService } from '@/lib/services/auth/auth.service'
import { uploadReportArt } from '@/lib/validations/myTeam.validation'
import { ALLOWED_ROLES } from '@/lib/validations/auth.validation'
import { successResponse, errorResponse } from '@/lib/helpers/response';
import { MyTeamService } from '@/lib/services/myTeam/myTeam.service';

export async function POST(request: NextRequest) {
    try {
        const user_token = await getCookie('user-session')

        if (!user_token) {
            throw 'UNAUTHORIZED_ERROR';
        }

        const user_data = await authService.getSession(user_token)

        const myTeamService = new MyTeamService(user_data);

        const handleValidation = myTeamService.handleValidationUploadReportArt(user_data.user_id)

        if(!handleValidation || !ALLOWED_ROLES[1].includes(user_data.role)) {
            throw 'FORBIDDEN_ERROR';
        }

        const data = await request.json();
        const validatedData = uploadReportArt.parse(data);

        const res = await myTeamService.uploadReportArt(
            validatedData.id,
            validatedData.file
        );

        return successResponse<boolean>(res, 200);

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
