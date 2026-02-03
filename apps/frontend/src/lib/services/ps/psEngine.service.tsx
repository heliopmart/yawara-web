import { PsEngineRepository } from "@/lib/repository/ps/psEngine.repository"
import { SelectionProcessEngineData, RankedCandidate, cards_progress, TokenPayload, ReportPayload } from '@yawara/types'
import { handleGenerateHash } from "@/utils/hash"
import { renderToStream } from '@react-pdf/renderer';
import { ApprovedCandidateReport } from '@/components/ps/pdf/ApprovedReport';
import { FinalisedCandidateReport } from '@/components/ps/pdf/ReportCompleted';

export class PsEngine {
    private psEngineRepository: PsEngineRepository;
    private auth?: TokenPayload;
    protected weights = {
        forge: 0.4,    // Alpha: Conhecimento Técnico
        corridor: 0.3, // Beta: Soft Skills
        gate: 0.3      // Gamma: Comportamental/Resiliência
    };

    constructor(auth?: TokenPayload) {
        this.auth = auth;
        this.psEngineRepository = new PsEngineRepository(auth);
    }

    public async generateDynamicReport(ps_edition_id: string) {
        const rawData = await this.psEngineRepository.getDataForReport(ps_edition_id);
        const result = this.hydrateReportPayload(rawData);

        if (result.is_accepted) {
            return await renderToStream(
                <ApprovedCandidateReport
                    payload={result}
                />
            );
        } else {
            return await renderToStream(
                <FinalisedCandidateReport
                    payload={result}
                />
            );
        }
    }

    public async runFullSelectionProcess(): Promise<boolean> {
        try {
            const rawData = await this.handleGetPsEngine();

            const computedCandidates = this.computeScores(rawData);

            const allocationResults = this.handleRankAndAllocate(computedCandidates, rawData.nuclei);

            const success = await this.executeUpdates(
                rawData.edition.id,
                allocationResults,
                rawData.nuclei
            );

            if (success) {
                console.info("[ENGINE] Processo concluído com sucesso. Candidatos alocados.");
            }

            return success;
        } catch (error) {
            console.error('[ENGINE] Falha crítica no orquestrador:', error);
            throw error;
        }
    }

    private renderApprovedTemplate(payload: ReportPayload) {
        return { template: 'ApprovedReport', data: payload };
    }

    private renderCompletedTemplate(payload: ReportPayload) {
        return { template: 'ReportCompleted', data: payload };
    }


    private async handleGetPsEngine(): Promise<SelectionProcessEngineData> {
        try {
            const psEngineData = await this.psEngineRepository.getPsEngine()
            return psEngineData
        } catch (error) {
            throw error
        }
    }


    private computeScores(data: SelectionProcessEngineData): RankedCandidate[] {
        return data.candidates.map(candidate => {
            const finalScore = this.handleCalculateCandidateScore(candidate.cards_progress, this.weights);
            return {
                ...candidate,
                finalScore: parseFloat(finalScore.toFixed(2))
            };
        });
    }

    private async executeUpdates(
        editionId: string,
        results: any[],
        nuclei: SelectionProcessEngineData['nuclei']
    ): Promise<boolean> {
        try {
            const candidateUpdates = results.map(r => ({
                id: r.id,
                score: r.score,
                is_accepted: r.is_accepted,
            }));

            const nucleusUpdates = nuclei.map(n => {
                const newMembers = results.filter(r => r.assignedNucleus === n.id && r.is_accepted).length;
                return {
                    id: n.id,
                    open_vacancies: n.open_vacancies,
                    new_members_count: newMembers
                };
            });

            const res = await this.psEngineRepository.executeSelectionResultsUpdate(
                editionId,
                candidateUpdates,
                nucleusUpdates
            )

            return res;
        } catch (error) {
            console.error('SelectionEngine.executeUpdates error:', error);
            throw error;
        }
    }


