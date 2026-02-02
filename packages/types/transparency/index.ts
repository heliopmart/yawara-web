import {ART, ARTTC, Tool, ps_editions} from '../'

// --------------------------------------------
// ---------------- INTERFACES ----------------
// --------------------------------------------


type TransparencyArt = Pick<ART, 'id' | 'title' | 'file_id' | 'status'> & {
  arttcs: (Pick<ARTTC, 'id' | 'title' | 'file_id'> & {
    report: ARTTCCReport | null; 
    responsible: string;
  })[]; 
};

type ITransparencyPsEdition = Pick<ps_editions, 'id' | 'name' | 'final_result_doc'>; 



export interface ARTTCCReport {
  name: string;
  file_id: string;
  delivery_date?: string;
}

export interface TransparencyNucleus {
  name: string;
  arts: TransparencyArt[];
}

export interface FinancialTransaction {
  id: string;
  description: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  date: string;
  receipt_file_id?: string;
}

export interface FinancialData {
  balance: number;
  history: FinancialTransaction[];
}


export interface TransparencyResponse {
    nuclei: TransparencyNucleus[];
    inventory: (Pick<Tool, 'id' | 'name' | 'status' | 'last_used_at'> & {assigned_to: string})[];
    financial: FinancialData;
    ps_editions: ITransparencyPsEdition[] ;
}

// --------------------------------------------
// ----------- SERVICES INTERFACES ------------
// --------------------------------------------



// --------------------------------------------
// ----------- FRONTEND INTERFACES ------------
// --------------------------------------------
