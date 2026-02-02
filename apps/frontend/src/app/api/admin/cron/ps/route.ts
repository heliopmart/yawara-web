import { NextResponse } from 'next/server';
import { QStashService } from '@/lib/services/qstash/qstash.service';
import { PsService } from '@/lib/services/ps/ps.service';
import { handle_error } from '@/utils/error'
import { successResponse, errorResponse } from '@/lib/helpers/response';
import { TokenPayload } from '@yawara/types';

const adminPayload: TokenPayload = {
    user_id: 'cron-job-system',
    role: 'LEADER',
    nuclei_id: 'cron-job-nuclei',
    secret: 'cron-job-secret',
    supabaseToken: process.env.SUPABASE_SERVICE_ROLE_KEY
};

export async function POST(req: Request) {
    const qstash = new QStashService();

    const rawBody = await req.text();
    const isValid = await qstash.verifySignature(req, rawBody);

    if (!isValid) {
        throw "UNAUTHORIZED";
    }

    const body = JSON.parse(rawBody);
    const { target, action, edition_id, card_id, card_type } = body;

    console.info(`[CRON DISPATCHER] Recebido: ${target} -> ${action} | Edição: ${edition_id}`);

    const psService = new PsService(adminPayload);

    try {
        if (target === 'EDITION') {
            if (action === 'CLOSE_REGISTRATION') {
                console.info(`[CRON] Fechando inscrições da edição ${edition_id}`);
                await psService.checkAndProcessClosing();
            }
            else if (action === 'FINISH_PROCESS') {
                console.info(`[CRON] Finalizando Processo Seletivo ${edition_id}`);
                await psService.finishEdition();
            }
        }

        return successResponse<boolean>(true, 200);
    } catch (error) {
        const errorDetail = handle_error(error);
        return errorResponse(
            errorDetail.message,
            errorDetail.code || 'INTERNAL_SERVER_ERROR',
            errorDetail.statusCode,
        );
    }
}