import { create_rls_client, supabase } from "@/lib/db"
import { getRows, updateRow, callRpc } from '@/utils/bd'
import { TokenPayload, PsEditionAndNucleiConfigs, UpdateNucleiConfigData, NucleiRepositoryFactory, NucleiShowProps} from '@yawara/types'

export class NucleiRepository {
    private auth?: TokenPayload;
    private bd: ReturnType<typeof create_rls_client>;

    constructor(auth?: TokenPayload) {
        this.auth = auth;
        if(auth){
            this.bd = create_rls_client(this.auth?.supabaseToken ?? null);
        }else{
            this.bd = supabase;
        }
    }


    /*
        =========================================================
        ========================  GET ===========================
        =========================================================
    */

    async getActivePsEditionAndNucleiConfigs() : Promise<PsEditionAndNucleiConfigs> {
        try{
            // const res = await getRows({
            //     bd: this.bd,
            //     table: this.TablePsEditionsName,
            //     filters: [{ column: 'is_active', op: 'eq', value: true }, { column: 'nuclei_configs.nuclei.leader', op: 'eq', value: this.auth?.user_id }],
            //     columns: `
            //         id, name, 
            //         nuclei_configs: nuclei_configs!nuclei_configs_ps_edition_id_fkey ( id, open_vacancies, 
            //             nuclei: nuclei ( id, leader ),
            //             nuclei_subject_weights: nuclei_subject_weights!nuclei_subject_weights_config_id_fkey ( id, subject_name, weight )
            //         )
            //     `,
            //     single: true
            // })

            const res = await callRpc<PsEditionAndNucleiConfigs>({
                bd: this.bd,
                functionName: 'get_active_ps_with_leader_configs',
                params: {
                    p_leader_id: this.auth?.user_id || ''
                }
            })

            if(!res.status){
                throw 'PS_EDITION_NOT_FOUND';
            }

            return res.data as PsEditionAndNucleiConfigs;
        }catch(err){
            throw err;
        }
    }

    async getNuclei() : Promise<NucleiShowProps[]> {
        try{
            const res = await callRpc({
                bd: this.bd,
                functionName: 'get_nuclei',
                params: {}
            })

            if(!res.status){
                throw 'NUCLEI_FETCH_FAILED';
            }

            return (res.data || []) as NucleiShowProps[];
        }catch(err){
            throw err;
        }
    }

    /*
        =========================================================
        ======================  UPDATE ==========================
        =========================================================
    */

    async updateNucleiConfig(data: UpdateNucleiConfigData) : Promise<NucleiRepositoryFactory> {
        try{
            const res = await callRpc<NucleiRepositoryFactory>({
                bd: this.bd,
                functionName: 'manage_nuclei_config',
                params: {
                    p_nucleus_id: data.nuclei_id,
                    p_nuclei_config_id: data.nuclei_config_id,
                    p_open_vacancies: data.open_vacancies,
                    p_subject_weights: data.subject_weights,
                    p_learned_baseline_score: 100
                }
            })

            if(!res.status){
                throw 'NUCLEI_CONFIG_UPDATE_FAILED';
            }
            return res.data || { config_id: '', subjects: [] };
        }catch(err){
            throw err;
        }
    }
}

