import { NextResponse } from 'next/server';
import { WpaService } from '@/lib/services/wpa/wpa.service';
import { handle_error } from '@/utils/error'
import { successResponse, errorResponse } from '@/lib/helpers/response';
import { TokenPayload } from '@yawara/types';


export async function POST(req: Request) {
    try {
        const headers = req.headers;
        if (headers.get('upstash-schedule-id')?.trim() !== process.env.CRON_SECRET?.trim()) {
            throw "UNAUTHORIZED";
        }

        const wpaService = new WpaService();
        const target = await wpaService.wpa_service()
        return successResponse<boolean>(target, 200);
    } catch (error) {
        console.error(error)

        const errorDetail = handle_error(error);
        return errorResponse(
            errorDetail.message,
            errorDetail.code || 'INTERNAL_SERVER_ERROR',
            errorDetail.statusCode,
        );
    }
}