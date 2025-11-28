import QRCode from 'qrcode';
import { CertificateData, TokenPayload } from '@yawara/types'
import { CertificateRepository } from '@/lib/repository/certificate/certificate.repository'
import { renderToStream } from '@react-pdf/renderer';
import { CertificateDocument } from '@/components/certificates/CertificateDocument';

const BASE_VALIDATION_URL = process.env.BASE_VALIDATION_URL || 'https://yawara.com/docs/certificate';
export class CertificateService {
    private certificateRepository: CertificateRepository;
    private auth: TokenPayload | undefined;

    constructor(auth?: TokenPayload) {
        this.certificateRepository = new CertificateRepository(this.auth);
        this.auth = auth;
    }

    /*
        =========================================================
        ========================== GET ==========================
        =========================================================
    */

    async getCertificateByCode(code: string): Promise<CertificateData> {
        try {
            const certificate = await this.certificateRepository.getCertificateByCode(code);
            return certificate;
        } catch (error) {
            console.error('CertificateService.getCertificateByCode error:', error);
            throw error;
        }
    }

    async getCertificatesByCpf(cpf: string): Promise<CertificateData[]> {
        try {
            const certificates = await this.certificateRepository.getCertificatesByCpf(cpf);
            return certificates;
        } catch (error) {
            console.error('CertificateService.getCertificatesByCpf error:', error);
            throw error;
        }
    }

    async generateCertificate(code: string) {
        const data = await this.certificateRepository.getCertificateByCode(code);

        if (!data) {
            throw 'CERTIFICATE_NOT_FOUND';
        }

        const validationFullUrl = `${BASE_VALIDATION_URL}?code=${data.id}`;
        const qrCodeDataUrl = await QRCode.toDataURL(validationFullUrl, {
            margin: 1,
            color: { dark: '#8a1212', light: '#ffffff' }
        });

        const pdfStream = await this.createPdfStream(data, qrCodeDataUrl);

        return {
            stream: pdfStream,
            filename: `CERTIFICADO-YAWARA-${data.student_name.replace(/\s+/g, '_')}.pdf`
        };
    }


    /*
        =========================================================
        ======================== HANDLE =========================
        =========================================================
    */

    private async createPdfStream(data: CertificateData, qrCodeUrl: string) {
        return await renderToStream(
            <CertificateDocument {...data} qrCodeUrl={qrCodeUrl} />
        );
    }


}