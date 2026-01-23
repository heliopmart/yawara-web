import { FullMembers, ART } from '../index';

// --------------------------------------------
// ------------ ARTTC INTERFACES --------------
// --------------------------------------------
export type ArttcRole = 'MEMBER' | 'LEADER';
export type ActivityStatus = 'ACTIVE' | 'INACTIVE';

export interface ARTTC {
    id: string;
    title: string;
    description: string;
    art_id: string;
    status: ActivityStatus;
    code: string,
    file_id: string;
    report_file_id: string;
    type: 'PARTIAL' | 'FINAL';
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

export interface ArttcManageProps {
    title: ARTTC['title'];
    id: ARTTC['id'];
    code: ARTTC['code'];
    status: ARTTC['status'];
    file_id: ARTTC['file_id'];
    report_file_id: ARTTC['report_file_id'];
    created_at: ARTTC['created_at'];
    finish_at: ARTTC['finish_at'];
    type: ARTTC['type'];
}