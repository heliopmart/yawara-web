import { supabase, supabaseAdmin, create_rls_client } from "@/lib/db"
import { getRows, insertRow } from '@/utils/bd'
import { CertificateData, TokenPayload, CreateCerticatePayload } from '@yawara/types'

export class CertificateRepository {
    private certificateTableName: string = 'certificates'
    private auth: TokenPayload | undefined;
    private bd: ReturnType<typeof create_rls_client> | undefined;
    
    constructor(auth?: TokenPayload) {
        this.auth = auth;
        if (auth?.supabaseToken) {
            console.log('Creating RLS client with auth token');
            this.bd = create_rls_client(auth.supabaseToken);
        }
    }

    private getClient() {
        return this.bd || supabase;
    }

    /*
        =========================================================
        ========================= GET ===========================
        =========================================================
    */

    async getCertificateByCode(code: string): Promise<CertificateData> {
        try {
            const client = supabase; 
            
            const res = await getRows<CertificateData>({
                bd: client,
                columns: `id, course_name, student_name, issue_date, hours, cpf`,
                table: this.certificateTableName,
                filters: [{ column: 'id', op: 'eq', value: code }],
                single: true,
            });

            if (!res) {
                throw 'CERTIFICATE_NOT_FOUND';
            }

            return res as CertificateData;
        } catch (error) {
            console.error('CertificateRepository.getCertificateByCode error:', error);
            throw error;
        }
    }

    async getCertificatesByCpf(cpf: string): Promise<CertificateData[]> {
        try {
            const client = this.getClient();

            const res = await getRows<CertificateData>({
                bd: client,
                table: this.certificateTableName,
                columns: `id, course_name, issue_date`,
                filters: [{ column: 'cpf', op: 'eq', value: cpf }],
            });

            if (!res) {
                throw 'CERTIFICATES_NOT_FOUND';
            }

            return res as CertificateData[];
        } catch (error) {
            console.error('CertificateRepository.getCertificatesByCpf error:', error);
            throw error;
        }
    }

    /*
        =========================================================
        ===================== CREATE ============================
        =========================================================
    */

    async createCertificate(data: CreateCerticatePayload): Promise<boolean> {        
        try {
            if (!this.bd) {
                throw 'RLS_UNAUTHENTICATED_ERROR';
            }

            const res = await insertRow({
                table: this.certificateTableName,
                insertData: {
                    ...data, 
                    is_valid: true, 
                    issue_date: new Date().toISOString() 
                },
                bd: this.bd
                
            });

            if (!res.status) {
                throw 'CERTIFICATE_NOT_CREATED';
            }

            return res.status; 
            // return false
        } catch (error) {
            console.error('CertificateRepository.createCertificate error:', error);
            throw error;
        }
    }
}