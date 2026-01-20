import { Users, ArttcsGridProps, ArtsGridProps } from '../index';;

// --------------------------------------------
// ------------ TEAM INTERFACES --------------
// --------------------------------------------

export type TeamRole = 'MEMBER' | 'LEADER' | 'MODERATOR';

export interface Team {
    id: string;
    user_id: string;
    nuclei_id: string;
    art_id: string;
    arttc_id: string;
    status: boolean;
    candidate_entry: string;
    ps_entry: string;
    posted_notes: boolean;
    role: TeamRole
    warnings: number;
}

export interface TeamNotesHistory {
    id: string;
    team_id: string;
    semester_id: string;
    user: string; // ? bd = user_id
    n_social: TeamNoteNSocial;
    n_tech: TeamNoteNTech;
}

export interface TeamNoteNSocial {
    proactivity: number;
    participation: number;
}

export interface TeamNoteNTech {
    reports: number;
    delivery: number;
}


// --------------------------------------------
// ----------- BACKEND INTERFACES -------------
// --------------------------------------------

// =============== TEAM SERVICE ===============



// ============== TEAM REPOSITORY =============

export interface myTeamDataProps {
    art: ArtsGridProps[];
    arttc: ArttcsGridProps[];
    news: [];
    tasks: [];
}

// --------------------------------------------
// ----------- FRONTEND INTERFACES ------------
// --------------------------------------------

export type ScoreCategory = 'n_social' | 'n_tech';

export interface TeamMember {
    id: Team['id'];
    art_id: Team['art_id'];
    arttc_id: Team['arttc_id'];
    user : Pick<Users, 'id' | 'name'>;
    role: Team['role'];
    warnings: Team['warnings'];
    posted_notes: Team['posted_notes']

    semester_id: TeamNotesHistory['semester_id'];
    n_social: TeamNoteNSocial;
    n_tech: TeamNoteNTech;
}

export interface TeamMemberMinify {
    id: Team['id'];
    user: Pick<Users, 'id' | 'name'>;
    role: Team['role'];
    warnings: Team['warnings'];
}