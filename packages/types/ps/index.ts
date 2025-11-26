import { Users } from '../user';

// --------------------------------------------
// -------------- PS INTERFACES ---------------
// --------------------------------------------

export type EnumPsCardConfigState = 'COMPLETED' | 'FAILED' | 'PENDING_ACTION' | 'UNDER_REVIEW' | 'NOT_AVAILABLE';
export type cards_progress = {
    card_id: number;
    state: EnumPsCardConfigState;
    file_id?: string
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
}

export interface ps_card_configs{
    id: string;
    edition_ps: string;
    card_id: number;
    limit_date?: string;
    event_date?: string;
    event_times?: string[];
    event_location?: string;
    state: EnumPsCardConfigState
}

export interface ps_user_cards{
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

// --------------------------------------------
// ----------- BACKEND INTERFACES -------------
// --------------------------------------------

// =============== PS SERVICE ===============



// ============= PS REPOSITORY ==============

