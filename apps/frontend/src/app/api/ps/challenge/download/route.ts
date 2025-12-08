import { NextResponse } from 'next/server';
import { handle_error } from '@/utils/error';
import { errorResponse } from '@/lib/helpers/response'; // successResponse não é usado para stream de arquivo
import jwt from 'jsonwebtoken';
import { ChallengeService } from '@/lib/services/challenge/challenge.service';
import { ChallengeDownloadTokenPayload } from '@yawara/types';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('t'); 

    if (!token) return new NextResponse('Missing Token', { status: 400 });

    try {
        const secret = process.env.CHALLENGE_JWT_SECRET;
        
        if (!secret) {
            console.error('CRITICAL: CHALLENGE_JWT_SECRET is not defined');
            throw 'INTERNAL_SERVER_ERROR';
        }

        const payload = jwt.verify(token, secret) as ChallengeDownloadTokenPayload;

        if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
            console.error('CRITICAL: SUPABASE_SERVICE_ROLE_KEY is not defined');
            throw 'INTERNAL_SERVER_ERROR';
        }

        const { stream, filename } = await ChallengeService.generateChallengePdfStream(
            payload,
            token 
        );

        return new NextResponse(stream as any, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${filename}"`,
            },
        });
    
    } catch (error) {
        console.error('ps/route.GET error:', error);

        if (error instanceof jwt.TokenExpiredError) {
             return errorResponse('O link de download expirou.', 'TOKEN_EXPIRED', 401);
        }
        if (error instanceof jwt.JsonWebTokenError) {
             return errorResponse('Link inválido ou corrompido.', 'INVALID_TOKEN', 403);
        }

        const errorDetail = handle_error(error);
        return errorResponse(
            errorDetail.message,
            errorDetail.code || 'INTERNAL_SERVER_ERROR',
            errorDetail.statusCode,
        );
    }
}