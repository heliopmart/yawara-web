import { NextRequest } from 'next/server';
import { handle_error } from '@/utils/error'
import { getCookie } from '@/utils/cookie'
import { authService } from '@/lib/services/auth/auth.service'
import { deallocateToolSchema } from '@/lib/validations/tools.validation'
import { successResponse, errorResponse } from '@/lib/helpers/response';
import { ToolsService } from '@/lib/services/tools/tools.service';

export async function PATCH(request: NextRequest) {
    try {
        const user_token = await getCookie('user-session')

        if (!user_token) {
            throw 'UNAUTHORIZED_ERROR';
        }

        const user_data = await authService.getSession(user_token)

        if(user_data.role === 'USER') {
            throw 'UNAUTHORIZED_ERROR';
        }

        const body = await request.json();
        const bodyValidation = deallocateToolSchema.safeParse(body);

        if(!bodyValidation.success) {
            throw 'INVALID_REQUEST_DATA';
        }

        const res = await new ToolsService(user_data).deallocateTool(bodyValidation.data.id, bodyValidation.data.quantity);
       
        return successResponse<boolean>(res, 200);

    } catch (error) {
        console.error('admin/tool/deallocate/route.PATCH error:', error);

        const errorDetail = handle_error(error); 
        return errorResponse(
            errorDetail.message,
            errorDetail.code || 'INTERNAL_SERVER_ERROR',
            errorDetail.statusCode,
        );
    }
}