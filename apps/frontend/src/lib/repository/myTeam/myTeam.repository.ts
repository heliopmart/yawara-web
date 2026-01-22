import { create_rls_client } from "@/lib/db"
import { getRows, updateRow, callRpc } from '@/utils/bd'
import { TokenPayload, ArtManageProps, TeamNotesHistory, TeamMember, TeamMemberMinify, myTeamDataProps, ArtMinify } from '@yawara/types'


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

    async getTeamMember(): Promise<TeamMember[]> {
        try {
            const res = await callRpc<TeamMember[]>({
                bd: this.bd,
                functionName: 'get_team_members',
                params: { nuclei_id: this.auth.nuclei_id ?? null }
            });

            return res as unknown as TeamMember[];
        }
        catch (err) {
            throw err;
        }
    }

    async getMyTeamDataForNote(type:'ART' | 'ARTTC'): Promise<TeamMemberMinify[]> {
        try {
            const res = await getRows<TeamMemberMinify>({
                table: 'team',
                columns: `
                    id,
                    user: user_id ( id, name ),
                    role,
                    warnings
                `,
                bd: this.bd,
                filters: [{ column: type === 'ART' ? 'art_id' : 'arttc_id', value: null, op: 'is' }, { column: 'nuclei_id', value: this.auth.nuclei_id ?? null, op: 'eq' }],
            })

            return res as TeamMemberMinify[];
        } catch (err) {
            throw err;
        }
    }

    async getArtsActives(): Promise<ArtMinify[]> {
        try {
            const res = await getRows<ArtMinify[]>({
                table: 'arts',
                columns: `id, title`,
                bd: this.bd,
                filters: [{ column: 'status', value: 'ACTIVE', op: 'eq' }, { column: 'nuclei_id', value: this.auth.nuclei_id ?? null, op: 'eq' }],
            })

            return res as ArtMinify[];
        }catch(err){
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

    async createArt(title: string, description: string, members: string[]): Promise<string> {
        try {
            const res = await callRpc<{ id: string }>({
                bd: this.bd,
                functionName: 'create_art',
                params: {
                    title,
                    description,
                    members,
                    nuclei_id: this.auth.nuclei_id ?? null
                }
            });

            return res.data?.id as string;
        }
        catch (err) {
            throw err;
        }
    }

    async createArttc(title: string, members: string[], description: string, art_id: string): Promise<string> {
        try {
            const res = await callRpc<{ id: string }>({
                bd: this.bd,
                functionName: 'create_arttc',
                params: {
                    title,
                    members_team_ids: members,
                    description: description,
                    art_id: art_id,
                }
            });
            return res.data?.id as string;
        }
        catch (err) {
            throw err;
        }
    }

    // ===========================================
    // ================== UPDATE =================
    // ===========================================


    async putWarningUser(team_id: string): Promise<boolean> {
        try {
            const res = await callRpc({
                functionName: "increment_warning",
                params: {
                    target_team_id: team_id,
                    target_nuclei_id: this.auth.nuclei_id ?? null
                },
                bd: this.bd,
            })

            return res.status
        } catch (err) {
            throw err;
        }
    }

    async putBanUser(team_id: string): Promise<boolean> {
        try {
            
            const res = await callRpc({
                functionName: "ban_user_team",
                params: {
                    target_team_id: team_id,
                    target_nuclei_id: this.auth.nuclei_id ?? null
                },
                bd: this.bd,
            })

            return res.status
        } catch (err) {
            throw err;
        }
    }

    async putUserNotes(team_id: TeamNotesHistory['id'], n_social: TeamNotesHistory['n_social'], n_tech: TeamNotesHistory['n_tech']): Promise<boolean> {
        try {
            const res = await callRpc<boolean>({
                bd: this.bd,
                functionName: 'update_team_member_notes',
                params: {
                    team_id,
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
    // ================== FILE ===================
    // ===========================================

    async uploadArtFile(artId: string, file_id: string): Promise<boolean> {
        try {
            const res = await callRpc({
                bd: this.bd,
                functionName: 'update_art_file_id',
                params: {   
                    p_art_id: artId,
                    p_file_id: file_id,
                    p_user_id: this.auth.user_id
                }
            })

            return res.status;
        }
        catch (err) {
            throw err;
        }
    }
    
    async uploadArttcFile(arttcId: string, file_id: string): Promise<boolean> {
        try {
            const res = await callRpc({
                bd: this.bd,
                functionName: 'update_upload_file_arttc',
                params: {   
                    p_arttc_id: arttcId,
                    p_file_id: file_id,
                    p_user_id: this.auth.user_id
                }
            })

            return res.status;
        }
        catch (err) {
            throw err;
        }
    }

    async uploadArttcReportFile(arttcId: string, file_id: string): Promise<boolean> {
        try {
            const res = await callRpc({
                bd: this.bd,
                functionName: 'update_upload_report_arttc',
                params: {   
                    p_arttc_id: arttcId,
                    p_report_file_id: file_id,
                    p_user_id: this.auth.user_id
                }
            })

            return res.status;
        }
        catch (err) {
            throw err;
        }
    }
}