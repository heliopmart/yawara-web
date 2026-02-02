import { NextRequest, NextResponse } from 'next/server';
import { handle_error } from '@/utils/error'
import { errorResponse } from '@/lib/helpers/response';
import { getCookie } from '@/utils/cookie'
import { YsnaService } from '@/lib/services/ysna/ysna.service'
import { ALLOWED_ROLES } from '@/lib/validations/auth.validation'
import { authService } from '@/lib/services/auth/auth.service'


export async function POST(request: NextRequest) {
    try {
        const user_token = await getCookie('user-session')

        if (!user_token) {
            throw 'UNAUTHORIZED_ERROR';
        }

        const user_data = await authService.getSession(user_token)

        if (ALLOWED_ROLES.includes(user_data.role) === false) {
            throw 'UNAUTHORIZED_ERROR';
        }

        const ysnaService = new YsnaService();
        const pythonResponse = await ysnaService.forgeValenceReport();

        return new NextResponse(pythonResponse.body, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': 'attachment; filename="forge_valence_team_report.pdf"',
                'Content-Length': pythonResponse.headers.get('Content-Length') || '',
            },
        });

    } catch (error) {
        console.error('admin/ps/forge/route.POST error:', error);

        const errorDetail = handle_error(error);
        return errorResponse(
            errorDetail.message,
            errorDetail.code || 'INTERNAL_SERVER_ERROR',
            errorDetail.statusCode,
        );
    }
}