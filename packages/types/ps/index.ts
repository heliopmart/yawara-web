import { Users } from '../user';
import {Nuclei, Nuclei_config} from '../nuclei'

// --------------------------------------------
// -------------- PS INTERFACES ---------------
// --------------------------------------------

export type EnumPsCardConfigState = 'COMPLETED' | 'FAILED' | 'PENDING_ACTION' | 'UNDER_REVIEW' | 'NOT_AVAILABLE';

type BaseCardProgress = {
    card_id: number;
    state: EnumPsCardConfigState;
}

type FileOnlyProgress = BaseCardProgress & {
    file_id: string;
    notes?: never;
};

type NotesOnlyProgress = BaseCardProgress & {
    notes: Record<string, number>;
    file_id?: never;
};

type FullProgress = BaseCardProgress & {
    file_id: string;
    notes: Record<string, number>;
};

export type cards_progress = FileOnlyProgress | NotesOnlyProgress | FullProgress;
export interface ps_editions {
    id: string;
    name: string;
    progress: number;
    is_active: boolean;
    start_date: string;
    finish_date: string;
    final_result_doc?: string;
    created_at: string;
    is_completed: boolean
    registration_closing: string; // prazo final de inscrição
}

export type ps_card_config_type = 'DOCUMENT_SUBMISSION' | 'PRESENCE_EVALUATION';
export interface ps_card_configs {
    // card display
    id: string;
    title: string;
    type: ps_card_config_type;
    description?: string;
    // card config
    state: EnumPsCardConfigState
    edition_ps: string;
    card_id: number;
    // optional fields for presence event
    start_time?: string;
    end_time?: string;
    location?: string;
    event_date?: string;
    // optional fields for document submission
    deadline?: string;

    updated_at: string;
    created_at: string;
}

export interface ps_user_cards {
    id: string;
    user_id: Users['id'];
    edition_id: ps_editions['id'];
    cards_progress: cards_progress[];
    is_eligible: boolean;
    is_waiting_result: boolean;
    show_final_result: boolean;
    nuclei_eligible?: string[];
    nuclei_chosen?: string[];
    final_result_doc?: string;
    is_accepted: boolean
    created_at: string;
    updated_at: string;
}

export interface ps_full_data extends ps_editions {
    ps_card_configs: ps_card_configs[];
    ps_user_cards: ps_user_cards[];
}

export interface Challenges {
    id: string;
    title: string;
    description: string;
    difficulty: 'EASY' | 'MEDIUM' | 'HARD';
    content_text: string;
    rules: string[] ;
    stack: string[]
    created_at: string;
}

type CandidateBase = Pick<ps_user_cards, 'id' | 'user_id' | 'cards_progress' | 'nuclei_chosen'>;

export interface SelectionProcessEngineData {
    edition: Pick<ps_editions, 'id' | 'name'>;
    candidates: CandidateBase[];
    nuclei: (Pick<Nuclei, 'id' | 'name'> & Pick<Nuclei_config, 'open_vacancies' | 'total_members'>)[]
}
export interface RankedCandidate extends CandidateBase {
    finalScore: number;
    status?: 'PENDING' | 'APPROVED' | 'REJECTED';
}

// --------------------------------------------
// ----------- BACKEND INTERFACES -------------
// --------------------------------------------

// =============== PS SERVICE ===============

export interface createPsEdition {
    name: ps_editions['name']
    start_date: ps_editions['start_date'];
    finish_date: ps_editions['finish_date'];
    registration_closing: ps_editions['registration_closing'];
    cards_config: Omit<ps_card_configs, 'id' | 'edition_ps' | 'updated_at' | 'created_at'>[];
}

export interface BatchPresenceItem {
    user_card_id: string;
    card_id: number;
    is_presence: boolean;
}

export interface BatchNotesItem {
    user_card_id: string;
    card_id: number;
    notes: Record<string, number>;
}

export interface downloadChanllengeData extends Challenges {
    edition_name: string;
    student_name: string;
}

