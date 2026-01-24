import { TokenPayload, ps_full_data, ps_card_configs, ps_user_cards, UploadFileResponse, UserProgressContext, cards_progress, AdminUserCardsProgress, ps_editions, PsEditionAvailable, createPsEdition, BatchPresenceItem, DashboardPresenceResponse, checkAndProcessClosingResponse, BatchNotesItem} from '@yawara/types'
import { PsRepository } from '@/lib/repository/ps/ps.repository'
import { CloudinaryService } from '@/lib/services/cloudinary/cloudinary.service'
import { EmailService } from '@/lib/services/email/email.service'

const CLOUDINARY_DOCS_FOLDER_NAME = process.env.CLOUDINARY_DOCS_FOLDER_NAME
const CHALLENGE_DIFFICULTY_LEVEL = process.env.CHALLENGE_DIFFICULTY_LEVEL!!

export class PsService {
    private auth: TokenPayload;
    private psRepository: PsRepository;

    constructor(auth: TokenPayload) {
        this.auth = auth;
        this.psRepository = new PsRepository(this.auth);

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
            const user_cards_context = await this.psRepository.getUserCardsById();

            const targetCard = user_cards_context.cards_progress.find(card => card.card_id === card_id);

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
        try{
            const response = await this.psRepository.updateBatchScores(data);
            return response;
        }catch(error){
            console.error('PsService.updatePsUserScore error:', error);
            throw error;
        }
    }

    async checkAndProcessClosing(): Promise<checkAndProcessClosingResponse> {
        const activeEdition = await this.psRepository.getPsEditions();

        let edition: PsEditionAvailable | null = null;
        if (Array.isArray(activeEdition)) {
            if (activeEdition.length === 0) return 'NO_ACTIVE_EDITION';
            edition = activeEdition[0];
        } else {
            edition = activeEdition;
        }

        if (!edition) return 'NO_ACTIVE_EDITION';

        if (!edition.registration_closing) {
            return 'ALREADY_PROCESSED';
        }
        const now = new Date();
        const closingDate = new Date(edition.registration_closing);

        if (now > closingDate) {
            console.info(`[INFO]: Processando fechamento da edição: ${edition.id}`);

            const difficulty = CHALLENGE_DIFFICULTY_LEVEL || 'EASY';

            const survivors = await this.psRepository.processRegistrationClosing(
                edition.id,
                difficulty
            );

            if (survivors.length > 0) {
                const emailService = new EmailService();

                await Promise.allSettled(survivors.map(survivor =>
                    emailService.sendChallengesEmail({
                        to: survivor.user_email,
                        name: survivor.user_name,
                        challenge_id: survivor.challenge_id,
                        edition_id: edition.id,
                        user_id: survivor.user_id
                    })
                ));

                console.info(`[INFO]: Emails enviados para ${survivors.length} candidatos.`);
            }

            return 'PROCESS_COMPLETED';
        }

        return 'NOT_YET_TIME';
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
                },
                {
                    card_id: 5,
                    state: 'NOT_AVAILABLE',
                    notes: {}
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
            return response;
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

    async uploadFile(card_id: ps_card_configs['card_id'], file: File): Promise<boolean> {
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

            return update_reponse;
        } catch (error) {
            console.error('PsService.uploadFile error:', error);
            throw error;
        }
    }
}
