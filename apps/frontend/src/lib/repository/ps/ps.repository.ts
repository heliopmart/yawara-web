import { create_rls_client, supabaseAdmin } from "@/lib/db"
import { getRows, updateRow, callRpc } from '@/utils/bd'
import { TokenPayload, ps_full_data, ps_card_configs, ps_user_cards, UserProgressContext, cards_progress, AdminUserCardsProgress, ps_editions, PsEditionAvailable, createPsEdition, BatchPresenceItem, DashboardPresenceResponse, processRegistrationClosingResponse, downloadChanllengeData, BatchNotesItem} from '@yawara/types'

export class PsRepository {
    private TablePsEditionName = 'ps_editions';
    private TablePsUserCardsName = 'ps_user_cards';
    private auth: TokenPayload;
    private bd: ReturnType<typeof create_rls_client>;

    constructor(auth: TokenPayload) {
        this.auth = auth;
        this.bd = create_rls_client(this.auth?.supabaseToken ?? null);
    }

    /*
        =========================================================
        ======================== PS GET =========================
        =========================================================
    */

    async getFullPsEditionAvailable(): Promise<ps_full_data> {
        try {
            const res = await getRows<ps_full_data>({
                table: this.TablePsEditionName,
                columns: `
                    *,
                    ps_card_configs: ps_card_configs!ps_card_configs_edition_id_fkey ( * ),
                    ps_user_cards: ps_user_cards!user_applications_edition_id_fkey ( * )
                `,
                filters: [{ column: 'is_active', op: 'eq', value: true }, { column: 'ps_user_cards.user_id', op: 'eq', value: this.auth.user_id }],
                single: true,
                bd: this.bd,
            })


            if (!res) {
                throw 'PS_EDITION_NOT_FOUND'
            }

            return res as ps_full_data;
        } catch (error) {
            console.error('PsRepository.getFullPsEditionAvailable error:', error);

            if (error === 'PS_EDITION_NOT_FOUND') {
                throw error;
            }
            throw 'INTERNAL_SERVER_ERROR';
        }
    }

    async getPsCardConfigById(card_id: ps_card_configs['card_id']): Promise<ps_card_configs> {
        try {
            const res = await callRpc({
                functionName: "get_active_ps_card_config",
                params: {
                    p_card_id: card_id
                },
                bd: this.bd
            })
            if (!res.status) {
                throw 'PS_CARD_CONFIG_NOT_FOUND'
            }
            return res.data as ps_card_configs;
        }
        catch (error) {
            console.error('PsRepository.getPsCardConfigById error:', error);
            throw error;
        }
    }

    async getUserCardsById(): Promise<UserProgressContext> {
        try {
            const res = await getRows<UserProgressContext>({
                table: this.TablePsUserCardsName,
                columns: `id, cards_progress, edition: ps_editions( id, is_active, is_completed )`,
                filters: [{ column: 'user_id', op: 'eq', value: this.auth.user_id }, { column: 'edition.is_active', op: 'eq', value: true }],
                bd: this.bd,
                single: true
            })

            if (!res) {
                throw 'PS_USER_CARDS_NOT_FOUND'
            }

            return res as UserProgressContext;
        } catch (error) {
            console.error('PsRepository.getUserCardConfigById error:', error);
            throw error;
        }
    }

    async getUserCardsProgress(user_id?: string): Promise<AdminUserCardsProgress> {
        try {
            const res = await getRows<AdminUserCardsProgress>({
                table: this.TablePsUserCardsName,
                columns: `id, cards_progress, nuclei_eligible, nuclei_chosen`,
                filters: user_id ? [{ column: 'user_id', op: 'eq', value: user_id }, { column: 'is_eligible', op: 'eq', value: true }] : [{ column: 'is_eligible', op: 'eq', value: true }],
                bd: this.bd,
                single: true
            })

            if (!res) {
                throw 'PS_USER_CARDS_NOT_FOUND'
            }

            return res as AdminUserCardsProgress;
        } catch (error) {
            console.error('PsRepository.getUserCardsProgress error:', error);
            throw error;
        }
    }

