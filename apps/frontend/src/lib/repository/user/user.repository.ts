import { getRows, insertRow } from '@/utils/bd'
import { supabaseAdmin } from '@/lib/db'
import { UserRespositoryUserDataById, Users } from '@yawara/types';

export class UserRepository {
    private static userTableName = 'user';

    // ----------------------------------------------
    // ---------------- GET METHODS -----------------
    // ----------------------------------------------



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
                table: this.userTableName,
                insertData: credentials,
                bd: bd,
            })

            if(!res.status){
                throw 'CREATE_USER_ERROR';
            }

            return res.data.id;
        }catch (error) {
            console.error('UserRepository.insertUser error:', error);
            throw 'INTERNAL_SERVER_ERROR';
        }
    }
}