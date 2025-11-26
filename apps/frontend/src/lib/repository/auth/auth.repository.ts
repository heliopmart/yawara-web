import { getRows, insertRow } from '@/utils/bd'
import { supabaseAdmin } from '@/lib/db'
import { AuthServiceLoginCredentials, AuthRespositoryUserDataByEmail, AuthRespositoryInsertData } from '@yawara/types';

export class AuthRepository {
    private static authTableName = 'auth';

    // ----------------------------------------------
    // ---------------- GET METHODS -----------------
    // ----------------------------------------------

    /**
     * Get user by email
     * @param email String
     * @return user data
     */
    static async getUserByEmail(email: AuthServiceLoginCredentials['email']): Promise<AuthRespositoryUserDataByEmail | null> {
        try {
            const bd = supabaseAdmin
            const res = await getRows({
                table: this.authTableName,
                columns: `password, role, id, secret, user_id`,
                bd: bd,
                filters: [{ column: 'email', op: 'eq', value: email }],
                single: true
            })

            if (res) {
                return res;
            }

            return null
        } catch (error) {
            console.error('AuthRepository.getUserByEmail error:', error);
            throw 'INTERNAL_SERVER_ERROR';
        }
    }

    // ----------------------------------------------
    // --------------- INSERT METHODS ---------------
    // ----------------------------------------------

    /**
     * Insert auth user
     * @param credentials AuthRespositoryRegistreData
     * @return boolean
     * @throws 'INTERNAL_SERVER_ERROR' | 'CREATE_USER_AUTH_ERROR'
     */
    static async insertAuthUser(credentials: AuthRespositoryInsertData): Promise<boolean> {
        try {
            const bd = supabaseAdmin
            const res = await insertRow({
                table: this.authTableName,
                insertData: credentials,
                bd: bd,
            })

            if (!res.status) {
                throw 'CREATE_USER_AUTH_ERROR';
            }

            return true;
        } catch (error) {
            console.error('AuthRepository.registre error:', error);
            throw 'INTERNAL_SERVER_ERROR';
        }
    }
}