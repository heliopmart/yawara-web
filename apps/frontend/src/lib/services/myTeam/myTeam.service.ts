import { TokenPayload } from '@yawara/types';
import { MyTeamRepository } from '@/lib/repository/myTeam/myTeam.repository'
import { TeamNotesHistory, ArtManageProps } from "@yawara/types"

export class MyTeamService {
    private auth: TokenPayload;
    private myTeamRepository: MyTeamRepository;

    constructor(auth: TokenPayload) {
        this.auth = auth;
        this.myTeamRepository = new MyTeamRepository(this.auth);
    }

    // ===========================================
    // =================== GET ===================
    // ===========================================

    async getMyTeamData() {
        try {
            const teamData = await this.myTeamRepository.getMyTeamData(); // RPC call
            return teamData;
        } catch (err) {
            throw err;
        }
    }

    async getTeamMember() {
        try {
            const teamMember = await this.myTeamRepository.getTeamMember();
            return teamMember;
        } catch (err) {
            throw err;
        }
    }

    async getMyTeamDataForNote() {
        try {
            const teamData = await this.myTeamRepository.getMyTeamDataForNote(); // RPC call
            return teamData;
        } catch (err) {
            throw err;
        }
    }

    async getArt(artId: string): Promise<ArtManageProps> {
        try {
            const artData = await this.myTeamRepository.getArt(artId);
            return artData;
        }
        catch (err) {
            throw err;
        }
    }

    async getArttc(arttcId: string): Promise<ArtManageProps> {
        try {
            const arttcData = await this.myTeamRepository.getArttc(arttcId);
            return arttcData;
        }
        catch (err) {
            throw err;
        }
    }

    // ===========================================
    // ================== CREATE =================
    // ===========================================

    async createArt(title: string, description: string, file: File, members: string[]) {
        try {
            const createdArt = await this.myTeamRepository.createArt(title, description, file, members);
            return createdArt;
        }
        catch (err) {
            throw err;
        }
    }

    async createArttc(title: string, file: File, members: string[]) {
        try {
            const createdArt = await this.myTeamRepository.createArttc(title, file, members);
            return createdArt;
        }
        catch (err) {
            throw err;
        }
    }

    async uploadReportArt(artId: string, file: File): Promise<boolean> {
        try {
            const uploadResult = await this.myTeamRepository.uploadReportArt(artId, file);
            return uploadResult;
        }
        catch (err) {
            throw err;
        }
    }

    // ===========================================
    // ================== UPDATE =================
    // ===========================================

    async putWarningUser(user_id: string) {
        try {
            const updatedMember = await this.myTeamRepository.putWarningUser(user_id);
            return updatedMember;
        }
        catch (err) {
            throw err;
        }
    }

    async putBanUser(user_id: string) {
        try {
            const updatedMember = await this.myTeamRepository.putBanUser(user_id);
            return updatedMember;
        }
        catch (err) {
            throw err;
        }
    }

    async putUserNotes(user_id: TeamNotesHistory['id'], n_social: TeamNotesHistory['n_social'], n_tech: TeamNotesHistory['n_tech']) {
        try {
            const updatedMember = await this.myTeamRepository.putUserNotes(user_id, n_social, n_tech);
            return updatedMember;
        }
        catch (err) {
            throw err;
        }
    }

    // ===========================================
    // ================== FILE ===================
    // ===========================================



    // ===========================================
    // =============== VALIDATION ================
    // ===========================================

    async handleValidationUploadReportArt(user_id: string): Promise<boolean> {
        try {
            const isValid = await this.myTeamRepository.handleValidationUploadReportArt(user_id);
            return isValid;
        }
        catch (err) {
            throw err;
        }
    }
}