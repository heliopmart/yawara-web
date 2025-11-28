import { getRows, insertRow, updateRow } from '@/utils/bd'
import { supabaseAdmin, create_rls_client } from '@/lib/db'
import { UserRespositoryUserDataById, Users, TokenPayload, MyAccountUserDataRepository } from '@yawara/types';

export class UserRepository {
    private static userTableName = 'users';
    private auth: TokenPayload;
    private bd: ReturnType<typeof create_rls_client>;

    constructor(auth: TokenPayload) {
        this.auth = auth;
        this.bd = create_rls_client(this.auth?.supabaseToken ?? null);
    }


    // ----------------------------------------------
    // ---------------- GET METHODS -----------------
    // ----------------------------------------------


    async getMyAccountUserData(): Promise<MyAccountUserDataRepository> {
        try {
            // TODO: Puxar ART, ARTTS

            const res = await getRows<MyAccountUserDataRepository>({
                table: UserRepository.userTableName,
                columns: `
                    id, 
                    name, 
                    phone,
                    
                    nucleus: nuclei!nuclei_leader_fkey ( id, name ),                    
                    auth: auth!auth_user_id_fkey ( email, role ),
                    
                    users_arts: users_arts!users_arts_user_id_fkey (
                        role,
                        art: arts!users_arts_art_id_fkey (
                            title,
                            description,
                            status,
                            code
                        )
                    ),

                    users_arttcs: users_arttcs!users_arttcs_user_id_fkey (
                        arttc: arttcs!users_arttcs_arttc_id_fkey (
                            title,
                            description,
                            status,
                            code
                        )
                    )
                `,
                bd: this.bd || null,
                filters: [{ column: 'id', op: 'eq', value: this.auth.user_id }],
                single: true
            })

            if (!res) {
                throw 'USER_NOT_FOUND_ERROR';
            }

            return res as MyAccountUserDataRepository;
        } catch (error) {
            console.error('UserRepository.getMyAccountUserData error:', error);
            throw 'INTERNAL_SERVER_ERROR';
        }
    }


    // ----------------------------------------------
    // -------------- UPDATE METHODS ----------------
    // ----------------------------------------------

    async update(data: Partial<Users>): Promise<boolean> {
        try {
            const res = await updateRow({
                table: UserRepository.userTableName,
                data: data,
                uid: this.auth.user_id,
                authBd: this.bd || null,
            })

            if (!res.success) {
                throw 'UPDATE_USER_ERROR';
            }

            return res.success;
        } catch (error) {
            console.error('UserRepository.update error:', error);
            throw 'INTERNAL_SERVER_ERROR';
        }
    }


    // ----------------------------------------------
    // --------------- INSERT METHODS ---------------
    // ----------------------------------------------

    /**
     * Insert user
     * @param credentials UserRespositoryUserDataById
     * @return boolean
     * @throws 'INTERNAL_SERVER_ERROR' | 'CREATE_USER_AUTH_ERROR'
     */
    static async insertUser(credentials: UserRespositoryUserDataById): Promise<Users['id']> {
        try {
            const bd = supabaseAdmin
            const res = await insertRow<Users, UserRespositoryUserDataById>({
                table: UserRepository.userTableName,
                insertData: credentials,
                bd: bd,
            })

            if (!res.status) {
                throw 'CREATE_USER_ERROR';
            }

            return res.data.id;
        } catch (error) {
            console.error('UserRepository.insertUser error:', error);
            throw 'INTERNAL_SERVER_ERROR';
        }
    }
}