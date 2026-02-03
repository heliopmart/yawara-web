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
        
        if(!id){
            throw 'MISSING_PS_EDITION_ID';
        }

        const psService = new PsEngine();
        const stream = await psService.generateFinallyReportPs(id);

        return new Response(stream as any, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="Yawara-Transparência-Processo-Seletivo-${id.slice(0, 8)}.pdf"`,
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