    async getPsEditions(edition_id?: ps_editions['id']): Promise<PsEditionAvailable> {
        try {
            const res = await getRows<PsEditionAvailable>({
                table: this.TablePsEditionName,
                columns: `id, is_active, start_date, finish_date, final_result_doc, is_completed, registration_closing`,
                filters: edition_id ? [{ column: 'id', op: 'eq', value: edition_id }] : [{ column: 'is_active', op: 'eq', value: true }],
                bd: this.bd,
                single: true
            })

            if (!res) {
                throw 'PS_EDITION_NOT_FOUND'
            }

            return res as PsEditionAvailable
        } catch (error) {
            console.error('PsRepository.getPsEditions error:', error);
            throw error;
        }
    }

    async getPsUserPresence(): Promise<DashboardPresenceResponse> {
        try {
            const res = await callRpc<DashboardPresenceResponse>({
                functionName: "get_ps_candidate_data",
                params: {},
                bd: this.bd
            })

            if(!res.status){
                throw 'PS_USER_PRESENCE_NOT_FOUND'
            }

            return res.data as DashboardPresenceResponse;
        } catch (error) {
            console.error('PsRepository.getPsUserPresence error:', error);
            throw error;
        }
    }

    static async getChallengeDataForDownload(challenge_id: string, edition_id: string, user_id: string): Promise<downloadChanllengeData> {
        try {
            const res = await callRpc<downloadChanllengeData[]>({
                functionName: "get_challenge_download_data",
                params: {
                    p_user_id: user_id,
                    p_edition_id: edition_id,
                    p_challenge_id: challenge_id
                },
                bd: supabaseAdmin
            })

            if (!res.status) {
                throw 'CHALLENGE_DATA_NOT_FOUND';
            }

            return res.data?.[0] as downloadChanllengeData;
        } catch (error) {
            console.error('PsRepository.getChallengeDataForDownload error:', error);
            throw error;
        }
    }

    /*
        =========================================================
        ======================= PS UPDATE =======================
        =========================================================
    */

    async updateUserCard(id: ps_user_cards['id'], data: Partial<ps_user_cards>): Promise<boolean> {
        try {
            const res = await updateRow<Partial<ps_user_cards>>({
                table: this.TablePsUserCardsName,
                data: data,
                where: [{ column: 'user_id', op: 'eq', value: this.auth.user_id }, { column: 'id', op: 'eq', value: id }],
                authBd: this.bd,
            })

            if (!res.success) {
                throw 'PS_USER_CARD_UPDATE_FAILED';
            }

            return res.success
        } catch (error) {
            console.error('PsRepository.updateUserCard error:', error);
            throw error;
        }
    }

    async updateUserChoices(card_id: cards_progress['card_id'], edition_id: ps_user_cards['edition_id'], data: Partial<ps_user_cards>): Promise<boolean> {
        try {
            const res = await callRpc({
                functionName: "update_ps_step_and_choices",
                params: {
                    p_user_id: this.auth.user_id,
                    p_edition_id: edition_id,
                    p_nuclei_chosen: data.nuclei_chosen,
                    p_card_id: card_id,
                    p_new_state: 'COMPLETED'
                },
                bd: this.bd
            })

            if (!res.status) {
                throw 'PS_USER_CHOICES_UPDATE_FAILED';
            }


            return res.status
        } catch (error) {
            console.error('PsRepository.updateUserChoices error:', error);
            throw error;
        }
    }

    async updateAdminUserCard(uuid: ps_user_cards['id'], data: Partial<ps_user_cards>): Promise<boolean> {
        try {
            const res = await updateRow<Partial<ps_user_cards>>({
                table: this.TablePsUserCardsName,
                data: data,
                where: [{ column: 'id', op: 'eq', value: uuid }],
                authBd: this.bd,
            })

            if (!res.success) {
                throw 'PS_USER_CARD_UPDATE_FAILED';
            }
            return res.success;
        } catch (error) {
            console.error('PsRepository.updateUserCard error:', error);
            throw error;
        }
    }

