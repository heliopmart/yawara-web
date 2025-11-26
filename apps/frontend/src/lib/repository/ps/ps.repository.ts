import {create_rls_client} from  "@/lib/db"
import { getRows } from '@/utils/bd'
import { TokenPayload, ps_full_data } from '@yawara/types'

export class PsRepository {
    private TablePsEditionName = 'ps_editions';
    private auth : TokenPayload;
    private bd: ReturnType<typeof create_rls_client>;
    
    constructor(auth: TokenPayload) {
        this.auth = auth;
        this.bd = create_rls_client(this.auth?.supabaseToken ?? null);
    }

    async getFullPsEditionAvailable(): Promise<ps_full_data> {
        try {
            const response = await getRows<ps_full_data>({
                table: this.TablePsEditionName,
                columns: `
                    *,
                    ps_card_configs: ps_card_configs!ps_card_configs_edition_id_fkey ( * ),
                    ps_user_cards: ps_user_cards!user_applications_edition_id_fkey ( * )
                `,
                filters: [{column: 'is_active', op: 'eq', value: true}, {column: 'ps_user_cards.user_id', op: 'eq', value: this.auth.user_id}],
                single: true,
                bd: this.bd,
            })

            if(!response){
                throw 'PS_EDITION_NOT_FOUND'
            }

            return response as ps_full_data;
        }catch (error) {
            console.error('PsRepository.getFullPsEditionAvailable error:', error);

            if(error === 'PS_EDITION_NOT_FOUND'){
                throw error;
            }
            throw 'INTERNAL_SERVER_ERROR';
        }
    }
}