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