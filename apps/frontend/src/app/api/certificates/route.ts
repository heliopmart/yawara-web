import { NextRequest } from 'next/server';
import { handle_error } from '@/utils/error'
import { successResponse, errorResponse } from '@/lib/helpers/response';
import { CertificateService } from '@/lib/services/certificate/certificate.service';
import { CertificateData } from '@yawara/types'
import { validateCpf } from '@/utils/handle_validate_cpf'

export async function GET(request: NextRequest) {
    try {
        const params = request.nextUrl.searchParams;
        const cpf = params.get('cpf');

        if (!cpf) {
            throw 'CPF_REQUIRED';
        }

        const isValid = validateCpf(cpf);
        if (!isValid.valid) {
            throw 'CPF_INVALID';
        }

        const res = await new CertificateService().getCertificatesByCpf(cpf);
        
        if(res.length === 0){
            throw 'USER_DONT_HAVE_CERTIFICATES';
        }
        
        return successResponse<CertificateData[]>(res, 200);

    } catch (error) {
        console.error('certificate/route.GET error:', error);

        const errorDetail = handle_error(error);
        return errorResponse(
            errorDetail.message,
            errorDetail.code || 'INTERNAL_SERVER_ERROR',
            errorDetail.statusCode,
        );
    }
}
