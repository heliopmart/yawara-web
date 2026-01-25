import { NextResponse } from 'next/server';
import { handle_error } from '@/utils/error'
import { successResponse, errorResponse } from '@/lib/helpers/response';
import { PsService } from '@/lib/services/ps/ps.service';
import { Receiver } from "@upstash/qstash";
import { TokenPayload } from '@yawara/types';

const receiver = new Receiver({
  currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY!,
  nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY!,
});

async function handler(request: Request) {
    try {
        const adminPayload: TokenPayload = {
            user_id: 'cron-job-system',
            role: 'LEADER',
            nuclei_id: 'cron-job-nuclei',
            secret: 'cron-job-secret',
            supabaseToken: process.env.SUPABASE_SERVICE_ROLE_KEY
        };

        const psService = new PsService(adminPayload);
        const result = await psService.checkAndProcessClosing();

        if(result === 'NOT_YET_TIME') {
            return successResponse<string>('No editions to process at this time.', 200);
        } else if(result === 'NO_ACTIVE_EDITION') {
            return successResponse<string>('No active editions found to process.', 200);
        }

        return successResponse<string>(result, 200);
    } catch (error) {
        const errorDetail = handle_error(error);
        return errorResponse(
            errorDetail.message,
            errorDetail.code || 'INTERNAL_SERVER_ERROR',
            errorDetail.statusCode,
        );
    }
}

export async function POST(request: Request) {
    const signature = request.headers.get("upstash-signature");
    const body = await request.text();

    const isValid = await receiver.verify({
        signature: signature!,
        body: body,
    });

    if (!isValid) {
        return new NextResponse('Invalid signature', { status: 401 });
    }

    return handler(request);
}