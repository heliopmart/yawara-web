import { Users, WpaSubscription, Team, ps_card_configs, cards_progress, ps_editions} from '../';

// --------------------------------------------
// ----------- REPOSITORY INTERFACES -----------
// --------------------------------------------

export enum WpaNotificationType {
    ART = 'ART',
    ARTTC = 'ARTTC',
    PS = 'PS_EDITION',
    SYSTEM = 'SYSTEM',
    LEADER = 'LEADER',
    OTHERS = 'OTHERS'
}

export interface WpsNotification {
    id: string;
    type: WpaNotificationType;
}

export interface WpaLog {
    timestamp: string;
    wps_notification: WpsNotification | WpsNotification[];
}

export interface WPA {
    id: string;
    type: WpaNotificationType;
    user_id: Users['id']
    resource_id: string;
    created_at: string;
    wpa_log: WpaLog | WpaLog[];
}

type UUID = string;

export interface WPADataPayload {
    users: Pick<Users, 'id'| 'name' | 'wpa_subscription'>[];
    edition: Pick<ps_editions, 'id' | 'finish_date' | 'registration_closing' | 'is_completed'> | null;
    leaders: Team[];
    user_cards: { id: UUID; user_id: UUID; edition_id: UUID; cards_progress: cards_progress[] }[];
    card_configs: Pick<ps_card_configs, 'id' | 'event_date' | 'deadline' | 'location' | 'start_time'>[];
    teams_by_nuclei: Record<string, Team[]>;
};



// --------------------------------------------
// ----------- SERVICES INTERFACES ------------
// --------------------------------------------

export interface WpaData {
    subscription: WpaSubscription;
    title: string;
    body: string;
    wpa: Pick<WPA, 'resource_id' | 'type' | 'user_id' | 'wpa_log'>;
}

export interface WpaRawData {
    user_id: string;
    subscription: WpaSubscription;
    resource_id: string;
    type: WpaNotificationType;
    resource_title: string;
}
