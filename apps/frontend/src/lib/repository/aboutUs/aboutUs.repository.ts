import { create_rls_client, supabase } from "@/lib/db"
import { callRpc } from '@/utils/bd'
import { AboutUsData } from '@yawara/types'

export class AboutUsRepository {
    private bd: ReturnType<typeof create_rls_client>;
    constructor() {
        this.bd = supabase;
    }

    async getAboutUsData() : Promise<AboutUsData> {
        try{
            const res = await callRpc({
                bd: this.bd,
                functionName: 'get_about_us_data',
                params: {}
            })

            if(!res.status){
                throw 'ERROR_GET_ABOUTUS_DATA';
            }

            return res.data as AboutUsData;
        }catch(error){
            throw error;
        }
    }
}