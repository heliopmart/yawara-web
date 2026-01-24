import { NextRequest, NextResponse } from 'next/server';
import { CloudinaryService } from '@/lib/services/cloudinary/cloudinary.service';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const publicId = searchParams.get('publicId');
    const name = searchParams.get('name') || 'documento_yawara';

    if (!publicId) return new NextResponse('ID ausente', { status: 400 });

    try {
        const signedUrl = await CloudinaryService.getDownloadUrl(publicId, name, 'raw');

        const response = await fetch(signedUrl);

        if (!response.ok) throw new Error('Falha ao buscar no Cloudinary');

        const data = await response.arrayBuffer();

        return new NextResponse(data, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${name}.pdf"`,
            },
        });
    } catch (error) {
        console.error("Erro no Pipe de download:", error);
        return new NextResponse('Erro no processamento do arquivo', { status: 500 });
    }
}