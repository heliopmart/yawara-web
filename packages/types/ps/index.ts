import { Users } from '../user';

// --------------------------------------------
// -------------- PS INTERFACES ---------------
// --------------------------------------------

export type EnumPsCardConfigState = 'COMPLETED' | 'FAILED' | 'PENDING_ACTION' | 'UNDER_REVIEW' | 'NOT_AVAILABLE';
export type cards_progress = {
    card_id: number;
    state: EnumPsCardConfigState;
    file_id?: string | null
}

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
    registration_closing: string;
}

export interface ps_card_configs {
    id: string;
    edition_ps: string;
    card_id: number;
    limit_date?: string;
    event_date?: string;
    event_times?: string[];
    event_location?: string;
    state: EnumPsCardConfigState
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

// --------------------------------------------
// ----------- BACKEND INTERFACES -------------
// --------------------------------------------

// =============== PS SERVICE ===============

export interface createPsEdition {
    name: ps_editions['name']
    start_date: ps_editions['start_date'];
    finish_date: ps_editions['finish_date'];
    registration_closing: ps_editions['registration_closing'];
    cards_config: CardConfigParams[];
}

export interface BatchPresenceItem {
    user_card_id: string;
    card_id: number;
    is_presence: boolean;
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
    limit_date?: ps_card_configs['limit_date'];
    event_date?: ps_card_configs['event_date'];
    event_times?: ps_card_configs['event_times'];
    event_location?: ps_card_configs['event_location'];
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

// Adicione em seus types
export interface DashboardPresenceResponse {
    id: ps_editions['id'];
    in_person_cards: {
        card_id: ps_card_configs['card_id'];
        location: ps_card_configs['event_location'];
        date: ps_card_configs['event_date'];
        times: NonNullable<ps_card_configs['event_times']>;
    }[];
    participants: {
        id: ps_user_cards['id'];
        user_id: ps_user_cards['user_id'];
        name: Users['name'];
        progress: {
            card_id: cards_progress['card_id'];
            state: EnumPsCardConfigState
            file_id?: cards_progress['file_id'];
        }[];
    }[];
}

// --------------------------------------------
// ---------- FRONTEND INTERFACES -------------
// --------------------------------------------

export interface CardConfig {
    card_id: ps_card_configs['card_id'];
    limit_date: ps_card_configs['limit_date'];
    event_date: ps_card_configs['event_date'];
    event_location: ps_card_configs['event_location'];
    event_times: NonNullable<ps_card_configs['event_times']>;
}

export interface EditionData {
    name: ps_editions['name'];
    start_date: ps_editions['start_date'];
    finish_date: ps_editions['finish_date'];
}