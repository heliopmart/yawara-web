import { AuthRepository } from '@/lib/repository/auth/auth.repository'
import {UserRepository} from '@/lib/repository/user/user.repository'
import { SessionService } from '@/lib/services/session/session.service'
import {hashCreateSecretAuth} from '@/utils/hash'
import { verifyPasswordString, hashPasswordString } from '@/utils/hash'
import { AuthServiceLoginCredentials, AuthServiceRegistreCredentials, TokenPayload } from '@yawara/types'

export class authService {
    /**
     * Login user
     * @param credentials AuthServiceLoginCredentials
     * @return Token String
     */
    static async login(credentials: AuthServiceLoginCredentials): Promise<string> {
        const { email, password } = credentials;

        try {
            const userData = await AuthRepository.getUserByEmail(email);

            if(!userData){
                throw 'USER_NOT_FOUND'
            }

            if (!(await verifyPasswordString(password, userData.password))) {
                throw 'INVALID_CREDENTIALS'
            }

            const response_session_token = await SessionService.createSession(userData)

            if(!response_session_token){
                throw 'INVALID_CREDENTIALS'
            }

            return response_session_token
        } catch (error) {
            console.error('authService.login error:', error);
            throw error;
        }
    }

    /**
     * Registre user
     * @param credentials AuthServiceRegistreCredentials
     * @return boolean
     * @throws 'INTERNAL_SERVER_ERROR' | 'CREATE_USER_AUTH_ERROR' | 'USER_ID_NOT_RETURNED'
     */
    static async register(credentials: AuthServiceRegistreCredentials): Promise<boolean> {
        try {
            const user_exist = await AuthRepository.getUserByEmail(credentials.email);
            if(user_exist){
                throw 'USER_ALREADY_EXISTS'
            }

            const user_create_response = await UserRepository.insertUser({
                name: credentials.name,
                course: credentials.course,
            });

            if(!user_create_response){
                throw 'USER_ID_NOT_RETURNED'
            }

            const auth_create_response = await AuthRepository.insertAuthUser({
                email: credentials.email,
                password: await hashPasswordString(credentials.password),
                role: 'user',
                user_id: user_create_response,
                secret: await hashCreateSecretAuth(),
                permission: 0
            });

            if(!auth_create_response){
                throw 'CREATE_USER_AUTH_ERROR'
            }

            return true;
        } catch (error) {
            console.error('authService.registre error:', error);
            throw error;
        }
    }

    /**
     * Verify session token
     * @param token Session token
     * @return boolean
     * @throws 'TOKEN_INVALID' | 'INTERNAL_SERVER_ERROR'
     */
    static async verifySession(token: string): Promise<boolean> {
        try {
            const isValid = await SessionService.verifySession(token);
            return isValid;
        } catch (error) {
            console.error('authService.verifySession error:', error);
            throw error;
        }
    }

    /**
     * Get session data from token
     * @param token Session token
     * @return Token payload
     * @throws 'TOKEN_NOT_FOUND' | 'INTERNAL_SERVER_ERROR'
     */
    static async getSession(token: string): Promise<TokenPayload> {
        try {
            const sessionData = await SessionService.getSessionData(token);
            return sessionData;
        } catch (error) {
            console.error('authService.getSession error:', error);
            throw error;
        }
    }

    /**
     * Logout user
     * @param token Session token
     * @return boolean
     * @throws 'INTERNAL_SERVER_ERROR' 
     */
    static async logout(token: string): Promise<boolean> {
        try {
            const response = await SessionService.destroySession(token);
            return response;
        } catch (error) {
            console.error('authService.logout error:', error);
            throw error;
        }
    }
}