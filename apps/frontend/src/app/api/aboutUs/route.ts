import { NextRequest } from 'next/server';
import { handle_error } from '@/utils/error'
import { successResponse, errorResponse } from '@/lib/helpers/response';
import {  AboutUsService } from '@/lib/services/aboutUs/aboutUs.service';
import { AboutUsData } from '@yawara/types';

export async function GET(request: NextRequest) {
    try {
        const res = await new AboutUsService().getAboutUsData();       
        return successResponse<AboutUsData>(res, 200);

    } catch (error) {
        console.error('/aboutUs/route.GET error:', error);

        const errorDetail = handle_error(error);
        return errorResponse(
            errorDetail.message,
            errorDetail.code || 'INTERNAL_SERVER_ERROR',
            errorDetail.statusCode,
        );
    }
}