    private handleRankAndAllocate(rankedCandidates: RankedCandidate[], nuclei: SelectionProcessEngineData['nuclei']) {
        const sorted = [...rankedCandidates].sort((a, b) => b.finalScore - a.finalScore);

        const nucleiSlots = new Map(nuclei.map(n => [n.id, { slots: n.open_vacancies, total_members: n.total_members }]));

        const results = sorted.map(candidate => {
            let assignedNucleus = null;

            if (Array.isArray(candidate.nuclei_chosen) === false) {
                return {
                    ...candidate,
                    score: candidate.finalScore,
                    assignedNucleus: null,
                    is_accepted: false
                }
            }

            for (const nucleusId of candidate.nuclei_chosen) {
                const config = nucleiSlots.get(nucleusId);

                if (config && config.slots > 0) {
                    assignedNucleus = nucleusId;
                    config.slots -= 1;
                    break;
                }
            }

            return {
                ...candidate,
                score: candidate.finalScore,
                assignedNucleus,
                is_accepted: !!assignedNucleus
            };
        });

        return results;
    }

    private handleCalculateCandidateScore(cards: cards_progress[], weights: Record<string, number>): number {

        /*
            $$Score Final = (NotaForja \cdot \alpha) + (NotaCorredor \cdot \beta) + (NotaPortao \cdot \gamma)$$
            Onde você pode definir, por exemplo: alpha=0.4, beta=0.3 e gamma=0.3.
        */

        const forgeCard = cards.find(c => c.card_id === 2);
        const corridorCard = cards.find(c => c.card_id === 3);
        const gateCard = cards.find(c => c.card_id === 4);

        const getAverage = (notes: Record<string, number> | undefined) => {
            if (!notes) return 0;
            const values = Object.values(notes);
            return values.reduce((a, b) => a + b, 0) / values.length;
        };

        const forgeScore = getAverage(forgeCard?.notes);
        const corridorScore = getAverage(corridorCard?.notes);
        const gateScore = getAverage(gateCard?.notes);

        return (forgeScore * weights.forge) +
            (corridorScore * weights.corridor) +
            (gateScore * weights.gate);
    }

    private hydrateReportPayload(rawData: any): ReportPayload {
        const cards = rawData.cards_progress as cards_progress[];

        const calculateCardScore = (cardId: number): number => {
            const card = cards.find(c => c.card_id === cardId);
            if (!card || !card.notes) return 0;

            const notesValues = Object.values(card.notes) as number[];
            if (notesValues.length === 0) return 0;

            const sum = notesValues.reduce((acc, val) => acc + val, 0);
            return sum / notesValues.length;
        };

        const forge_score = calculateCardScore(2);
        const corridor_score = calculateCardScore(3);
        const gate_score = calculateCardScore(4);

        const final_score_percent = rawData.final_score;

        const hashPayload = `${rawData.candidate_id}|${rawData.final_score}|${rawData.process_id}`;
        const sing_hash = handleGenerateHash(hashPayload);

        return {
            candidate_name: rawData.candidate_name,
            candidate_id: rawData.candidate_id,
            process_name: rawData.process_name,
            process_id: rawData.process_id,
            last_row_update_datetime: rawData.last_row_update_datetime,
            final_score: rawData.final_score,
            final_score_percent: final_score_percent,
            forge_score,
            corridor_score,
            gate_score,
            score_top1: rawData.score_top1 || 0,
            score_top2: rawData.score_top2 || 0,
            score_top3: rawData.score_top3 || 0,
            is_accepted: rawData.is_accepted,
            accepted_nucleus: rawData.accepted_nucleus,
            nucleus_leader_name: rawData.nucleus_leader_name,
            nucleus_member_count: rawData.nucleus_member_count || 0,
            nucleus_capacity: rawData.nucleus_capacity || 0,
            nucleiEligible: rawData.nuclei_eligible || [],
            nucleiChosen: rawData.nuclei_chosen || [],
            sing_hash,
            alpha: this.weights.gate,
            beta: this.weights.corridor,
            gamma: this.weights.forge,
        };
    }


}