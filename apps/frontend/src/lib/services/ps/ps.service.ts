import { TokenPayload, ps_full_data, ps_card_configs, ps_user_cards, UploadFileResponse, UserProgressContext, cards_progress, AdminUserCardsProgress, ps_editions, PsEditionAvailable, createPsEdition, BatchPresenceItem, DashboardPresenceResponse, sendChalengesEmailParams, BatchNotesItem } from '@yawara/types'
import { PsRepository } from '@/lib/repository/ps/ps.repository'
import { YsnaService } from '@/lib/services/ysna/ysna.service';
import { QStashService } from '@/lib/services/qstash/qstash.service'
import { CloudinaryService } from '@/lib/services/cloudinary/cloudinary.service'
import { EmailService } from '@/lib/services/email/email.service'

const CLOUDINARY_DOCS_FOLDER_NAME = process.env.CLOUDINARY_DOCS_FOLDER_NAME
const CHALLENGE_DIFFICULTY_LEVEL = process.env.CHALLENGE_DIFFICULTY_LEVEL!!

export class PsService {
    private auth: TokenPayload;
    private psRepository: PsRepository;
    private ysnaService: YsnaService;

    constructor(auth: TokenPayload) {
        this.auth = auth;
        this.psRepository = new PsRepository(this.auth);
        this.ysnaService = new YsnaService();
    }

    /*
        =========================================================
        ======================== PS GET =========================
        =========================================================
    */

    async getPsEditionAvailable(): Promise<ps_full_data> {
        try {
            const response = await this.psRepository.getFullPsEditionAvailable();
            return response;
        } catch (error) {
            console.error('PsService.getPsEditionAvailable error:', error);
            throw error;
        }
    }

    async getUserCardsById(): Promise<UserProgressContext> {
        try {
            const response = await this.psRepository.getUserCardsById();
            return response;
        } catch (error) {
            console.error('PsService.getUserCardConfigById error:', error);
            throw error;
        }
    }

    async getUserCardsProgress(user_id?: string): Promise<AdminUserCardsProgress> {
        try {
            const response = await this.psRepository.getUserCardsProgress(user_id);
            return response;
        } catch (error) {
            console.error('PsService.getUserCardsProgress error:', error);
            throw error;
        }
    }

    async getPsEditions(edition_id?: ps_editions['id']): Promise<PsEditionAvailable | PsEditionAvailable[]> {
        try {
            const response = await this.psRepository.getPsEditions(edition_id);
            return response;
        } catch (error) {
            console.error('PsService.getPsEditions error:', error);
            throw error;
        }
    }

    async getPsUserPresence(): Promise<DashboardPresenceResponse> {
        try {
            const response = await this.psRepository.getPsUserPresence();
            return response;
        } catch (error) {
            console.error('PsService.getPsUserPresence error:', error);
            throw error;
        }
    }

    /*
        =========================================================
        ======================= PS UPDATE =======================
        =========================================================
    */

    private async updateStatusUserCard(card_id: ps_card_configs['card_id'], file_id: UploadFileResponse['public_id']): Promise<boolean> {
        try {
            const ps_card_configs = await this.psRepository.getPsCardConfigById(card_id);
            const user_cards_context = await this.psRepository.getUserCardsById();
            const targetCard = user_cards_context.cards_progress.find(card => card.card_id === card_id);

            const card_date = this.toCampoGrandeDate(ps_card_configs.deadline!);
            const current_date = this.toCampoGrandeDate(new Date().toUTCString());

            if (current_date.getTime() > card_date.getTime()) {
                console.error(`[PS_GUARD] Bloqueado: Prazo expirado.`);
                throw 'CARD_DEADLINE_PASSED';
            }

            if (!targetCard) {
                console.error(`Card ${card_id} not found in user progress.`);
                throw 'CARD_NOT_FOUND_IN_PROGRESS';
            }

            targetCard.state = 'COMPLETED';
            targetCard.file_id = file_id;

            const response = await this.psRepository.updateUserCard(user_cards_context.id, {
                cards_progress: user_cards_context.cards_progress
            });

            return response;
        } catch (error) {
            console.error('PsService.updateStatusUserCard error:', error);
            throw error;
        }
    }

    async updateUserChoices(card_id: cards_progress['card_id'], edition_id: ps_user_cards['edition_id'], nuclei_chosen: string[]): Promise<boolean> {
        try {
            const response = await this.psRepository.updateUserChoices(card_id, edition_id, {
                nuclei_chosen
            });


            return response;
        } catch (error) {
            console.error('PsService.updateUserChoices error:', error);
            throw error;
        }
    }

