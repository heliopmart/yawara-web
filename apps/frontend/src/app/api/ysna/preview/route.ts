import { NextRequest, NextResponse } from 'next/server';
import { handle_error } from '@/utils/error'
import { errorResponse } from '@/lib/helpers/response';

const PYTHON_SERVICE_YSNA_URL = process.env.PYTHON_SERVICE_YSNA_URL

export async function POST(req: NextRequest) {
    try {
        if (!PYTHON_SERVICE_YSNA_URL) {
            throw 'YSNA-SERVER-NOT-FOUND';
        }

        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'Arquivo não encontrado' }, { status: 400 });
        }

        const forwardData = new FormData();
        forwardData.append('file', file);

        const headers: HeadersInit = {};
        
        if (process.env.YSNA_INTERNAL_TOKEN) {
            headers["X-YSNA-INTERNAL-TOKEN"] = process.env.YSNA_INTERNAL_TOKEN;
        }

        const pythonResponse = await fetch(`${PYTHON_SERVICE_YSNA_URL}/ysna/preview`, {
            method: 'POST',
            body: forwardData,
            headers
        });

        if (!pythonResponse.ok) {
            return NextResponse.json({ error: 'Falha no processamento neural' }, { status: 500 });
        }

        return new NextResponse(pythonResponse.body, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': 'attachment; filename="Relatorio_Y-SNA.pdf"',
                'Content-Length': pythonResponse.headers.get('Content-Length') || '',
            },
        });

    } catch (error) {
        console.error('admin/tools/route.PATCH error:', error);
        const errorDetail = handle_error(error);
        return errorResponse(
            errorDetail.message,
            errorDetail.code || 'INTERNAL_SERVER_ERROR',
            errorDetail.statusCode,
        );
    }
}