export type checkAndProcessClosingResponse = 'NO_ACTIVE_EDITION' | 'PROCESS_COMPLETED' | 'NOT_YET_TIME' | 'ALREADY_PROCESSED';

// ============= PS REPOSITORY ==============

export interface AdminUserCardsProgress {
    id: ps_user_cards['id'];
    cards_progress: ps_user_cards['cards_progress'];
    nuclei_eligible: ps_user_cards['nuclei_eligible'];
    nuclei_chosen: ps_user_cards['nuclei_chosen'];
}
export interface UserProgressContext {
    id: ps_user_cards['id'];
    cards_progress: ps_user_cards['cards_progress'];
    edition: {
        id: ps_editions['id'];
        is_active: ps_editions['is_active'];
        is_completed: ps_editions['is_completed'];
    }
}

export interface processRegistrationClosingResponse {
    user_id: string; 
    user_email: string;
    user_name: string;
    challenge_id: string;
    edition_id: string;
}

export interface PsEditionAvailable {
    id: ps_editions['id'];
    is_active: ps_editions['is_active'];
    start_date: ps_editions['start_date'],
    finish_date: ps_editions['finish_date'],
    final_result_doc: ps_editions['final_result_doc'],
    is_completed: ps_editions['is_completed'];
    registration_closing: ps_editions['registration_closing'];
}

export interface CardConfigParams {
    card_id: ps_card_configs['card_id'];
    deadline?: ps_card_configs['deadline'];
    event_date?: ps_card_configs['event_date'];
    event_times?: ps_card_configs['start_time' | 'end_time'][];
    event_location?: ps_card_configs['location'];
    state?: ps_card_configs['state'];
}

export interface PsUserPresence {
    id: ps_editions['id'];
    ps_user_cards: {
        id: ps_user_cards['id'];
        user: {
            name: Users['name'];
        }
        is_eligible: ps_user_cards['is_eligible'];
    }[];
}

export interface DashboardPresenceResponse {
    id: ps_editions['id'];
    candidates: Candidate[];
    ps_card_configs: ps_card_configs[];
}

// --------------------------------------------
// ---------- FRONTEND INTERFACES -------------
// --------------------------------------------

export interface CardConfig {
    card_id: ps_card_configs['card_id'];
    deadline?: ps_card_configs['deadline'];
    event_date: ps_card_configs['event_date'];
    event_location: ps_card_configs['location'];
    event_times: NonNullable<ps_card_configs['start_time' | 'end_time']>[];
}

export interface EditionData {
    name: ps_editions['name'];
    start_date: ps_editions['start_date'];
    finish_date: ps_editions['finish_date'];
}

export interface Candidate {
    id: string;
    name: string;
    edition_id: string;
    cards_progress: cards_progress[];
    is_eligible: boolean;
    is_accepted: boolean
}

// --------------------------------------------
// -------- HYDRATATION INTERFACES ------------
// --------------------------------------------

export interface ReportPayload {
    candidate_name: string;
    candidate_id: string;
    process_name: string;
    process_id: string;
    last_row_update_datetime: string;
    forge_score: number;
    corridor_score: number;
    gate_score: number;
    alpha: number;
    beta: number;
    gamma: number;
    final_score: number;
    final_score_percent: number;
    score_top1: number;
    score_top2: number;
    score_top3: number;
    accepted_nucleus?: string;
    nucleus_leader_name?: string;
    nucleus_member_count?: number;
    nucleus_capacity?: number;
    is_accepted: boolean;
    missing_skills?: string[]; 
    nucleiEligible?: string[];
    nucleiChosen?: string[];
    sing_hash: string;
}

export interface EditionFinalResultPayload {
  edition_name: string;
  edition_id: string;
  edition_created_at: string;
  edition_finish_date: string;
  
  engine_version: "v1" | "v2";
  engine_mode: string;
  
  approved_candidates: {
    rank: number;
    candidate_name: string;
    candidate_id: string; 
    score: number;
    allocated_nucleus: string;
  }[];

  generation_timestamp: string;
  sing_hash: string;
}