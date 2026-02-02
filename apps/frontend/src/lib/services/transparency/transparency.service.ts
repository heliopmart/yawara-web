import { } from '@yawara/types'
import { TransparencyRepository } from '@/lib/repository/transparency/transparency.repository';

export class TransparencyService {
    private transparencyRepository: TransparencyRepository;

    constructor() {
        this.transparencyRepository = new TransparencyRepository();
    }

    async getTransparencyData() {
        try {
            return this.transparencyRepository.getTransparencyData();
        }
        catch (error) {
            throw error;
        }
    }
}