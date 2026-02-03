import { ART } from "../art";
import { ps_editions } from "../ps";

// --------------------------------------------
// --------------- INTERFACES -----------------
// --------------------------------------------

export interface Nuclei {
    id: string;
    name: string;
    leader: string;
    coordinator: string;
    created_at: string;
    updated_at: string;
}

export interface Nuclei_config {
    id: string;
    nuclei_id: string;
    ps_edition_id: string;
    open_vacancies: number;
    total_members: number;
    learned_baseline_score: number;
    created_at: string;
}

export interface Nuclei_subject_weights {
    id: string;
    config_id: string;
    subject_name: string;
    weight: number;
    created_at: string;
}


// --------------------------------------------
// ----------------- BACKEND ------------------
// --------------------------------------------


// --------------- REPOSITORY -----------------

export interface SubjectWeight {
    id?: string;
    subject_name: string;
    weight: number;
    isDeleted?: boolean;
}

export interface NucleusConfigPayload {
    cycle_id: string;
    nucleus_id: string;
    open_vacancies: number;
    subjects: SubjectWeight[];
}

export interface CycleData {
    id: ps_editions['id'];
    name: ps_editions['name'];
}

export interface PsEditionAndNucleiConfigs {
    id: string;
    name: string;
    nuclei_configs: {
        id: string;
        open_vacancies: number;
        nuclei_subject_weights: SubjectWeight[]
        nuclei: {
            id: string;
            leader: string;
        }
    }[]
}

export interface NucleiRepositoryFactory {
    config_id: string,
    subjects: SubjectWeight[]
}


// ----------------- SERVICE ------------------

export interface UpdateNucleiConfigData {
    nuclei_id: string;
    nuclei_config_id?: string;
    open_vacancies: number;
    subject_weights: SubjectWeight[]
}


// --------------------------------------------
// ----------------- FRONTEND -----------------
// --------------------------------------------

export interface NucleiShowProps {
    id: Nuclei['id'];
    name: Nuclei['name'];
    description: string;
    nucleiConfig: {
        totalMembers: number;
        open_vacancies: number;
    }
    activeArts: Pick<ART, 'id' | 'title'>[]
}