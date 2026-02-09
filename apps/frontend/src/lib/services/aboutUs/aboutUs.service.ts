import { AboutUsRepository } from "@/lib/repository/aboutUs/aboutUs.repository"
import {AboutUsData} from '@yawara/types';

export class AboutUsService {
    repository: AboutUsRepository;
    constructor(){
        this.repository = new AboutUsRepository();
    }

    async getAboutUsData(): Promise<AboutUsData> {
        try {
            return await this.repository.getAboutUsData();
        }catch (error) {
            throw error;
        }
    }
}