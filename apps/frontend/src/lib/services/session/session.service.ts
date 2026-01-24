import { Token } from '@/utils/token'
import { AuthRespositoryUserDataByEmail, TokenPayload } from "@yawara/types"

export class SessionService {
    /**
     * Create a new session for the user
     * @param data User data
     * @return Token String
     * @throws 'INTERNAL_SERVER_ERROR' | 'TOKEN_REDIS_INSERT_ERROR'
     */
    static async createSession(data: TokenPayload): Promise<string> {
        try {
            const token = await Token.generateToken({
                user_id: data.user_id,
                role: data.role,
                secret: data.secret,
                nuclei_id: data.nuclei_id,
            })

            return token;
        } catch (error) {
            console.error('SessionService.createSession error', error);
            throw error;
        }
    }

    /**
     * Verify if a session token is valid
     * @param token Session token
     * @return boolean
     * @throws 'TOKEN_INVALID' | 'INTERNAL_SERVER_ERROR'
     */
    static async verifySession(token: string): Promise<boolean> {
        try {
            const isValid = await Token.verifyToken(token);
            return isValid;
        } catch (error) {
            console.error('SessionService.verifySession error', error);
            throw error;
        }
    }

    /**
     * Destroy a session
     * @param token Session token
     * @return boolean
     * @throws 'INTERNAL_SERVER_ERROR'
     */
    static async destroySession(token: string): Promise<boolean> {
        try {
            const response = await Token.delete(token);
            return response;
        } catch (error) {
            console.error('SessionService.destroySession error', error);
            throw error;
        }
    }

    /**
     * Get session data from token
     * @param token Session token
     * @return Token payload
     * @throws 'TOKEN_NOT_FOUND' | 'INTERNAL_SERVER_ERROR'
     */
    static async getSessionData(token: string) : Promise<TokenPayload> {
        try {
            const payload = await Token.getTokenInRedis(token);
            return payload;
        } catch (error) {
            console.error('SessionService.getSessionData error', error);
            throw error;
        }
    }

    /**
     * Refresh a session token
     * @param token Session token
     * @return New session token
     * @throws 'INTERNAL_SERVER_ERROR' | 'TOKEN_NOT_FOUND'
     */
    static async refreshSession(token: string): Promise<string> {
        try {
            const payload = await this.getSessionData(token);
            const newToken = await this.createSession({
                user_id: payload.user_id,
                role: payload.role,
                secret: payload.secret,
                nuclei_id: payload.nuclei_id,
            });
            return newToken;
        } catch (error) {
            console.error('SessionService.refreshSession error', error);
            throw error;
        }
    }
}