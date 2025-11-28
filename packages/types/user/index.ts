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
}


export interface MyAccountUserData {
  id: Users['id'];
  name: Users['name'];
  phone: Users['phone'];
  nucleus: {
    name: string;
    id: string;
  };
  initials: string;
}

// --------------------------------------------
// ----------- BACKEND INTERFACES -------------
// --------------------------------------------

// =============== USER SERVICE ===============



// ============= USER REPOSITORY ==============

export interface UserRespositoryUserDataById {
    name: Users['name'];
    course: Users['course'];
}

// export interface MyAccountUserDataRepository extends MyAccountUserData {
//   auth: {
//     email: Auth['email'],
//     role: Auth['role'],
//   }
// }

export interface MyAccountUserDataRepository extends MyAccountUserData {
    auth: Pick<Auth, 'email' | 'role'>;
    users_arts: {
        role: UsersArts['role'];         
        art: Pick<ART, 'title' | 'description' | 'status' | 'code'>;
    }[];
    users_arttcs: {
        arttc: Pick<ARTTC, 'title' | 'description' | 'status' | 'code'>;
    }[];
}