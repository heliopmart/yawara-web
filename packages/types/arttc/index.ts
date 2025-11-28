// --------------------------------------------
// ------------ ARTTC INTERFACES --------------
// --------------------------------------------
export type ArttcRole = 'MEMBER' | 'LEADER';

export interface ARTTC {
    id: string;
    title: string;
    description: string;
    art_id: string;
    status:ArttcRole;
    code: string,
    file_id: string;
    updated_at: string;
    finish_at: string | null;
    created_at: string;
}

export interface UsersArttcs {
    id: string;
    user_id: string;
    arttc_id: string;
}


// --------------------------------------------
// ----------- BACKEND INTERFACES -------------
// --------------------------------------------

// =============== ARTTC SERVICE ===============



// ============== ARTTC REPOSITORY =============


// --------------------------------------------
// ----------- FRONTEND INTERFACES ------------
// --------------------------------------------