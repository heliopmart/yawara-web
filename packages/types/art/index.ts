// --------------------------------------------
// ------------ ART INTERFACES --------------
// --------------------------------------------

export type ActivityStatus = 'ACTIVE' | 'FINALIZED';
export type ArtRole = 'MEMBER' | 'LEADER';

export interface ART {
    id: string;
    title: string;
    description: string;
    nuclei_id: string;
    status: ActivityStatus;
    code: string,
    file_id: string;
    updated_at: string;
    finish_at: string | null;
    created_at: string;
}

export interface UsersArts {
    id: string;
    user_id: string;
    art_id: string;
    role: ArtRole;
}

// --------------------------------------------
// ----------- BACKEND INTERFACES -------------
// --------------------------------------------

// =============== ART SERVICE ===============



// ============== ART REPOSITORY =============


// --------------------------------------------
// ----------- FRONTEND INTERFACES ------------
// --------------------------------------------