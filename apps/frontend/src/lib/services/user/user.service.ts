import { TokenPayload, MyAccountUserDataRepository } from "@yawara/types"
import { UserRepository } from "@/lib/repository/user/user.repository";

export class UserService {
    private auth: TokenPayload;
    private userRepository: UserRepository;

    constructor(auth: TokenPayload) {
        this.auth = auth;
        this.userRepository = new UserRepository(this.auth);
    }

    /*
        =========================================================
        ======================= USER GET ========================
        =========================================================
    */

    async getMyAccountUserData(): Promise<MyAccountUserDataRepository> {
        try {
            const user_response = await this.userRepository.getMyAccountUserData();
            return {
                ...user_response,
                initials: `${user_response.name.charAt(0)}${user_response.name.charAt(user_response.name.indexOf(' ') + 1)}`.toUpperCase()
            };
        } catch (error) {
            console.error('UserService.getMyAccountUserData error:', error);
            throw error;
        }
    }

    /*
        =========================================================
        ===================== USER UPDATE =======================
        =========================================================
    */

    async updateMyAccountUserData(data: Partial<MyAccountUserDataRepository>): Promise<boolean> {
        try {
            const update_response = await this.userRepository.update(data);
            return update_response;
        } catch (error) {
            console.error('UserService.updateMyAccountUserData error:', error);
            throw error;
        }
    }

    /*
        =========================================================
        ====================== USER INSERT ======================
        =========================================================
    */


    /*
        =========================================================
        ===================== USER DELETE =======================
        =========================================================
    */


}