import { WpaRepository } from "@/lib/repository/wpa/wpa.repository"
import { WpaProvider } from "@/lib/wpa"
import { WPA, WpaSubscription, WpaData, WpaNotificationType } from "@yawara/types"
import { handle_throw_error } from '@/utils/error'

export class WpaService {
    private repository: WpaRepository;
    private readonly MS_TIMEZONE = 'America/Campo_Grande';
    private readonly ONE_DAY_MS = 86400000;


    constructor() {
        this.repository = new WpaRepository();
    }

    public async wpa_service(): Promise<boolean> {
        try {
            const data = await this.handle_get_data_for_wpa();

            console.log(data)

            if (data.length === 0) return true;

            const results = await Promise.allSettled(
                data.map(item => this.send_wpa(item.subscription, item.title, item.body))
            );

            if (results.length === 0) return true;

            return false;
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
            if (!payload.users?.length) return [];

            console.log(payload)

            const now = WpaService.get_ms_date();
            const nowTime = now.getTime();

            return payload.users
                .map(user => {
                    if (!user.wpa_subscription) return null;

                    const notifications: string[] = [];
                    const psUserCard = payload.user_cards.find(uc => uc.user_id === user.id);

                    // 1. Fluxo de Inscrição (Candidatos não registrados)
                    if (payload.edition?.registration_closing && !psUserCard) {
                        const regClosing = WpaService.get_ms_date(payload.edition.registration_closing).getTime();
                        const diff = regClosing - nowTime;

                        if (diff > 0 && diff <= this.ONE_DAY_MS) {
                            notifications.push("🚨 Prazo de inscrição se encerra em menos de 24h!");
                        }
                    }

                    // 2. Fluxo de Progresso (Candidatos registrados)
                    if (psUserCard && payload.edition) {
                        const finishTime = WpaService.get_ms_date(payload.edition.finish_date).getTime();
                        const diffFinish = finishTime - nowTime;

                        // Verificação de Cards Pendentes
                        if (psUserCard.cards_progress && payload.card_configs) {
                            payload.card_configs.forEach(pc => {
                                const progress = psUserCard.cards_progress.find(cp => cp.card_id === pc.card_id);
                                if (progress && progress.state !== "COMPLETED") {
                                    const eventDate = WpaService.get_ms_date(pc.start_time || pc.deadline);
                                    notifications.push(`📅 Tarefa pendente: ${pc.title} em ${pc.location || 'Online'} (${eventDate.toLocaleDateString('pt-BR')})`);
                                }
                            });
                        }

                        // Alerta de Encerramento Próximo
                        if (diffFinish > 0 && diffFinish <= this.ONE_DAY_MS) {
                            const msg = psUserCard.nuclei_chosen?.length === 0
                                ? "⚠️ O PS encerra em 24h! Escolha seus núcleos agora."
                                : "⚠️ O PS encerra em 24h! Revise suas entregas pendentes.";
                            notifications.push(msg);
                        }

                        // Feedback de Encerramento (D+1)
                        if (nowTime > finishTime && nowTime <= (finishTime + this.ONE_DAY_MS)) {
                            notifications.push("🏁 O processo foi encerrado! Obrigado por participar da nossa jornada.");
                        }
                    }

                    // 3. Fluxo de Liderança (Avaliações)
                    if(payload.teams_to_notify){
                        const teamAlerts = payload.teams_to_notify.filter(t => t.leader_user_id === user.id);
                        teamAlerts.forEach(tn => {
                            notifications.push(`⚖️ Há notas pendentes no núcleo ${tn.name}. Acesse para avaliar.`);
                        });
                    }

                    if (notifications.length === 0) return null;

                    return {
                        subscription: user.wpa_subscription as WpaSubscription,
                        title: `Yawara: ${notifications.length} atualizaç${notifications.length > 1 ? 'ões' : 'ão'} para você!`,
                        body: notifications.join('\n')
                    } as WpaData;

                })
                .filter((item): item is WpaData => item !== null);

        } catch (e) {
            throw new Error(handle_throw_error({
                message: "Error processing WPA stateless payload",
                statusCode: 500,
                path: "/services/wpa/wpa.service (handle_get_data_for_wpa)",
                originalError: e
            }));
        }
    }


    private static get_ms_date = (date: Date | string = new Date()) => {
        const targetDate = typeof date === 'string' ? new Date(date) : date;
        const msString = targetDate.toLocaleString("en-US", {
            timeZone: "America/Campo_Grande"
        });
        return new Date(msString);
    };

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