import { Auth } from '../auth';
import { ART, UsersArts } from '../art';
import { ARTTC } from '../arttc';
// --------------------------------------------
// ------------ AUTH INTERFACES --------------
// --------------------------------------------

export interface Users{
    id: string;
    name: string;
    course: string;
    phone: string;
    semester: number;
    wpa_enabled: boolean;
    wpa_subscription: WpaSubscription | null;
}


export interface MyAccountUserData {
  id: Users['id'];
  name: Users['name'];
  phone: Users['phone'];
  wpa_enabled: Users['wpa_enabled'];
  wpa_subscription: Users['wpa_subscription'];
  nucleus: {
    name: string;
    id: string;
  };
  initials: string;
}

export interface WpaSubscription {
    endpoint: string;
    expirationTime: number | null;
    keys: {
        p256dh: string;
        auth: string;
    };
}


// --------------------------------------------
// ----------- BACKEND INTERFACES -------------
// --------------------------------------------

// =============== USER SERVICE ===============


// ============= USER REPOSITORY ==============

export interface UserRespositoryUserDataById {
    name: Users['name'];
    course: Users['course'];
    semester: Users['semester']
    wpa_enabled: Users['wpa_enabled'];
    wpa_subscription: Users['wpa_subscription'];
}


export interface MyAccountUserDataRepository extends MyAccountUserData {
    auth: Pick<Auth, 'email' | 'role'>;
    users_arts: {
        role: UsersArts['role'];         
        art: Pick<ART, 'id' | 'title' | 'description' | 'status' | 'code'>;
    }[];
    users_arttcs: {
        arttc: Pick<ARTTC, 'id' | 'title' | 'description' | 'status' | 'code'>;
    }[];
}