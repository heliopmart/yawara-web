import { NextResponse } from 'next/server';
import { handle_error } from '@/utils/error';
import { getCookie } from '@/utils/cookie'
import { authService } from '@/lib/services/auth/auth.service'
import { errorResponse } from '@/lib/helpers/response';
import { PsEngine } from '@/lib/services/ps/psEngine.service'

export async function GET(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        const user_token = await getCookie('user-session')

        if (!user_token || !id) {
            throw 'UNAUTHORIZED_ERROR';
        }

        const user_data = await authService.getSession(user_token)

        if(!user_data) {
            throw 'UNAUTHORIZED_ERROR';
        }

        const psService = new PsEngine(user_data);
        const stream = await psService.generateDynamicReport(id);

        return new Response(stream as any, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="Yawara-Relatório-Processo-Seletivo-${id}.pdf"`,
            },
        });
    } catch (error) {
        const errorDetail = handle_error(error);
        return errorResponse(
            errorDetail.message,
            errorDetail.code || 'INTERNAL_SERVER_ERROR',
            errorDetail.statusCode,
        );
    }
}