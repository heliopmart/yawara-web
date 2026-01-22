import { TokenPayload } from '@yawara/types';
import { MyTeamRepository } from '@/lib/repository/myTeam/myTeam.repository'
import { TeamNotesHistory, ArtManageProps, myTeamDataProps, TeamMember, TeamMemberMinify, ArtMinify } from "@yawara/types"
import {CloudinaryService} from '@/lib/services/cloudinary/cloudinary.service'

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

    /**
     * Get my team data 
     * @return {Promise<myTeamDataProps>} My team data
     */
    async getMyTeamData() : Promise<myTeamDataProps> {
        try {
            const teamData = await this.myTeamRepository.getMyTeamData(); // RPC call
            return teamData;
        } catch (err) {
            throw err;
        }
    }

    /**
     * Get team members
     * @return {Promise<TeamMember[]>} Team members
     */
    async getTeamMember() : Promise<TeamMember[]> {
        try {
            const teamMember = await this.myTeamRepository.getTeamMember();
            return teamMember;
        } catch (err) {
            throw err;
        }
    }

    /**
     * Get my team data for notes, only user dont have art assigned
     * @return {Promise<{team: TeamMemberMinify[], arts: ArtMinify[]}>} My team data for notes
     */
    async getMyTeamDataForNote(type:'ART' | 'ARTTC') : Promise<{team: TeamMemberMinify[], arts: ArtMinify[]}> {
        try {
            const teamData = await this.myTeamRepository.getMyTeamDataForNote(type);

            if(type === 'ARTTC'){
                const arts = await this.myTeamRepository.getArtsActives();
                return { team: teamData, arts };
            }

            return { team: teamData, arts: [] };
        } catch (err) {
            throw err;
        }
    }

    /**
     * Get art details by art ID
     * @param {string} artId - Art ID
     * @return {Promise<ArtManageProps>} Art details
     */
    async getArt(artId: string): Promise<ArtManageProps> {
        try {
            const artData = await this.myTeamRepository.getArt(artId);
            return artData;
        }
        catch (err) {
            throw err;
        }
    }

    /**
     * Get arttc details by arttc ID
     * @param {string} arttcId - Arttc ID
     * @return {Promise<ArtManageProps>} Arttc details
     */
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

    /**
     * Create a new art
     * @param {string} title - Art title
     * @param {string} description - Art description
     * @param {string[]} members - Team members
     * @return {Promise<ArtManageProps>} Created art
     */
    async createArt(title: string, description: string, members: string[]) {
        try {
            const createdArt = await this.myTeamRepository.createArt(title, description, members);
            return createdArt;
        }
        catch (err) {
            throw err;
        }
    }

    /**
     * Create a new arttc
     * @param {string} title - Arttc title
     * @param {string[]} members - Team members
     * @return {Promise<ArtManageProps>} Created arttc
     */
    async createArttc(title: string, members: string[], description: string, art_id: string) : Promise<string> {
        try {
            const createdArt = await this.myTeamRepository.createArttc(title, members, description, art_id);
            return createdArt;
        }
        catch (err) {
            throw err;
        }
    }


    // ===========================================
    // ================== UPDATE =================
    // ===========================================

    /**
     * Put warning to user
     * @param {string} team_id - Team ID
     * @return {Promise<boolean>} Update status
     */
    async putWarningUser(team_id: string) {
        try {
            const updatedMember = await this.myTeamRepository.putWarningUser(team_id);
            return updatedMember;
        }
        catch (err) {
            throw err;
        }
    }

    /**
     * Ban a user
     * @param {string} team_id - User ID
     * @return {Promise<boolean>} Ban status
     */
    async putBanUser(team_id: string) {
        try {
            const updatedMember = await this.myTeamRepository.putBanUser(team_id);
            return updatedMember;
        }
        catch (err) {
            throw err;
        }
    }

    /**
     * Update user notes
     * @param {string} team_id - Team ID
     * @param {number} n_social - Social note
     * @param {number} n_tech - Technical note
     * @return {Promise<boolean>} Update status
     */
    async putUserNotes(team_id: TeamNotesHistory['id'], n_social: TeamNotesHistory['n_social'], n_tech: TeamNotesHistory['n_tech']) {
        try {
            const updatedMember = await this.myTeamRepository.putUserNotes(team_id, n_social, n_tech);
            return updatedMember;
        }
        catch (err) {
            throw err;
        }
    }

    // ===========================================
    // ================== FILE ===================
    // ===========================================

    async uploadArtFile(artId: string, file: File): Promise<boolean> {
        try {
        
            const uploaded_file_id = await CloudinaryService.upload(file, {
                folder: 'art',
                resourceType: 'raw',
                uploadType: 'upload'
            });

            const uploadResult = await this.myTeamRepository.uploadArtFile(artId, uploaded_file_id.public_id);
            return uploadResult;
        }catch(err){
            throw err;
        }
    }
    

    async uploadArttcFile(arttcId: string, file: File): Promise<boolean> {
        try {
        
            const uploaded_file_id = await CloudinaryService.upload(file, {
                folder: 'arttc',
                resourceType: 'raw',
                uploadType: 'upload'
            });

            const uploadResult = await this.myTeamRepository.uploadArttcFile(arttcId, uploaded_file_id.public_id);
            return uploadResult;
        }catch(err){
            throw err;
        }
    }

     async uploadArttcReportFile(arttcId: string, file: File): Promise<boolean> {
        try {
        
            const uploaded_file_id = await CloudinaryService.upload(file, {
                folder: 'arttc/reports',
                resourceType: 'raw',
                uploadType: 'upload'
            });

            const uploadResult = await this.myTeamRepository.uploadArttcReportFile(arttcId, uploaded_file_id.public_id);
            return uploadResult;
        }catch(err){
            throw err;
        }
    }
    

}