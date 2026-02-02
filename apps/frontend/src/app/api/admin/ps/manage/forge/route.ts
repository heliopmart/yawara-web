import { NextRequest, NextResponse } from 'next/server';
import { handle_error } from '@/utils/error'
import { errorResponse } from '@/lib/helpers/response';
import { getCookie } from '@/utils/cookie'
import { putUserScoreSchema } from '@/lib/validations/ps.validation'
import { ALLOWED_ROLES } from '@/lib/validations/auth.validation'
import { authService } from '@/lib/services/auth/auth.service'

const PYTHON_SERVICE_YSNA_URL = process.env.PYTHON_SERVICE_YSNA_URL


export async function GET(request: NextRequest) {
    try {
        const user_token = await getCookie('user-session')

        if (!user_token) {
            throw 'UNAUTHORIZED_ERROR';
        }

        const user_data = await authService.getSession(user_token)
        const body = await request.json();

        if (ALLOWED_ROLES.includes(user_data.role) === false) {
            throw 'UNAUTHORIZED_ERROR';
        }

        const bodyValidationResult = putUserScoreSchema.safeParse(body);

        if (!bodyValidationResult.success) {
            const errorMessage = bodyValidationResult.error.message;
            console.error('Body Validation Error:', errorMessage);
            throw 'VALIDATION_ERROR';
        }

        const headers: HeadersInit = {};

        if (process.env.YSNA_INTERNAL_TOKEN) {
            headers["X-YSNA-INTERNAL-TOKEN"] = process.env.YSNA_INTERNAL_TOKEN;
        }

        const pythonResponse = await fetch(`${PYTHON_SERVICE_YSNA_URL}/valence/forge`, {
            method: 'POST',
            headers
        });

        if (!pythonResponse.ok) {
            return NextResponse.json({ error: 'Falha na criação do valence forge. Contate um DEV imediatamente.' }, { status: 500 });
        }

        return new NextResponse(pythonResponse.body, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': 'attachment; filename="forge_valence_team_report.pdf"',
                'Content-Length': pythonResponse.headers.get('Content-Length') || '',
            },
        });

    } catch (error) {
        console.error('admin/ps/route.GET error:', error);

        const errorDetail = handle_error(error);
        return errorResponse(
            errorDetail.message,
            errorDetail.code || 'INTERNAL_SERVER_ERROR',
            errorDetail.statusCode,
        );
    }
}