    async updateCardUser(uuid: ps_user_cards['id'], data: Partial<ps_user_cards>): Promise<boolean> {
        try {
            const response = await this.psRepository.updateAdminUserCard(uuid, data);
            return response;
        } catch (error) {
            console.error('PsService.updateCardUser error:', error);
            throw error;
        }
    }

    async updatePsEdition(data: Partial<ps_editions>, uuid?: ps_editions['id']): Promise<boolean> {
        try {
            const response = await this.psRepository.updatePsEdition(data, uuid);
            return response;
        } catch (error) {
            console.error('PsService.updatePsEdition error:', error);
            throw error;
        }
    }

    async updatePsUserPresence(data: BatchPresenceItem[]): Promise<boolean> {
        try {
            const response = await this.psRepository.updateBatchPresence(data);
            return response;
        } catch (error) {
            console.error('PsService.updatePsUserPresence error:', error);
            throw error;
        }
    }

    async updatePsUserScore(data: BatchNotesItem[]): Promise<boolean> {
        try {
            const response = await this.psRepository.updateBatchScores(data);
            return response;
        } catch (error) {
            console.error('PsService.updatePsUserScore error:', error);
            throw error;
        }
    }

    async checkAndProcessClosing(): Promise<boolean> {
        try {
            const difficulty = CHALLENGE_DIFFICULTY_LEVEL || 'EASY';
            const res = await this.psRepository.PsRegistrationClose(
                difficulty
            );

            if (!res) {
                throw 'PS_REGISTRATION_CLOSING_FAILED';
            }

            await this.sendChallengesEmail()

            return res
        } catch (error) {
            console.error('PsService.checkAndProcessClosing error:', error);
            throw error;
        }
    }

    async finishEdition(): Promise<boolean> {
        try {
            return await this.psRepository.psFinishEdition();
        } catch (error) {
            console.error('PsService.finishEdition error:', error);
            throw error;
        }
    }

    async deactivateSelectionProcess(edition_id: string): Promise<boolean> {
        try {
            return await this.psRepository.updatePsEdition({ is_active: false }, edition_id);
        } catch (error) {
            console.error('PsService.deactivateSelectionProcess error:', error);
            throw error;
        }
    }

    /*
        =========================================================
        ======================= PS CREATE =======================
        =========================================================
    */

    async signup(): Promise<boolean> {
        try {
            const cards_progress: cards_progress[] = [
                {
                    card_id: 1,
                    state: 'NOT_AVAILABLE',
                    file_id: '',
                },
                {
                    card_id: 2,
                    state: 'NOT_AVAILABLE',
                    file_id: '',
                    notes: {
                        technical_content: 0,
                        context_applicability: 0,
                        language_style: 0,
                        metacognitive_reflection: 0,
                        write_quality: 0
                    }
                },
                {
                    card_id: 3,
                    state: 'NOT_AVAILABLE',
                    notes: {
                        communication: 0,
                        proactivily: 0,
                        collaboration: 0,
                        adaptability: 0,
                        leadership: 0
                    }
                },
                {
                    card_id: 4,
                    state: 'NOT_AVAILABLE',
                    notes: {
                        technique: 0,
                        resilience: 0,
                        flexibility: 0,
                        self_criticism: 0
                    }
                }
            ];

            const response = await this.psRepository.signupToPsEdition(cards_progress);
            return response;
        } catch (error) {
            console.error('PsService.signup error:', error);
            throw error;
        }
    }

    async createPsEdition(data: createPsEdition): Promise<boolean> {
        try {
            const response = await this.psRepository.createPsEdition(data);

            if (!response) {
                throw 'PS_EDITION_CREATION_FAILED';
            }

            await this.scheduleEditionLifecycle(response, data);

            return response ? true : false;
        } catch (error) {
            console.error('PsService.createPsEdition error:', error);
            throw error;
        }
    }

    /*
        =========================================================
        ======================== PS FILE =========================
        =========================================================
    */

    async uploadFile(card_id: ps_card_configs['card_id'], candidate_id: string, file: File): Promise<boolean> {
        try {
            const upload_response = await CloudinaryService.upload(file, {
                folder: `${CLOUDINARY_DOCS_FOLDER_NAME}/ps/${this.auth.user_id}/`,
                resourceType: 'raw',
                uploadType: 'upload'
            });

            if (!upload_response.public_id) {
                throw "FILE_UPLOAD_FAILED";
            }

            const update_reponse = await this.updateStatusUserCard(card_id, upload_response.public_id);

            if (!update_reponse) {
                throw "USER_CARD_UPDATE_FAILED";
            }

            const ysnaEvaluation = await this.ysnaService.evaluateHistory(candidate_id);

            return ysnaEvaluation.details.success;
        } catch (error) {
            console.error('PsService.uploadFile error:', error);
            throw error;
        }
    }