    async updatePsEdition(data: Partial<ps_editions>, uuid?: ps_editions['id']): Promise<boolean> {
        try {
            const res = await updateRow<Partial<ps_editions>>({
                table: this.TablePsEditionName,
                data: data,
                where: uuid ? [{ column: 'id', op: 'eq', value: uuid }] : [],
                authBd: this.bd,
            })
            if (!res.success) {
                throw 'PS_EDITION_UPDATE_FAILED';
            }
            return res.success;
        } catch (error) {
            console.error('PsRepository.updatePsEdition error:', error);
            throw error;
        }
    }

    async updateBatchPresence(updates: BatchPresenceItem[]): Promise<boolean> {
        try {
            const res = await callRpc({
                functionName: "update_batch_presence",
                params: {
                    p_updates: updates
                },
                bd: this.bd
            });
            return res.status;
        } catch (error) {
            console.error('PsRepository.updateBatchPresence error:', error);
            throw error;
        }
    }

    
    async updateBatchScores(updates: BatchNotesItem[]): Promise<boolean> {
        try{
            const res = await callRpc({
                functionName: "update_batch_notes",
                params: {
                    p_updates: updates
                },
                bd: this.bd
            })
            return res.status
        }catch(error){
            console.error('PsRepository.updateBatchScores error:', error);
            throw error;
        }
    }


    async PsRegistrationClose(difficulty: string): Promise<boolean> {
        try {
            const res = await callRpc({
                functionName: "process_registration_closing",
                params: {
                    p_difficulty: difficulty
                },
                bd: this.bd
            });
            return res.status;
        }catch (err){
            throw err;
        }
    }

    async psFinishEdition(): Promise<boolean> {
        try {
            const res = await callRpc({
                functionName: "finish_ps_edition",
                params: {},
                bd: this.bd
            });
            return res.status;
        } catch (err){
            throw err;
        }
    }

    async setChanllengesForCandidates(difficulty : string) : Promise<processRegistrationClosingResponse []> {
        try {
            const res = await callRpc<processRegistrationClosingResponse []>({
                functionName: "allocate_challenges_to_eligible",
                params: {p_difficulty: difficulty},
                bd: this.bd
            })

            if(!res.status ){
                throw 'PS_CHALLENGE_ALLOCATION_FAILED';
            }

            return res.data as processRegistrationClosingResponse [];
        }catch (err){
            throw err;
        }
    }

    /*
       =========================================================
       ======================= PS CREATE =======================
       =========================================================
   */

    async signupToPsEdition(cards_progress: cards_progress[]): Promise<boolean> {
        try {
            const res = await callRpc({
                functionName: "signup_to_ps_edition",
                params: {
                    p_user_id: this.auth.user_id,
                    p_cards_progress: cards_progress
                },
                bd: this.bd
            })

            if (!res.status) {
                throw 'PS_SIGNUP_FAILED';
            }

            return res.status;
        } catch (error) {
            console.error('PsRepository.signupToPsEdition error:', error);
            throw error;
        }
    }

    async createPsEdition(data: createPsEdition): Promise<string> {

        try {
            const res = await callRpc({
                functionName: "create_ps_edition",
                params: {
                    p_name: data.name,
                    p_start_date: data.start_date,
                    p_finish_date: data.finish_date,
                    p_registration_closing: data.registration_closing,
                    p_cards_list: data.cards_config
                },
                bd: this.bd
            })

            if (!res.status) {
                throw 'PS_EDITION_CREATION_FAILED';
            }
            return res.data as string;
        } catch (error) {
            console.error('PsRepository.createPsEdition error:', error);
            throw error;
        }
    }
}