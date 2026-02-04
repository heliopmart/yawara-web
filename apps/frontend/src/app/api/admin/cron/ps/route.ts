import { NextResponse } from 'next/server';
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
    const psService = new PsService(adminPayload);
    const target = await psService.checkAndOrchestrateActiveEdition()

    try {
        if (target?.action === 'CLOSE_REGISTRATION') {
            console.info(`[CRON] Fechando inscrições da edição ${target.id}`);
            await psService.checkAndProcessClosing();
        }
        else if (target?.action === 'FINISH_PROCESS') {
            console.info(`[CRON] Finalizando Processo Seletivo ${target.id}`);
            await psService.finishEdition();
        } else if (target?.action === 'DESACTIVATE_PROCESS') {
            await psService.deactivateSelectionProcess(target.id);
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