    /*
       =========================================================
       ======================== PS MAIL  =======================
       =========================================================
    */

    async sendChallengesEmail(): Promise<void> {
        try {
            const difficulty = CHALLENGE_DIFFICULTY_LEVEL || 'EASY';
            const candidates = await this.psRepository.setChanllengesForCandidates(difficulty);

            const emailService = new EmailService();

            const params: sendChalengesEmailParams[] = candidates.map(candidate => ({
                challenge_id: candidate.challenge_id,
                edition_id: candidate.edition_id,
                name: candidate.user_name,
                to: candidate.user_email,
                user_id: candidate.user_id
            }));

            const BATCH_SIZE = 20;

            for (let i = 0; i < params.length; i += BATCH_SIZE) {
                const chunk = params.slice(i, i + BATCH_SIZE);

                const results = await Promise.allSettled(
                    chunk.map(paramsItem => emailService.sendChallengesEmail(paramsItem))
                );

                results.forEach((result, index) => {
                    if (result.status === 'rejected') {
                        const failedEmail = chunk[index].to;
                        console.error(`[EMAIL ERROR] Falha ao enviar para ${failedEmail}:`, result.reason);
                    }
                });

                console.info(`[EMAIL] Lote ${Math.ceil((i + 1) / BATCH_SIZE)} processado.`);
            }
        }
        catch (error) {
            console.error('PsService.sendChallengesEmail error:', error);
            throw error;
        }
    }

    /*
        =========================================================
        ====================== PS Schedule  =====================
        =========================================================
    */

    private async scheduleEditionLifecycle(editionId: string, data: createPsEdition) {
        const qstash = new QStashService();

        const CRON_DISPATCHER_URL = `${process.env.NEXT_PUBLIC_APP_URL}/api/admin/cron/ps/dispatcher`;

        if (data.registration_closing) {
            await qstash.scheduleEvent(
                CRON_DISPATCHER_URL,
                this.toCampoGrandeDate(data.registration_closing, "00:00"),
                {
                    target: 'EDITION',
                    action: 'CLOSE_REGISTRATION',
                    edition_id: editionId
                }
            );
        }

        if (data.finish_date) {
            await qstash.scheduleEvent(
                CRON_DISPATCHER_URL,
                this.toCampoGrandeDate(data.finish_date, "00:00"),
                {
                    target: 'EDITION',
                    action: 'FINISH_PROCESS',
                    edition_id: editionId
                }
            );
        }

        if (data.finish_date) {
            const finishDate = new Date(data.finish_date);
            finishDate.setDate(finishDate.getDate() + 5);
            const delayedDateStr = finishDate.toISOString().split('T')[0];

            await qstash.scheduleEvent(
                CRON_DISPATCHER_URL,
                this.toCampoGrandeDate(delayedDateStr, "00:00"),
                {
                    target: 'EDITION',
                    action: 'DESACTIVATE_PROCESS',
                    edition_id: editionId
                }
            );
        }
    }

    /**
    * Helper para forçar o fuso horário de Campo Grande (UTC-4).
    * @param dateStr String de data (ex: '2026-03-11' ou '2026-03-11 22:00:00')
    * @param timeStr Hora opcional (usada apenas se dateStr não tiver hora)
    */
    private toCampoGrandeDate(dateStr: string, timeStr?: string): Date {
        let isoString: string;

        if (dateStr.includes(' ')) {
            const isoFormat = dateStr.replace(' ', 'T');
            isoString = `${isoFormat}-04:00`;
        } else {
            const cleanDate = dateStr.split('T')[0];
            const timeParts = (timeStr || "00:00:00").split(':');
            const hour = timeParts[0].padStart(2, '0');
            const minute = (timeParts[1] || '00').padStart(2, '0');
            const second = (timeParts[2] || '00').padStart(2, '0');
            isoString = `${cleanDate}T${hour}:${minute}:${second}-04:00`;
        }

        const finalDate = new Date(isoString);

        if (isNaN(finalDate.getTime())) {
            console.error("[DATE_ERROR] Falha ao converter:", isoString);
            throw "INTERNAL_DATE_ERROR";
        }

        return finalDate;
    }
}
