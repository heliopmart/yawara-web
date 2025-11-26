import {Users} from '../user'

// --------------------------------------------
// ------------ AUTH INTERFACES --------------
// --------------------------------------------

export type AuthRole = 'user' | 'admin' | 'leader' | 'nucleiLeader' | 'developer';

export interface Auth {
    id: string;
    email: string;
    password: string;
    role: AuthRole;
    secret: string;
    user_id: Users['id'];
    permission: number;
    createdAt: string;
    updatedAt: string;
}


// --------------------------------------------
// ----------- BACKEND INTERFACES -------------
// --------------------------------------------

// =============== AUTH SERVICE ===============

export interface AuthServiceLoginCredentials {
    email: Auth['email'];
    password: Auth['password'];
}   

export interface AuthServiceRegistreCredentials {
    email: Auth['email'];
    name: Users['name'];
    course: Users['course'];
    password: Auth['password'];
}   

// ============== AUTH REPOSITORY =============

export interface AuthRespositoryUserDataByEmail {
    password: Auth['password'];
    role: Auth['role'];
    id: Auth['id'];
    secret: Auth['secret'];
    user_id: Auth['user_id'];
}

export interface AuthRespositoryInsertData {
    email: Auth['email'];
    password: Auth['password'];
    role: Auth['role'];
    secret: Auth['secret'];
    user_id: Auth['user_id'];
    permission: Auth['permission'];
}

// =============== AUTH TOKEN ==================

export interface TokenPayload {
    user_id: Users['id'];
    role: Auth['role'];
    secret: Auth['secret'];
    supabaseToken?: string;
}

// --------------------------------------------
// ----------- FRONTEND INTERFACES ------------
// --------------------------------------------