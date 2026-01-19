import {FullMembers, ART} from '../index';

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

export interface ArttcsGridProps {
    id: ARTTC['id'];
    title: ARTTC['title'];
    description?: ARTTC['description'];
    type: 'ARTTC'; 
    members: Omit<FullMembers, 'role'>[];
}

// export interface createArttcProps<T extends 'ART' | 'ARTTC' = 'ART'> {
//     title: ARTTC['title'];
//     art: T extends 'ARTTC' ? ART['id'] : undefined;
//     type: T;
//     description: ARTTC['description'];
//     members: UsersArttcs['user_id'][];
// }

export interface CreateNoteBase {
    title: string;
    description: string;
    members: any[];
    art?: string;
}

export type NoteState = 
    | (CreateNoteBase & { type: 'ART' }) 
    | (CreateNoteBase & { type: 'ARTTC', art: string });