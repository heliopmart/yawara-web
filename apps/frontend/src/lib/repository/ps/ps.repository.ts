import { create_rls_client } from "@/lib/db"
import { getRows, updateRow, callRpc } from '@/utils/bd'
import { TokenPayload, ps_full_data, ps_user_cards, UserProgressContext, cards_progress } from '@yawara/types'

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
            const response = await getRows<ps_full_data>({
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

            if (!response) {
                throw 'PS_EDITION_NOT_FOUND'
            }

            return response as ps_full_data;
        } catch (error) {
            console.error('PsRepository.getFullPsEditionAvailable error:', error);

            if (error === 'PS_EDITION_NOT_FOUND') {
                throw error;
            }
            throw 'INTERNAL_SERVER_ERROR';
        }
    }

    async getUserCardsById(): Promise<UserProgressContext> {
        try {
            const response = await getRows<UserProgressContext>({
                table: this.TablePsUserCardsName,
                columns: `id, cards_progress, edition: ps_editions( id, is_active, is_completed )`,
                filters: [{ column: 'user_id', op: 'eq', value: this.auth.user_id}, { column: 'edition.is_active', op: 'eq', value: true}],
                bd: this.bd,
                single: true
            })

            if(!response){
                throw 'PS_USER_CARDS_NOT_FOUND'
            }

            return response as UserProgressContext;
        } catch (error) {
            console.error('PsRepository.getUserCardConfigById error:', error);
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
            const response = await updateRow<Partial<ps_user_cards>>({
                table: this.TablePsUserCardsName,
                data: data,
                where: [{ column: 'user_id', op: 'eq', value: this.auth.user_id }, { column: 'id', op: 'eq', value: id }],
                authBd: this.bd,
            })

            if (!response.success) {
                throw 'PS_USER_CARD_UPDATE_FAILED';
            }

            return response.success
        } catch (error) {
            console.error('PsRepository.updateUserCard error:', error);
            throw error;
        }
    }

    async updateUserChoices(card_id: cards_progress['card_id'], edition_id: ps_user_cards['edition_id'], data: Partial<ps_user_cards>): Promise<boolean> {
        try {
            const response = await callRpc({
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

            if(!response.status){
                throw 'PS_USER_CHOICES_UPDATE_FAILED';
            }

        
            return response.status
        }catch (error) {
            console.error('PsRepository.updateUserChoices error:', error);
            throw error;
        }
    }

     /*
        =========================================================
        ======================= PS CREATE =======================
        =========================================================
    */

    async signupToPsEdition(cards_progress : cards_progress[]): Promise<boolean> {
        try {
            const response = await callRpc({
                functionName: "signup_to_ps_edition",
                params: {
                    p_user_id: this.auth.user_id,
                    p_cards_progress: cards_progress
                },
                bd: this.bd
            })

            if(!response.status){
                throw 'PS_SIGNUP_FAILED';
            }

            return response.status;
        } catch (error) {
            console.error('PsRepository.signupToPsEdition error:', error);
            throw error;
        }
    }
}