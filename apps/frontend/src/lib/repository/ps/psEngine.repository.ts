import { supabaseAdmin, create_rls_client } from "@/lib/db/index"
import { callRpc, getRows} from '@/utils/bd/'
import { SelectionProcessEngineData, TokenPayload, ReportPayload } from '@yawara/types'

export class PsEngineRepository {
    private bd: typeof supabaseAdmin;
    private auth?: TokenPayload;

    constructor(auth?: TokenPayload) {
        this.auth = auth;
        
        if(!auth) {
            this.bd = supabaseAdmin
        }
        else {
            this.bd = create_rls_client(this.auth?.supabaseToken ?? null);
        }
    }

    /*
    =========================================================
    ======================== PS GET =========================
    =========================================================
    */

    async getPsEngine(): Promise<SelectionProcessEngineData> {
        try {
            const res = await callRpc<any>({
                bd: this.bd,
                functionName: 'get_active_ps_selection_data',
                params: {}
            })

            if (!res.status) {
                throw 'ERROR_FETCHING_PS_ENGINE'
            }

            if (!res.data?.error) {
                throw res.data?.error
            }

            return res.data as SelectionProcessEngineData
        } catch (error) {
            throw error
        }
    }

    async getYsnaReportData(candidate_id: string): Promise<string> {
        try {
            const res = await getRows({
                bd: this.bd,
                table: 'ps_user_cards',
                columns: `final_result_doc`,
                filters: [{ column: 'candidate_id', op: 'eq', value: candidate_id }],
                single: true            
            })

            if(!res.final_result_doc){
                throw 'DOCUMENT_NOT_FOUND';
            }

            return res.final_result_doc;
        }catch (error) {
            throw error
        }
    }

    async getDataForReport(ps_edition_id: string): Promise<ReportPayload> {
        if(!this.auth) {
            throw 'AUTH_REQUIRED_FOR_PS_REPORT_DATA'
        }
        
        try {
            const res = await callRpc<ReportPayload>({
                bd: this.bd,
                functionName: 'get_candidate_report_data',
                params: {
                    p_edition_id: ps_edition_id,
                    p_user_id: this.auth?.user_id
                }
            })
            if (!res.status) {
                throw 'ERROR_FETCHING_PS_REPORT_DATA'
            }
            return res.data as ReportPayload
        }
        catch (error) {
            throw error
        }
    }

    /*
    =========================================================
    ======================= PS UPDATE =======================
    =========================================================
    */

    async executeSelectionResultsUpdate(
        editionId: string,
        candidateUpdates: { id: string; is_accepted: boolean, score: number }[],
        nucleusUpdates: { id: string; open_vacancies: number; new_members_count: number }[]
    ): Promise<boolean> {
        try {
            const res = await callRpc<boolean>({
                functionName: "update_ps_final_results_v2",
                params: {
                    candidate_updates: candidateUpdates,
                    nucleus_updates: nucleusUpdates,
                    active_edition_id: editionId
                },
                bd: this.bd
            })

            if (!res.status) {
                throw 'ERROR_UPDATING_PS_ENGINE_RESULTS'
            }

            return res.data as boolean
        } catch (error) {
            throw error
        }
    }
}