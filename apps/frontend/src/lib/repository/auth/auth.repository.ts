import { getRows, insertRow, updateRow, callRpc } from '@/utils/bd'
import { supabaseAdmin, create_rls_client } from '@/lib/db'
import { AuthServiceLoginCredentials, AuthRespositoryUserDataByEmail, AuthRespositoryInsertData, TokenPayload } from '@yawara/types';

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

            // ---- not used anymore but kept for reference ----
            // const res = await getRows({
            //     table: this.authTableName,
            //     columns: `password, role, id, secret, user_id, is_active, disabled_at, nuclei_id`,
            //     bd: bd,
            //     filters: [{ column: 'email', op: 'eq', value: email }],
            //     single: true
            // })

            const res = await callRpc<AuthRespositoryUserDataByEmail[] | null>({
                bd: bd,
                functionName: 'get_user_auth_data',
                params: { email_param: email }
            })

            if (res) {
                return (res.data as unknown as AuthRespositoryUserDataByEmail[])[0] ;
            }

            return null
        } catch (error) {
            console.error('AuthRepository.getUserByEmail error:', error);
            throw 'INTERNAL_SERVER_ERROR';
        }
    }

    static async getAuthDataById(auth: TokenPayload): Promise<AuthRespositoryUserDataByEmail | null> {
        try {
            const bd = create_rls_client(auth.supabaseToken ?? null);
            const res = await getRows({
                table: this.authTableName,
                columns: `email, role`,
                bd: bd,
                filters: [{ column: 'user_id', op: 'eq', value: auth.user_id }],
                single: true
            })

            if (res) {
                return res;
            }

            return null
        } catch (error) {
            console.error('AuthRepository.getAuthDataById error:', error);
            throw 'INTERNAL_SERVER_ERROR';
        }
    }

    // ----------------------------------------------
    // -------------- UPDATE METHODS ----------------
    // ----------------------------------------------

    /**
     * Disable user account
     * @param user_id String
     * @return boolean
     * @throws 'INTERNAL_SERVER_ERROR' | 'DISABLE_USER_ERROR'
     */
    static async disableAccount(user_id: string): Promise<boolean> {
        try {
            const bd = supabaseAdmin
            const res = await updateRow({
                table: this.authTableName,
                data: { is_active: false, disabled_at: new Date().toISOString() },
                where: [{ column: 'user_id', op: 'eq', value: user_id }],
                authBd:bd,
            })
            if (!res.success) {
                throw 'DISABLE_USER_ERROR';
            }
            return res.success;
        } catch (error) {
            console.error('UserRepository.disableAccount error:', error);
            throw 'INTERNAL_SERVER_ERROR';
        }
    }

    /**
     *  Recover user account
     * @param auth_id String
     * @return boolean
     * @throws 'INTERNAL_SERVER_ERROR' | 'RECOVER_USER_ERROR'
     */
    static async recoverAccount(auth_id: string): Promise<boolean> {
        try {
            const bd = supabaseAdmin
            const res = await updateRow({
                table: this.authTableName,
                data: { is_active: true, disabled_at: null },
                where: [{ column: 'id', op: 'eq', value: auth_id }],
                authBd:bd,
            })
            if (!res.success) {
                throw 'RECOVER_USER_ERROR';
            }
            return res.success;
        } catch (error) {
            console.error('AuthRepository.recoverAccount error:', error);
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