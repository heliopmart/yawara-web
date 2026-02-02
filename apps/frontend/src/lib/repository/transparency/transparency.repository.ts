import { create_rls_client, supabase } from "@/lib/db"
import { getRows, updateRow, callRpc, insertRow } from '@/utils/bd'
import {  } from '@yawara/types'

export class TransparencyRepository {
    private bd;
    constructor(){
        this.bd = supabase
    }

    // : Promise<any[]> 
    async getTransparencyData(){
        try {
            const res = await callRpc({
                bd: this.bd,
                functionName: 'get_transparency_data',
                params: {}
            })

            if(!res.status){
                throw 'TRANSPARENCY_DATA_FETCH_ERROR'
            }

            return res.data || [];
        }
        catch (error) {
            throw error;
        }
    }
}