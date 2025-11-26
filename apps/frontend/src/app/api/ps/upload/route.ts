import { NextRequest } from 'next/server';
import { handle_error } from '@/utils/error'
import { successResponse, errorResponse } from '@/lib/helpers/response';
import { getCookie } from '@/utils/cookie'
import { authService } from '@/lib/services/auth/auth.service'
import { psFileSchema, psMetadataUploadSchema } from '@/lib/validations/ps.validation'
import { PsService } from '@/lib/services/ps/ps.service'

export async function POST(request: NextRequest) {
    try {
        const user_token = await getCookie('user-session')

        if (!user_token) {
            throw 'UNAUTHORIZED_ERROR';
        }

        const user_data = await authService.getSession(user_token)

        const formData = await request.formData();
        const file = formData.get('file');
        const cardIdRaw = formData.get('card_id');

        const validationFileResult = psFileSchema.safeParse({ file });

        if (!validationFileResult.success) {
            const errorMessage = validationFileResult.error.message;
            console.error('File validation error:', errorMessage);
            throw "FILE_VALIDATION_ERROR";
        }

        const validationMetadataResult = psMetadataUploadSchema.safeParse({
            card_id: cardIdRaw
        });

        if (!validationMetadataResult.success) {
            const errorMessage = validationMetadataResult.error.message;
            console.error('Metadata validation error:', errorMessage);
            throw "FILE_VALIDATION_ERROR";
        }

        const validFile = validationFileResult.data.file;
        const validCardId = validationMetadataResult.data.card_id;

        const uploadFile = await new PsService(user_data).uploadFile(parseInt(validCardId), validFile);

        return successResponse<boolean>(uploadFile, 200);

    } catch (error) {
        console.error('ps/upload/route.POST error:', error);

        const errorDetail = handle_error(error);
        return errorResponse(
            errorDetail.message,
            errorDetail.code || 'INTERNAL_SERVER_ERROR',
            errorDetail.statusCode,
        );
    }
}