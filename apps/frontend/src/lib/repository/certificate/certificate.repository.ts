import { supabase, create_rls_client } from "@/lib/db"
import { getRows, updateRow, callRpc } from '@/utils/bd'
import { CertificateData, TokenPayload } from '@yawara/types'

export class CertificateRepository {
    private certificateTableName: string = 'certificates'
    private auth: TokenPayload | undefined;
    private bd: ReturnType<typeof create_rls_client> | undefined;
    
    constructor(auth?: TokenPayload) {
        this.auth = auth;
        if(auth){
            this.bd = create_rls_client(auth.supabaseToken ?? null);
        }
    }
    /*
        =========================================================
        ======================== PS GET =========================
        =========================================================
    */

    async getCertificateByCode(code: string): Promise<CertificateData> {
        try {
            const bd = supabase;
            const res = await getRows<CertificateData>({
                bd: bd,
                columns: `
                    id, 
                    course_name,
                    student_name,
                    issue_date,
                    hours,
                    cpf
                `,
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
            const bd = this.bd || supabase;
            const res = await getRows<CertificateData>({
                bd: bd,
                table: this.certificateTableName,
                columns: `
                    id, 
                    course_name,
                    issue_date
                `,
                filters: [{ column: 'cpf', op: 'eq', value: cpf }],
            });

            if(!res){
                throw 'CERTIFICATES_NOT_FOUND';
            }

            return res as CertificateData[];
        } catch (error) {
            console.error('CertificateRepository.getCertificatesByCpf error:', error);
            throw error;
        }
    }
}