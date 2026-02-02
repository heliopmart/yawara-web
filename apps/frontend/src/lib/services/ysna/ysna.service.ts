import {YsnaEvaluateHistoryResponse} from '@yawara/types'

export class YsnaService {
    private baseUrl: string;
    private token?: string;

    constructor() {
        this.baseUrl = process.env.PYTHON_SERVICE_YSNA_URL || '';
        this.token = process.env.YSNA_INTERNAL_TOKEN;
    }

    /**
     * Fetch the evaluation history for a given candidate ID.
     * @param candidate_id - The ID of the candidate whose evaluation history is to be fetched.
     * @returns A promise that resolves to the evaluation history response.
     */
    async evaluateHistory(candidate_id: string): Promise<YsnaEvaluateHistoryResponse> {
        const headers: HeadersInit = {};
        if (this.token) {
            headers["X-YSNA-INTERNAL-TOKEN"] = this.token;
        }

        try {
            const response = await fetch(`${this.baseUrl}/evaluate/${candidate_id}`, { 
                method: 'POST',
                headers
            });

            if (!response.ok) {
                throw new Error(`Y-SNA Error: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('YsnaService.evaluateHistory error:', error);
            throw error; 
        }
    }

    /**
     * Get a preview PDF for the provided file.
     * @param file - The file to be sent for preview generation.
     * @returns A promise that resolves to the response containing the PDF preview.
     */
    async getPreview(file: File): Promise<Response> {
        const formData = new FormData();
        formData.append('file', file);

        const headers: HeadersInit = {};
        
        if (this.token) {
            headers["X-YSNA-INTERNAL-TOKEN"] = this.token;
        }

        try {
            const response = await fetch(`${this.baseUrl}/ysna/preview`, {
                method: 'POST',
                body: formData,
                headers
            });

            if (!response.ok) {
                throw 'YSNA_PROCESSING_ERROR';
            }

            return response;

        } catch (error) {
            console.error('YsnaService.getPreview error:', error);
            throw error;
        }
    }

    /**
     * Generate a Valence Forge report.
     * @returns A promise that resolves to the response containing the Valence Forge report.
     * @throws An error if the request fails.
     */
    async forgeValenceReport(): Promise<Response> {
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
        };

        if (this.token) {
            headers["X-YSNA-INTERNAL-TOKEN"] = this.token;
        }

        try {
            const response = await fetch(`${this.baseUrl}/valence/forge`, {
                method: 'POST',
                headers
            });

            if (!response.ok) {
                console.error(`Y-SNA Error [valence/forge]: ${response.status} ${response.statusText}`);
                throw 'YSNA_PROCESSING_ERROR';
            }

            return response;

        } catch (error) {
            console.error('YsnaService.forgeValenceReport error:', error);
            throw error;
        }
    }
}