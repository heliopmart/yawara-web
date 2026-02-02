import { Client, Receiver } from "@upstash/qstash";

const QSTASH_TOKEN = process.env.QSTASH_TOKEN;
const QSTASH_CURRENT_SIGNING_KEY = process.env.QSTASH_CURRENT_SIGNING_KEY;
const QSTASH_NEXT_SIGNING_KEY = process.env.QSTASH_NEXT_SIGNING_KEY;

export class QStashService {
    private client: Client;
    private receiver: Receiver;

    constructor() {
        // create message
        this.client = new Client({
            token: QSTASH_TOKEN || '',
        });

        // receive message 
        this.receiver = new Receiver({
            currentSigningKey: QSTASH_CURRENT_SIGNING_KEY || '',
            nextSigningKey: QSTASH_NEXT_SIGNING_KEY || '',
        });
    }

    /* =========================================================
        ======================== PUBLISH ========================
        =========================================================
    */

    /**
    * Schedule an event for a future date. 
    * Ex: schedule a forge for 2 hours from now.
    * @param url The URL to send the request to.
    * @param date The date and time to send the request.
    * @param body The body of the request.
     * @return The ID of the scheduled message.
     */
    async scheduleEvent(url: string, date: Date, body: unknown, headers?: Record<string, string>): Promise<string> {
        if (!QSTASH_TOKEN) throw new Error("QSTASH_TOKEN is missing");

        try {
            const unixTimestamp = Math.floor(date.getTime() / 1000);

            const response = await this.client.publishJSON({
                url: url,
                body: body,
                notBefore: unixTimestamp,
                headers: { "Content-Type": "application/json", ...headers },
                retries: 3
            });

            console.info(`[QSTASH] Agendado para ${date.toISOString()} | ID: ${response.messageId}`);
            return response.messageId;
        } catch (error) {
            console.error('[QSTASH] Erro ao agendar evento:', error);
            throw error;
        }
    }

    /**
     * Cancel a scheduled event by its message ID.
     * @param messageId The ID of the message to cancel.
     * @returns void
     */
    async cancelEvent(messageId: string): Promise<void> {
        if (!QSTASH_TOKEN) return; // Fail safe

        try {
            await this.client.messages.delete(messageId);
            console.info(`[QSTASH] Evento cancelado: ${messageId}`);
        } catch (error) {
            console.error('[QSTASH] Erro ao cancelar evento:', error);
        }
    }

    /* =========================================================
        ========================= VERIFY ========================
        =========================================================
    */

    /**
     * Verifies if the request signature is valid.
     * Should be called at the beginning of routes that receive webhooks from QStash.
     * @param request The incoming request object.
     * @param rawBody The raw body of the request as a string.
     * @returns True if the signature is valid, false otherwise.
     */
    async verifySignature(request: Request, rawBody: string): Promise<boolean> {
        const signature = request.headers.get("upstash-signature");

        if (!signature) {
            console.error("[QSTASH] Missing signature in the request.");
            return false;
        }

        try {
            // The Receiver's verify method throws an error if invalid, so we use try/catch to return a boolean
            await this.receiver.verify({
                signature: signature,
                body: rawBody,
                clockTolerance: 2 // Margin of 2 seconds for clock drift, good practice
            });
            return true;
        } catch (error) {
            console.error("[QSTASH] Invalid signature:", error);
            return false;
        }
    }
}