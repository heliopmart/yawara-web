import webpush from 'web-push';
import {WpaSubscription} from "@yawara/types";

export class WpaProvider {
    private static isInitialized = false;

    private static initialize() {
        if (this.isInitialized) return;

        webpush.setVapidDetails(
            'mailto:teamyawaraufgd@gmail.com',
            process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
            process.env.VAPID_PRIVATE_KEY!
        );

        this.isInitialized = true;
    }

    /**
     * Envia uma notificação push para um cliente inscrito.
     * @param subscription O objeto de inscrição do cliente.
     * @param title O título da notificação.
     * @param body O corpo da notificação.
     * @param icon (Opcional) O ícone da notificação.
     * @returns Um objeto indicando o sucesso ou falha do envio.
     */
    static async send(subscription: WpaSubscription, title: string, body: string, icon?: string) : Promise<{ success: boolean; expired?: boolean; error?: any }> {
        this.initialize();

        const payload = JSON.stringify({
            notification: {
                title,
                body,
                icon: icon || '/images/yawara-icon-color.png',
                badge: '/images/yawara-icon-black.png',
                vibrate: [100, 50, 100],
                data: {
                    dateOfArrival: Date.now(),
                    primaryKey: 1
                },
            }
        });

        try {
            await webpush.sendNotification(subscription, payload);
            return { success: true };
        } catch (error: any) {
            if (error.statusCode === 410 || error.statusCode === 404) {
                return { success: false, expired: true };
            }

            console.error('[WpaProvider] Erro ao enviar push:', error);
            return { success: false, error };
        }
    }
}