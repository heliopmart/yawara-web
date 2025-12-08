import { PsRepository } from '@/lib/repository/ps/ps.repository'
import { ChallengeDocument } from '@/components/ps/pdf/ChallengeDocument'
import { renderToStream } from '@react-pdf/renderer';
import {ChallengeDownloadTokenPayload} from '@yawara/types'


export class ChallengeService {
    static async generateChallengePdfStream(payload: ChallengeDownloadTokenPayload, rawToken: string) {
        try {
            const data = await PsRepository.getChallengeDataForDownload(
                payload.cid,
                payload.eid,
                payload.uid
            );

            const stream = await renderToStream(
                <ChallengeDocument data={data} securityToken={rawToken} />
            );

            return {
                stream,
                filename: `Yawara_Challenge_${data.student_name.split(' ')[0]}_${payload.cid}.pdf`
            };

        } catch (error) {
            console.error('ChallengeService.generateChallengePdfStream error:', error);
            throw error;
        }
    }
}