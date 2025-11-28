import { NextRequest } from 'next/server';
import { setCookie } from '@/utils/cookie'
import {handle_error} from '@/utils/error'
import { successResponse, errorResponse } from '@/lib/helpers/response';
import { loginSchema } from '@/lib/validations/auth.validation'
import { authService } from '@/lib/services/auth/auth.service'
import { SignJWT } from 'jose'

const SECRET = process.env.JWT_SECRET_USER_ROLE || ''

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        if (loginSchema.safeParse(body).success === false) {
            return errorResponse(
                'Dados de entrada inválidos.',
                'VALIDATION_ERROR',
                400,
            );
        }

        const res_token = await authService.login(body);

        await setCookie('user-session', res_token.token, { maxAge: 60 * 60 });
        await setCookie('user_role_secure', await new SignJWT({ role: res_token.role })
            .setProtectedHeader({ alg: 'HS256' })
            .setExpirationTime('1h')
            .sign(new TextEncoder().encode(SECRET)), { maxAge: 60 * 60 });
        
        const response = successResponse<boolean>(true, 200);
        return response;

    } catch (error) {
        const errorDetail = handle_error(error);
        return errorResponse(
            errorDetail.message,
            errorDetail.code || 'INTERNAL_SERVER_ERROR',
            errorDetail.statusCode,
        );
    }
}