// --------------------------------------------
// --------- CERTIFICATE INTERFACES------------
// --------------------------------------------

export interface CertificateData {
  id?: string;
  is_valid: boolean;
  student_name: string;
  course_name: string;
  issue_date: string;
  hours: number;
  cpf: string;
}

// --------------------------------------------
// --------- CERTIFICATE BACKEND --------------
// --------------------------------------------

// ---------------- REPOSITORY ----------------

export interface CreateCerticatePayload {
  student_name: CertificateData['student_name'];
  course_name: CertificateData['course_name'];
  hours: CertificateData['hours'];
  cpf: CertificateData['cpf'];
}

// --------------------------------------------
// --------- CERTIFICATE FRONTEND -------------
// --------------------------------------------


export type CertificateFormFields = {
  cpf: CertificateData['cpf'];
  student_name: CertificateData['student_name'];
  course_name: CertificateData['course_name'];
  hours: string;
};