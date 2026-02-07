import { NextRequest, NextResponse } from 'next/server';
import { handle_error } from '@/utils/error'
import { errorResponse } from '@/lib/helpers/response';
import { YsnaService } from '@/lib/services/ysna/ysna.service';

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'Arquivo não encontrado' }, { status: 400 });
        }
        const ysnaService = new YsnaService();
        
        const pythonResponse = await ysnaService.getPreview(file);

        return new NextResponse(pythonResponse.body, {
            status: 200,
            headers: {
                'Content-Type': 'application/x-ndjson', 
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            },
        });

    } catch (error) {
        console.error('ysna/preview/route.POST error:', error);
        const errorDetail = handle_error(error);
        return errorResponse(
            errorDetail.message,
            errorDetail.code || 'INTERNAL_SERVER_ERROR',
            errorDetail.statusCode,
        );
    }
}