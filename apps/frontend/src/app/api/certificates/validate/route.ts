import { NextRequest } from 'next/server';
import { handle_error } from '@/utils/error'
import { successResponse, errorResponse } from '@/lib/helpers/response';
import { CertificateService } from '@/lib/services/certificate/certificate.service';
import { CertificateData } from '@yawara/types'

export async function GET(request: NextRequest) {
    try {
        const params = request.nextUrl.searchParams;
        const code = params.get('code');

        if (!code) {
            throw 'CERTIFICATE_CODE_MISSING';
        }

        const res = await new CertificateService().getCertificateByCode(code);

        return successResponse<CertificateData>(res, 200);

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
