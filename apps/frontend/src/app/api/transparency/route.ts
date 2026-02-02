import { NextRequest } from 'next/server';
import { handle_error } from '@/utils/error'
import { successResponse, errorResponse } from '@/lib/helpers/response';
import { TransparencyService } from '@/lib/services/transparency/transparency.service';
import { ToolShowProps} from '@yawara/types';

export async function GET(request: NextRequest) {
    try {
        const res = await new TransparencyService().getTransparencyData();
       
        return successResponse<any>(res, 200);

    } catch (error) {
        console.error('transparency/route.GET error:', error);

        const errorDetail = handle_error(error); 
        return errorResponse(
            errorDetail.message,
            errorDetail.code || 'INTERNAL_SERVER_ERROR',
            errorDetail.statusCode,
        );
    }
}