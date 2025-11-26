import { TokenPayload, ps_full_data } from '@yawara/types'
import { PsRepository } from '@/lib/repository/ps/ps.repository'

export class PsService {
    private auth: TokenPayload;
    private psRepository: PsRepository;

    constructor(auth: TokenPayload) {
        this.auth = auth;
        this.psRepository = new PsRepository(this.auth);

    }

    async getPsEditionAvailable(): Promise<ps_full_data> {
        try{
            const response = await this.psRepository.getFullPsEditionAvailable();
            return response;
        }catch (error) {
            console.error('PsService.getPsEditionAvailable error:', error);
            throw error;
        }
    }
}