import { UploadFileResponse, CloudinaryUploadOptions, SignedUrlOptions } from '@yawara/types'
import { cloudinary } from '@/lib/cloudinary'


export class CloudinaryService {
    /**
     * Uploads a file buffer to Cloudinary using a stream.
     * @param file - The file object from Multer.
     * @param options - As opções de upload, incluindo pasta, tipo de recurso e tipo de acesso.
     * @returns A promise that resolves with the public ID and secure URL of the uploaded file.
     */
    static async upload(
        file: File,
        options: CloudinaryUploadOptions
    ): Promise<UploadFileResponse> {

        const resourceType = options.resourceType || 'auto';
        const uploadType = options.uploadType || 'upload';

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        return new Promise((resolve, reject) => {
            try {
                const uploadStream: NodeJS.WritableStream = cloudinary.uploader.upload_stream(
                    {
                        folder: options.folder,         // Usa a pasta das opções
                        resource_type: resourceType,    // 'raw' para PDFs, 'image' para fotos
                        type: uploadType,               // 'private'
                    },
                    (
                        error: any,
                        result: any
                    ) => {
                        if (error) {
                            return reject(error);
                        }
                        if (result) {
                            resolve({
                                public_id: result.public_id,
                                secure_url: result.secure_url,
                            });
                        } else {
                            reject(new Error('Cloudinary upload resulted in an undefined result.'));
                        }
                    }
                );
                uploadStream.end(buffer);

            } catch (error) {
                reject(new Error(`Failed to upload file to Cloudinary: ${error instanceof Error ? error.message : 'Unknown error'}`));
            }
        });
    }

    /**
     * Deletes a single resource from Cloudinary.
     * @param public_id - The public ID of the resource to delete.
     * @param resourceType - O tipo de recurso a ser deletado ('image', 'raw', etc.).
     */
    static async destroyOne(public_id: string, resourceType: 'image' | 'raw' | 'video' = 'image'): Promise<void> {
        if (!public_id) {
            return;
        }

        try {
            await cloudinary.uploader.destroy(public_id, {
                resource_type: resourceType
            });
        } catch (error) {
            console.error(`Failed to delete resource ${public_id} from Cloudinary:`, error);
            throw error;
        }
    }

    /**
     * @param resourceType - O tipo de recurso ('raw' para PDF, 'image' para fotos).
     * @param options - Opções, como tempo de expiração e nome do anexo.
     * @returns Uma string de URL assinada e válida pelo tempo especificado.
     */
    static getPrivateDownloadUrl(
        public_id: string,
        resourceType: 'raw' | 'image' | 'video',
        options: SignedUrlOptions
    ): string {
        const expirationTimestamp = Math.floor(Date.now() / 1000) + options.expiresInSeconds;
        const signOptions: any = {
            resource_type: resourceType,
            type: 'private',
            expires_at: expirationTimestamp,
        };

        if (options.attachmentName) {
            signOptions.attachment = options.attachmentName;
        }

        //// @ts-expect-error A definição de tipos @types/cloudinary está incorreta para private_download_url
        return cloudinary.utils.private_download_url(
            public_id,
            'pdf',
            signOptions
        );
    }

    static async getDownloadUrl(
        public_id: string,
        fileName: string,
        resourceType: 'raw' | 'image' | 'video'
    ): Promise<string> {
        try {
            const finalFileName = fileName.toLowerCase().endsWith('.pdf')
                ? fileName
                : `${fileName}.pdf`;

            const url = cloudinary.url(public_id, {
                resource_type: resourceType,
                type: 'upload',
                sign_url: true,
                content_disposition: `attachment; filename="${finalFileName}"`,
                expires_at: Math.floor(Date.now() / 1000) + 3600
            });
            return url;
        } catch (error) {
            console.error('Failed to generate signed URL:', error);
            throw error;
        }
    }

    /**
     * Deletes multiple resources from Cloudinary using their public IDs.
     * @param publicIds - An array of public IDs to delete.
     * @param resourceType - O tipo de recurso a ser deletado ('image', 'raw', etc.).
     */
    static async destroyMany(publicIds: string[], resourceType: 'image' | 'raw' | 'video' = 'image'): Promise<void> {
        if (!publicIds || publicIds.length === 0) {
            return;
        }

        try {
            await cloudinary.api.delete_resources(publicIds, {
                resource_type: resourceType
            });
        } catch (error) {
            console.error('Failed to delete resources from Cloudinary:', error);
            throw error;
        }
    }
}