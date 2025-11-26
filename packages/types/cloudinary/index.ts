
// --------------------------------------------
// ---------- CLOUDINATY INTERFACES -----------
// --------------------------------------------

export interface CloudinaryUploadOptions {
    folder?: string;
    /** * O tipo de recurso. 
     * 'image' para fotos.
     * 'raw' para arquivos como PDFs, ZIPs, etc.
     * 'auto' deixa o Cloudinary decidir.
     */
    resourceType?: 'image' | 'raw' | 'video' | 'auto';
    /**
     * O tipo de upload (controle de acesso).
     * 'upload' (padrão): Público e acessível via URL.
     * 'private': Acessível apenas via URLs assinadas (bom para contratos).
     */
    uploadType?: 'upload' | 'private' | 'authenticated';
}

export interface SignedUrlOptions {
    expiresInSeconds: number;

    attachmentName?: string;
}


// --------------------------------------------
// ----------- CLOUDINATY RESPONSE ------------
// --------------------------------------------


export interface UploadFileResponse {
    public_id: string;
    secure_url: string;
}

