import { TokenPayload, ps_full_data, ps_card_configs, ps_user_cards, UploadFileResponse, UserProgressContext, cards_progress } from '@yawara/types'
import { PsRepository } from '@/lib/repository/ps/ps.repository'
import { CloudinaryService } from '@/lib/services/cloudinary/cloudinary.service'

const CLOUDINARY_DOCS_FOLDER_NAME = process.env.CLOUDINARY_DOCS_FOLDER_NAME

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

    async updateUserChoices(card_id: cards_progress['card_id'] ,edition_id: ps_user_cards['edition_id'], nuclei_chosen: string[]): Promise<boolean> {
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

    /*
        =========================================================
        ======================= PS CREATE =======================
        =========================================================
    */

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