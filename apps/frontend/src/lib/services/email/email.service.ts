import { resend } from '@/lib/resend';
import { sendEmailParams, sendChalengesEmailParams, ChallengeDownloadTokenPayload } from '@yawara/types'
import { challengesEmailTemplate } from '@/utils/email/template/challenges_template'
import { reset_password_template } from "@/utils/email/template/password_template"
import jwt from 'jsonwebtoken';

const fromEmail = process.env.RESEND_EMAIL || ''
const CHALLENGE_EXPIRATION_DAYS = process.env.CHALLENGE_EXPIRATION_DAYS!!
const CHALLENGE_JWT_SECRET = process.env.CHALLENGE_JWT_SECRET!!
const CHALLENGE_DOWNLOAD_URL = process.env.CHALLENGE_DOWNLOAD_URL

export class EmailService {
    /*
        =========================================================
        ======================= SEND EMAIL ======================
        =========================================================
    */

    private async sendEmail(params: sendEmailParams): Promise<void> {
        try {
            resend.emails.send({
                from: fromEmail,
                to: params.to,
                subject: params.subjetct,
                html: params.html
            })
        } catch (error) {
            console.error('EmailService.sendEmail error:', error);
            throw error;
        }
    }

    /*
        =========================================================
        ========================= CALL ==========================
        =========================================================
    */

    async sendChallengesEmail(params: sendChalengesEmailParams): Promise<void> {
        try {
            await this.sendEmail({
                to: params.to,
                subjetct: 'PROCESSO SELETIVO YAWARA - Etapa Portão de Ferro ',
                html: this.handleSetChallengesEmailTemplate(params.name, params.user_id, params.edition_id, params.challenge_id, params.to),
            })
        } catch (error) {
            console.error('EmailService.sendChalengesEmail error:', error);
            throw error;
        }
    }

    async sendPasswordResetEmail(to: string, resetLink: string): Promise<void> {
        try {
            await this.sendEmail({
                to,
                subjetct: 'Redefinição de senha - Yawara',
                html: reset_password_template(resetLink),
            });
        } catch (error) {
            console.error('EmailService.sendPasswordResetEmail error:', error);
            throw error;
        }
    }

    /*
        =========================================================
        ========================= HANDLE ========================
        =========================================================
    */

    private handleSetChallengesEmailTemplate(
        name: string,
        user_id: string,
        edition_id: string,
        challenge_id: string,
        email: string
    ): string {

        const tokenPayload: ChallengeDownloadTokenPayload = {
            uid: user_id,
            eid: edition_id,
            cid: challenge_id,
            eml: email,
            iat: Date.now()
        };

        const token = jwt.sign(
            tokenPayload,
            CHALLENGE_JWT_SECRET || '',
            { expiresIn: `${parseInt(CHALLENGE_EXPIRATION_DAYS)}d` }
        );

        const downloadUrl = `${CHALLENGE_DOWNLOAD_URL}?t=${token}`;
        return challengesEmailTemplate(name, downloadUrl);
    }

}

