import { NextResponse } from 'next/server';
import { handle_error } from '@/utils/error'
import { successResponse, errorResponse } from '@/lib/helpers/response';
import { PsService } from '@/lib/services/ps/ps.service';
import { TokenPayload } from '@yawara/types';

export async function GET(request: Request) {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    try {
        const adminPayload: TokenPayload = {
            user_id: 'cron-job-system',
            role: 'LEADER',
            secret: 'cron-job-secret',
            supabaseToken: process.env.SUPABASE_SERVICE_ROLE_KEY
        };

        const psService = new PsService(adminPayload);
        const result = await psService.checkAndProcessClosing();

        if(result === 'NOT_YET_TIME') {
            return successResponse<string>('No editions to process at this time.', 200);
        }else if(result === 'NO_ACTIVE_EDITION') {
            return successResponse<string>('No active editions found to process.', 200);
        }

        return successResponse<string>(result, 200);
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