import { NextRequest } from 'next/server';
import { handle_error } from '@/utils/error'
import { getCookie } from '@/utils/cookie'
import { authService } from '@/lib/services/auth/auth.service'
import { ALLOWED_ROLES } from '@/lib/validations/auth.validation'
import { successResponse, errorResponse } from '@/lib/helpers/response';
import { MyTeamService } from '@/lib/services/myTeam/myTeam.service';

export async function POST(request: NextRequest) {
    try {
        const user_token = await getCookie('user-session');
        if (!user_token) throw 'UNAUTHORIZED_ERROR';

        const user_data = await authService.getSession(user_token);
        const myTeamService = new MyTeamService(user_data);

        if (user_data.role !== ALLOWED_ROLES[1]) throw 'FORBIDDEN_ERROR';

        const formData = await request.formData();
        
        const file = formData.get('file') as File;
        const arttc_id = formData.get('id') as string;

        if (!file || !arttc_id) {
            throw new Error('MISSING_FIELDS_ERROR');
        }

        const res = await myTeamService.uploadArttcFile(arttc_id, file);

        return successResponse<boolean>(res, 200);

    } catch (error) {
        console.error('art/upload/route.POST error:', error);
        const errorDetail = handle_error(error);
        return errorResponse(
            errorDetail.message,
            errorDetail.code || 'INTERNAL_SERVER_ERROR',
            errorDetail.statusCode,
        );
    }
}