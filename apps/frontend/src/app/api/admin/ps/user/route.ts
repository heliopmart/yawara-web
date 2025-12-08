import { NextRequest } from 'next/server';
import { handle_error } from '@/utils/error'
import { successResponse, errorResponse } from '@/lib/helpers/response';
import { getCookie } from '@/utils/cookie'
import { updateCardUserSchema, uidSchema } from '@/lib/validations/ps.validation'
import { ALLOWED_ROLES } from '@/lib/validations/auth.validation'
import { authService } from '@/lib/services/auth/auth.service'
import { PsService } from '@/lib/services/ps/ps.service'
import { AdminUserCardsProgress } from '@yawara/types'

export async function GET(request: NextRequest) {
    try {
        const user_token = await getCookie('user-session')
        const params = request.nextUrl.searchParams;
        const id = params.get('id');

        if (!user_token) {
            throw 'UNAUTHORIZED_ERROR';
        }

        const user_data = await authService.getSession(user_token)

        if (ALLOWED_ROLES.includes(user_data.role) === false) {
            throw 'UNAUTHORIZED_ERROR';
        }

        const uuidValidationResult = uidSchema.optional().safeParse(id);

        if(!uuidValidationResult.success){
            const errorMessage = uuidValidationResult.error.message;
            return errorResponse(errorMessage, 'VALIDATION_ERROR', 400);
        }
    
        const response = await new PsService(user_data).getUserCardsProgress(uuidValidationResult.data);

        return successResponse<AdminUserCardsProgress>(response, 200);

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

export async function PATCH(request: NextRequest) {
    try {
        const user_token = await getCookie('user-session')
        const params = request.nextUrl.searchParams;
        const id = params.get('id');

        if (!user_token) {
            throw 'UNAUTHORIZED_ERROR';
        }

        const user_data = await authService.getSession(user_token)

        if (ALLOWED_ROLES.includes(user_data.role) === false) {
            throw 'UNAUTHORIZED_ERROR';
        }

        const body = await request.json();

        const validationResult = updateCardUserSchema.safeParse(body);
        const uuidValidationResult = uidSchema.safeParse(id);

        if (!validationResult.success) {
            const errorMessage = validationResult.error.message;
            return errorResponse(errorMessage, 'VALIDATION_ERROR', 400);
        }

        if(!uuidValidationResult.success){
            const errorMessage = uuidValidationResult.error.message;
            return errorResponse(errorMessage, 'VALIDATION_ERROR', 400);
        }
    
        const response = await new PsService(user_data).updateCardUser(
            uuidValidationResult.data,
            validationResult.data
        );

        return successResponse<boolean>(response, 200);

    } catch (error) {
        console.error('admin/ps/route.PATCH error:', error);

        const errorDetail = handle_error(error);
        return errorResponse(
            errorDetail.message,
            errorDetail.code || 'INTERNAL_SERVER_ERROR',
            errorDetail.statusCode,
        );
    }
}