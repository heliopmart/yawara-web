import { NextRequest } from 'next/server';
import { handle_error } from '@/utils/error'
import { getCookie } from '@/utils/cookie'
import { authService } from '@/lib/services/auth/auth.service'
import { ALLOWED_ROLES } from '@/lib/validations/auth.validation'
import { postCertificateSchema } from '@/lib/validations/certificate.validation'
import { successResponse, errorResponse } from '@/lib/helpers/response';
import { CertificateService } from '@/lib/services/certificate/certificate.service';
import { validateCpf } from '@/utils/handle_validate_cpf'

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

        const bodyValidation = postCertificateSchema.safeParse(body);

        if (!bodyValidation.success) {
            console.error('POST /certificate validation error:', bodyValidation.error);
            throw 'INVALID_REQUEST_DATA';
        }

        if(!validateCpf(body.cpf)){
            throw 'INVALID_CPF';
        }

        const certificateService = new CertificateService(user_data);
        const res = await certificateService.createCertificate(bodyValidation.data);
        return successResponse<boolean>(res, 200);

    } catch (error) {
        console.error('admin/certificates/route.POST error:', error);

        const errorDetail = handle_error(error);
        return errorResponse(
            errorDetail.message,
            errorDetail.code || 'INTERNAL_SERVER_ERROR',
            errorDetail.statusCode,
        );
    }
}
