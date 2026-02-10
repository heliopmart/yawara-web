import { Users, ARTTC, Team } from '../index';

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

// USING IN ART AND ARTTC GRID COMPONENTS
export interface FullMembers {
    id: UsersArts['id'];
    user_id: {
        id: Users['id'];
        name: Users['name'];
    };
    role: UsersArts['role'];
}

export interface ArtsGridProps {
    id: ART['id'];
    title: ART['title'];
    description?: ART['description'];
    type: 'ART';
    members: FullMembers[];
}

export interface ArtMinify {
    id: ART['id'];
    title: ART['title'];
}

export interface ArtManageProps {
    title: ART['title']
    description: ART['description'];
    file_id: ART['file_id'];
    status: ART['status'];
    members: {
        team_id: Team['id'];
        name: Users['name'];
        role: UsersArts['role'];
    }[];
    arttc: {
        title: ARTTC['title'];
        id: ARTTC['id'];
        code: ARTTC['code'];
        status: ARTTC['status'];
        file_id: ARTTC['file_id'];
        report_file_id: ARTTC['report_file_id'];
        created_at: ARTTC['created_at'];
        finish_at: ARTTC['finish_at'];
        type: ARTTC['type'];
    }[]
}
