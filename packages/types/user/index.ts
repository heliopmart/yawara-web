// --------------------------------------------
// ------------ AUTH INTERFACES --------------
// --------------------------------------------

export interface Users{
    id: string;
    name: string;
    course: string;
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