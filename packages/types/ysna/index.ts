// --------------------------------------------
// ----------- RESPONSES INTERFACES -----------
// --------------------------------------------

export interface YsnaEvaluateHistoryResponse {
    message: string;
    details: {
        processed: number;
        success: boolean;
        xai?: any;
        pdf_bytes?: string;
        candidate_id?: string;
    }
}

// --------------------------------------------
// ----------- SERVICES INTERFACES ------------
// --------------------------------------------
