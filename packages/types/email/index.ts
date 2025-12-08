// --------------------------------------------
// ------------ EMAIL INTERFACES --------------
// --------------------------------------------

export interface sendEmailParams {
    to: string,
    subjetct: string,
    html: string
}

export interface sendChalengesEmailParams {
    to: string,
    name: string,
    user_id: string;
    edition_id: string;
    challenge_id: string;
}

// --------------------------------------------
// ------------- EMAIL TEMPLATE  --------------
// --------------------------------------------

export interface ChallengeDownloadTokenPayload {
    uid: string; 
    eid: string; 
    cid: string; 
    eml: string; 
    iat: number; 
}