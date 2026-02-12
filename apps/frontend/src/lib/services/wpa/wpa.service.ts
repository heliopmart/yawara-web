import { WpaRepository } from "@/lib/repository/wpa/wpa.repository"
import { WpaProvider } from "@/lib/wpa"
import { WPA, WpaSubscription, WpaData, WpaNotificationType } from "@yawara/types"
import { handle_throw_error } from '@/utils/error'

export class WpaService {
    private repository: WpaRepository;

    constructor() {
        this.repository = new WpaRepository();
    }

    public async wpa_service(): Promise<boolean> {
        try {
            const data = await this.handle_get_data_for_wpa();
            if (data.length === 0) return true;

            const results = await Promise.allSettled(
                data.map(item => this.send_wpa(item.subscription, item.title, item.body))
            );

            const successfulSentWpa = results
                .map((result, index) => {
                    console.log("Result for WPA ", index, ": ", result);
                    if (result.status === 'fulfilled' && result.value === true) {
                        return data[index].wpa;
                    }
                    return null;
                })
                .filter((item): item is WPA => item !== null);

            if (successfulSentWpa.length === 0) return true;

            return await this.handle_save_wpa_sent(successfulSentWpa);

        } catch (e) {
            throw new Error(handle_throw_error({
                message: "Error in WPA service",
                statusCode: 500,
                path: "/services/wpa/wpa.service (WpaService.wpa_service)",
                code: "WPA_SERVICE_ERROR",
                originalError: e,
                whatWaRight: "All handles should be working correctly and returned true. "
            }))
        }
    }

    // =========================================== 
    // ================= HANDLE ================== 
    // =========================================== 

    private async handle_get_data_for_wpa(): Promise<WpaData[]> {
        try {
            const payload = await this.repository.getDataForWpa();
            
            if (!payload.users || payload.users.length === 0) return [];

            const notifications_to_send: WpaData[] = [];

            for (const user of payload.users) {
                const user_notifications: any[] = [];

                if (payload.edition) {
                    console.log("user_notifications")


                    user_notifications.push(this.create_message_layout(WpaNotificationType.PS, {
                        resource_id: payload.edition.id,
                        title: "Inscrições encerrando!",
                        body: "Hoje é o último dia para se inscrever no PS."
                    }));
                }

                const user_card = payload.user_cards.find(c => c.user_id === user.id);
                if (user_card) {
                    user_notifications.push(this.create_message_layout(WpaNotificationType.PS, {
                        resource_id: user_card.id,
                        title: "Tarefa pendente",
                        body: "Você tem um card do PS que vence em breve!"
                    }));
                }

                if (user_notifications.length > 0) {

                    const title = user_notifications.length > 1
                        ? `Yawara: ${user_notifications.length} avisos importantes`
                        : user_notifications[0].title;

                    const body = user_notifications.map(n => `• ${n.body}`).join('\n');

                    notifications_to_send.push({
                        subscription: user.wpa_subscription as WpaSubscription,
                        title,
                        body,
                        wpa: {
                            user_id: user.id,
                            resource_id: user.id,
                            type: user_notifications.length > 1 ? WpaNotificationType.OTHERS : user_notifications[0].type,
                            wpa_log: {
                                timestamp: new Date().toISOString(),
                                wps_notification: user_notifications.map(n => ({ id: n.resource_id, type: n.type }))
                            } as WPA['wpa_log']
                        } as Pick<WPA, 'resource_id' | 'type' | 'user_id' | 'wpa_log'>
                    });
                }
            }

            return notifications_to_send;

        } catch (e) {
            throw new Error(handle_throw_error({
                message: "Error processing WPA payload",
                statusCode: 500,
                path: "/services/wpa/wpa.service (WpaService.handle_get_data_for_wpa)",
                code: "WPA_PAYLOAD_ERROR",
                originalError: e
            }));
        }
    }

    private async handle_save_wpa_sent(data: WPA[]): Promise<boolean> {
        try {
            console.log("Saving sent WPA data: ", data);
            return this.repository.saveWpaSent(data);
        } catch (e) {
            // throw (handle_throw_error({
            //     message: "Error saving sent WPA data",
            //     statusCode: 500,
            //     path: "/services/wpa/wpa.service (WpaService.handle_save_wpa_sent)",
            //     code: "WPA_SAVE_ERROR",
            //     originalError: e,
            //     whatWaRight: {
            //         success: true
            //     }
            // }))
            console.error("Error saving sent WPA data: ", e);
            return false
        }
    }

    // =========================================== 
    // ============= MESSAGE LAYOUT ============== 
    // =========================================== 

    private create_message_layout(type: WpaNotificationType, data: any) {
        return {
            type,
            resource_id: data.id || 'system',
            title: data.title || "Notificação Yawara",
            body: data.body || "Você tem uma nova atualização."
        };
    }

    // =========================================== 
    // ================== CALL =================== 
    // =========================================== 


    private async send_wpa(subscription: WpaSubscription, title: string, body: string): Promise<Boolean> {
        try {
            const wpa_res = await WpaProvider.send(subscription, title, body);
            return wpa_res.success
        } catch (e) {
            // throw new Error(handle_throw_error({
            //     message: "Error sending push notification",
            //     statusCode: 500,
            //     path: "/services/wpa/wpa.service (WpaService.send_wpa)",
            //     code: "WPA_SEND_ERROR",
            //     originalError: e,
            //     whatWaRight: {
            //         success: true
            //     }
            // }))
            console.error("Error sending push notification: ", e);
            return false
        }
    }
}