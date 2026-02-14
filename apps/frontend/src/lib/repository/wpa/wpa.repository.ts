import { supabaseAdmin } from "@/lib/db"
import { getRows, updateRow, callRpc } from '@/utils/bd'
import { WpaProvider } from "@/lib/wpa"
import { WPA, WpaSubscription, WpaNotificationType, WpaRawData, WPADataPayload} from "@yawara/types"
import { handle_throw_error } from '@/utils/error'


export class WpaRepository{
    private bd: typeof supabaseAdmin;
    constructor(){
        this.bd = supabaseAdmin
    }

    public async getDataForWpa(): Promise<WPADataPayload> {
        try{
            const res = await callRpc({
                functionName: "get_data_for_wpa_stateless",
                params: {},
                bd: this.bd
            })

            if(!res.status){
                throw "Error fetching data for WPA" 
            }

            return res.data as WPADataPayload;
        }catch(e){
            throw new Error(handle_throw_error({
                message: "Error fetching data for WPA",
                statusCode: 500,
                path: "/repository/wpa/wpa.repository (WpaRepository.getDataForWpa)",
                code: "WPA_FETCH_ERROR",
                originalError: e,
                whatWaRight: {
                    status: true,
                    data: [
                        {
                            subscription: {
                                endpoint: "string",
                                keys: {
                                    p256dh: "string",
                                    auth: "string"
                                }
                            },
                            resource_id: "uuid",
                            resource_title: "string",
                            type: "OTHERS" as WpaNotificationType,
                            user_id: "uuid"
                        }
                    ] as WpaRawData[]

                }
            }))
        }
    }
}