import {Users} from '../user'

// --------------------------------------------
// ------------ AUTH INTERFACES --------------
// --------------------------------------------

export type AuthRole =  'GUEST' | 'MEMBER' | 'LEADER' | 'ADMIN' | 'DEVELOPER' | 'USER' | 'MODERATOR';

export interface Auth {
    id: string;
    email: string;
    password: string;
    role: AuthRole;
    secret: string;
    user_id: Users['id'];
    permission: number;
    is_active: boolean;
    createdAt: string;
    updatedAt: string;
    disabled_at: string | null;
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
    yearOfEntry: number;
    course: Users['course'];
    password: Auth['password'];
}   

export interface ResetPasswordCredentials {
    email: Auth['email'];
    password: Auth['password'];
    hash: string;
}

export interface AuthLoginResponse{
    token: string;
    role: Auth['role'];
}

// ============== AUTH REPOSITORY =============

export interface AuthRespositoryUserDataByEmail {
    password: Auth['password'];
    role: Auth['role'];
    id: Auth['id'];
    secret: Auth['secret'];
    user_id: Auth['user_id'];
    is_active: Auth['is_active'];
    disabled_at: Auth['disabled_at'];
    nuclei_id: string | null;
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
    nuclei_id: string | null;
}

// --------------------------------------------
// ----------- FRONTEND INTERFACES ------------
// --------------------------------------------

interface CourseGroup {
  college: string;
  courses: string[];
}
export interface AuthFormProps {
  type: 'login' | 'register' | 'forgot';
  title: string;
  fields: {
    name: string;
    label: string;
    type: string;
    minLength?: number;
    options?: string[] | CourseGroup[];
  }[];
  buttonText: string;
  error: { message: string } | null;
  onForgotPassword?: () => void;
  onSubmit: (data: Record<string, string>) => void;
}
export interface AuthErrorRespose {
  code: string;
  path: string;
  message: string;
}