import { create_rls_client } from "@/lib/db"
import { getRows, updateRow, callRpc } from '@/utils/bd'
import { TokenPayload, ArttcsGridProps, ArtsGridProps, ArtManageProps, TeamNotesHistory, TeamMember, TeamMemberMinify} from '@yawara/types'

export interface myTeamDataProps {
    art: ArtsGridProps[];
    arttc: ArttcsGridProps[];
    news: [];
    tasks: [];
}

// TODO: Falta criar todas as RPCs necessárias e validar as implementações abaixo

export class MyTeamRepository {
    private auth: TokenPayload;
    private bd: ReturnType<typeof create_rls_client>;

    constructor(auth: TokenPayload) {
        this.auth = auth;
        this.bd = create_rls_client(this.auth?.supabaseToken ?? null);
    }

    // ===========================================
    // =================== GET ===================
    // ===========================================

    async getMyTeamData(): Promise<myTeamDataProps> {
        try {
            const res = await callRpc<myTeamDataProps>({
                bd: this.bd,
                functionName: 'get_my_team_data',
                params: { nuclei_id: this.auth.nuclei_id ?? null }
            });

            return res as unknown as myTeamDataProps;
        } catch (err) {
            throw err;
        }
    }

    async getTeamMember() : Promise<TeamMember[]> {
        try {
            const res = await callRpc<TeamMember[]>({
                bd: this.bd,
                functionName: 'get_team_members',
                params: { nuclei_id: this.auth.nuclei_id ?? null }
            });
            
            return res as unknown  as TeamMember[];
        }
        catch (err) {
            throw err;
        }
    }

    async getMyTeamDataForNote() : Promise<TeamMemberMinify[]>{
        try {
            // const res = await callRpc<any[]>({
            //     bd: this.bd,
            //     functionName: 'get_my_team_data_for_note',
            //     params: {}
            // });

            const res = await getRows<TeamMemberMinify>({
                table: 'team',
                columns: `
                    id,
                    user: user_id ( id, name ),
                    role,
                    warnings
                `,
                bd: this.bd,
                filters: [{column: 'art_id', value: null, op: 'eq'}, {column: 'nuclei_id', value: this.auth.nuclei_id ?? null, op: 'eq'}],
            })

            return res as TeamMemberMinify[];
        } catch (err) {
            throw err;
        }
    }

    async getArt(artId: string): Promise<ArtManageProps> {
        try {
            const res = await callRpc<ArtManageProps>({
                bd: this.bd,
                functionName: 'get_art_manage_props',
                params: { art_id: artId }
            });
            return res as unknown as ArtManageProps;
        }
        catch (err) {
            throw err;
        }
    }

    async getArttc(arttcId: string): Promise<ArtManageProps> {
        try {
            const res = await callRpc<ArtManageProps>({
                bd: this.bd,
                functionName: 'get_arttc_manage_props',
                params: { arttc_id: arttcId }
            });
            return res as unknown as ArtManageProps;
        }
        catch (err) {
            throw err;
        }
    }

    // ===========================================
    // ================== CREATE =================
    // ===========================================

    async createArt(title: string, description: string, file: File, members: string[]) : Promise<boolean> {
        try {
            const res = await callRpc<any>({
                bd: this.bd,
                functionName: 'create_art',
                params: {
                    title,
                    description,
                    file,
                    members,
                    nuclei_id: this.auth.nuclei_id ?? null
                }
            });
            return res.status;
        }
        catch (err) {
            throw err;
        }
    }

    async createArttc(title: string, file: File, members: string[]) : Promise<boolean> {
        try {
            const res = await callRpc<any>({
                bd: this.bd,
                functionName: 'create_arttc',
                params: {
                    title,
                    file,
                    members,
                    nuclei_id: this.auth.nuclei_id ?? null
                }
            });
            return res.status;
        }
        catch (err) {
            throw err;
        }
    }

    // ===========================================
    // ================== UPDATE =================
    // ===========================================


    async uploadReportArt(artId: string, file: File): Promise<boolean> {
        try {
            const res = await callRpc<boolean>({
                bd: this.bd,
                functionName: 'upload_report_art',
                params: {
                    art_id: artId,
                    file
                }
            });
            return res as unknown as boolean;
        }
        catch (err) {
            throw err;
        }
    }


    async putWarningUser(user_id: string): Promise<boolean> {
        try {
            const res = await updateRow({
                table: 'team_members',
                data: { user_id: user_id, warning: true },
                where: [{ column: 'user_id', value: user_id, op: 'eq' }],
                authBd: this.bd,
            })

            return res.success
        } catch (err) {
            throw err;
        }
    }

    async putBanUser(user_id: string): Promise<boolean> {
        try {
            const res = await updateRow({
                table: 'team_members',
                data: { user_id: user_id, banned: true },
                where: [{ column: 'user_id', value: user_id, op: 'eq' }],
                authBd: this.bd,
            })

            return res.success
        } catch (err) {
            throw err;
        }
    }

    async putUserNotes(user_id: TeamNotesHistory['id'], n_social: TeamNotesHistory['n_social'], n_tech: TeamNotesHistory['n_tech']): Promise<boolean> {
        try {
            const res = await callRpc<boolean>({
                bd: this.bd,
                functionName: 'update_team_member_notes',
                params: {
                    user_id,
                    n_social,
                    n_tech
                }
            });
            return res as unknown as boolean;
        }
        catch (err) {
            throw err;
        }
    }

    // ===========================================
    // =============== VALIDATION ================
    // ===========================================

    async handleValidationUploadReportArt(user_id: string): Promise<boolean> {
        try {
            const res = await callRpc<boolean>({
                bd: this.bd,
                functionName: 'validate_upload_report_art_permission',
                params: {
                    user_id
                }
            });
            return res as unknown as boolean;
        }
        catch (err) {
            throw err;
        }
    }
}