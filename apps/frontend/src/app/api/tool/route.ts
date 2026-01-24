import { NextRequest } from 'next/server';
import { handle_error } from '@/utils/error'
import { getCookie } from '@/utils/cookie'
import { authService } from '@/lib/services/auth/auth.service'
import { ALLOWED_ROLES } from '@/lib/validations/auth.validation'
import { updateToolsSchema, createToolSchema} from '@/lib/validations/tools.validation'
import { successResponse, errorResponse } from '@/lib/helpers/response';
import { ToolsService } from '@/lib/services/tools/tools.service';
import { ToolShowProps} from '@yawara/types';

export async function GET(request: NextRequest) {
    try {
        const user_token = await getCookie('user-session')

        if (!user_token) {
            throw 'UNAUTHORIZED_ERROR';
        }

        const user_data = await authService.getSession(user_token)

        const res = await new ToolsService(user_data).getTools();
       
        return successResponse<ToolShowProps[]>(res, 200);

    } catch (error) {
        console.error('admin/tool/route.GET error:', error);

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
        if (!user_token) {
            throw 'UNAUTHORIZED_ERROR';
        }

        const user_data = await authService.getSession(user_token)
        if (ALLOWED_ROLES.includes(user_data.role) === false) {
            throw 'UNAUTHORIZED_ERROR';
        }

        const body = await request.json();
        const bodyValidation = updateToolsSchema.safeParse(body);

        if (!bodyValidation.success) {
            throw { code: 'INVALID_REQUEST_DATA', message: 'Dados de requisição inválidos' };
        }

        const toolsService = new ToolsService(user_data);
        const res = await toolsService.updateTool(body.toolId, body.data);
       
        return successResponse<boolean>(res, 200);
    }
    catch (error) {
        console.error('admin/tools/route.PATCH error:', error);
        const errorDetail = handle_error(error); 
        return errorResponse(
            errorDetail.message,
            errorDetail.code || 'INTERNAL_SERVER_ERROR',
            errorDetail.statusCode,
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const user_token = await getCookie('user-session')
        if (!user_token) {
            throw 'UNAUTHORIZED_ERROR';
        }
        const user_data = await authService.getSession(user_token)
        if (ALLOWED_ROLES.includes(user_data.role) === false) {
            throw 'UNAUTHORIZED_ERROR';
        }
        const body = await request.json();
        const bodyValidation = createToolSchema.safeParse(body);
        if (!bodyValidation.success) {
            throw { code: 'INVALID_REQUEST_DATA', message: 'Dados de requisição inválidos' };
        }

        const toolsService = new ToolsService(user_data);
        const res = await toolsService.createTool(body.data);
        return successResponse<string>(res, 201);
    }
    catch (error) {
        console.error('admin/tools/route.POST error:', error);
        const errorDetail = handle_error(error); 
        return errorResponse(
            errorDetail.message,
            errorDetail.code || 'INTERNAL_SERVER_ERROR',
            errorDetail.statusCode,
        );
    }
}