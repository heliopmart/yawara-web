import { NucleiRepository } from '@/lib/repository/nuclei/nuclei.repository'
import { TokenPayload, PsEditionAndNucleiConfigs, UpdateNucleiConfigData, NucleiRepositoryFactory, NucleiShowProps, MemberToCreateNucleus } from '@yawara/types'

export class NucleiService {
    private auth?: TokenPayload;
    private nucleiRepository: NucleiRepository;

    constructor(auth?: TokenPayload) {
        this.auth = auth;
        this.nucleiRepository = new NucleiRepository(this.auth);

    }

    /*
        =========================================================
        ========================  GET ===========================
        =========================================================
    */

    async getActivePsEdition(): Promise<PsEditionAndNucleiConfigs> {
        try {
            const psEdition = await this.nucleiRepository.getActivePsEditionAndNucleiConfigs();
            return psEdition;
        } catch (err) {
            throw err;
        }
    }

    async getNuclei(): Promise<NucleiShowProps[]> {
        try {
            const res = await this.nucleiRepository.getNuclei();
            return res;
        } catch (err) {
            throw err;
        }
    }

    async getMembersForNucleusAdm(): Promise<MemberToCreateNucleus[]> {
        try {
            const res = await this.nucleiRepository.getMembersForNucleusAdm();
            return res;
        } catch (err) {
            throw err;
        }
    }

    /*
        =========================================================
        ======================  UPDATE ==========================
        =========================================================
    */

    async updateNucleiConfig(data: UpdateNucleiConfigData): Promise<NucleiRepositoryFactory> {
        try {
            const res = await this.nucleiRepository.updateNucleiConfig(data);
            return res;
        } catch (err) {
            throw err;
        }
    }

    /*
        =========================================================
        ======================  CREATE ==========================
        =========================================================
    */

    async createNucleus(data: { name: string, leader_id: string }): Promise<boolean> {
        try {
            const res = await this.nucleiRepository.createNucleus(data);
            return res;
        } catch (err) {
            throw err;
        }
    }
}