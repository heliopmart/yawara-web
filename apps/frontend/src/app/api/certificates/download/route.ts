import { NextRequest, NextResponse } from 'next/server';
import { handle_error } from '@/utils/error'
import { errorResponse } from '@/lib/helpers/response';
import { CertificateService } from '@/lib/services/certificate/certificate.service';

function removeAccents(str: string) {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}


export async function GET(request: NextRequest) {
    try {
        const params = request.nextUrl.searchParams;
        const id = params.get('id');

        if (!id) {
            throw 'MISSING_CERTIFICATE_ID';
        }

        const { stream, filename } = await new CertificateService().generateCertificate(id);

        const headers = new Headers();
        const asciiFilename = removeAccents(filename).replace(/[^\x20-\x7E]/g, "");

        const encodedFilename = encodeURIComponent(filename);
        headers.set('Content-Type', 'application/pdf');
        headers.set(
            'Content-Disposition',
            `attachment; filename="${asciiFilename}"; filename*=UTF-8''${encodedFilename}`
        );

        return new NextResponse(stream as any, {
            status: 200,
            headers
        });
    } catch (error) {
        console.error('certificate/download/route.GET error:', error);

        const errorDetail = handle_error(error);
        return errorResponse(
            errorDetail.message,
            errorDetail.code || 'INTERNAL_SERVER_ERROR',
            errorDetail.statusCode,
        );
    }
}
