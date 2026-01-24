import { NextRequest, NextResponse } from 'next/server';
import { handle_error } from '@/utils/error'
import { errorResponse } from '@/lib/helpers/response';

const PYTHON_SERVICE_YSNA_URL = process.env.PYTHON_SERVICE_YSNA_URL

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'Arquivo não encontrado' }, { status: 400 });
        }

        const forwardData = new FormData();
        forwardData.append('file', file);

        const pythonResponse = await fetch(`${PYTHON_SERVICE_YSNA_URL}/ysna/preview`, {
            method: 'POST',
            body: forwardData,
        });

        if (!pythonResponse.ok) {
            throw new Error('Falha no processamento do Y-SNA');
        }

        const pdfBuffer = await pythonResponse.arrayBuffer();

        return new NextResponse(pdfBuffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': 'attachment; filename="Relatorio_Y-SNA.pdf"',
            },
        });

    } catch (error) {
        console.error('ps/route.GET error:', error);

        const errorDetail = handle_error(error);
        return errorResponse(
            errorDetail.message,
            errorDetail.code || 'INTERNAL_SERVER_ERROR',
            errorDetail.statusCode,
        );
    }
}