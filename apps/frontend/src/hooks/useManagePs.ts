import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Candidate, ps_card_configs, DashboardPresenceResponse, cards_progress } from '@yawara/types';
import { PS_CREATE_MOCK_DATA } from '@/mocks/ps.mock'

export const useManagementPs = () => {
    const [view, setView] = useState<'PRESENCE' | 'SCORES'>('PRESENCE');
    const [selectedCard, setSelectedCard] = useState<number>(2);
    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [configs, setConfigs] = useState<ps_card_configs[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    const handleFetchCandidates = useCallback(async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/admin/ps/manage');
            const data = await res.json();

            if (data.success) {
                const payload: DashboardPresenceResponse = data.data

                setCandidates(payload.candidates || []);
                setConfigs(payload.ps_card_configs || []);
            }
        } catch (error) {
            console.error("Erro ao carregar dados:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { handleFetchCandidates(); }, [handleFetchCandidates]);

    const handleScoreUpdate = (candidateId: string, cardId: number, key: string, value: number) => {
        if (value > 5)
            value = 5
        if (value < 0)
            value = 0

        setCandidates(prev => prev.map(c => {
            if (c.id !== candidateId) return c;

            const progressArray = Array.isArray(c.cards_progress)
                ? c.cards_progress
                : [c.cards_progress];

            const updatedProgress = progressArray.map(p => {
                if (p.card_id !== cardId) return p;

                return {
                    ...p,
                    notes: {
                        ...(p.notes || {}),
                        [key]: value
                    }
                };
            }) as typeof c.cards_progress;

            return { ...c, cards_progress: updatedProgress };
        }));
    };

    const handlePresenceToggle = (candidateId: string, cardId: number) => {
        setCandidates(
            prev => prev.map(c => {
                if (c.id !== candidateId) {
                    return c
                }

                const updatedProgress = c.cards_progress.map(p => {
                    if (p.card_id !== cardId) {
                        return p
                    }

                    return {
                        ...p,
                        state: 'COMPLETED'
                    } as cards_progress
                })

                return { ...c, cards_progress: updatedProgress }
            })
        )
    };

    // TODO: DDD aqui fds, precisa ser refatorado
    const handleSubmitChanges = async () => {
        if (view === 'PRESENCE') {
            try {
                const res = await fetch('/api/admin/ps/manage', {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        updates: candidates.map((c) => {
                            return {
                                user_card_id: c.id,
                                card_id: selectedCard,
                                is_presence: (
                                    c.cards_progress.find(p => p.card_id === selectedCard)?.state === 'COMPLETED'
                                )
                            }
                        })
                    })
                })

                if (!res.ok) {
                    throw 'INTERNAL_SERVER_ERROR'
                }

                const data = await res.json()

                if (!data.success) {
                    throw data.error
                }

                if (!data.data) {
                    throw 'PRESENCE_UPDATE_FAILED'
                }

                alert("Alterações Salvas com sucesso.")
            } catch (error) {
                console.error("Erro ao atualizar presença:", error);
            }
        } else {

            // TODO: Fazemos requisições para todos os candidatos, porque é mais eficiente em grande quantidade
            // ? Porém, quando apenas 1 for atualizado, isso é prejuizo. Embora com base na logica atual da PS, isso é quase insignificante. 

            try {
                const res = await fetch('/api/admin/ps/manage/scores', {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        updates: candidates.map((c) => {
                            const progressArray = Array.isArray(c.cards_progress)
                                ? c.cards_progress
                                : [c.cards_progress];
                            const targetProgress = progressArray.find(p => p.card_id === selectedCard);

                            // ! I added this "if", it will probabily work, but if not, can remove it
                            if (targetProgress?.state == 'COMPLETED') {
                                return {
                                    user_card_id: c.id,
                                    card_id: selectedCard,
                                    notes: targetProgress ? targetProgress.notes : {}
                                }
                            }
                        })
                    })
                })

                if (!res.ok) {
                    throw 'INTERNAL_SERVER_ERROR    '
                }

                const data = await res.json()
                if (!data.success) {
                    throw data.error
                }

                alert("Notas Lançadas")
            } catch (error) {
                console.error("Erro ao atualizar notas:", error);
            }
        }

    }

    const handleRequestForgeValance = async () => {
        if (!handleCanRequestForgeValance()) {
            alert("Ainda não é possível solicitar a valência do Forge.");
            return;
        }

        try {
            const res = await fetch('/api/admin/ps/manage/forge', {
                method: 'POST'
            })

            if (!res.ok) {
                throw 'INTERNAL_SERVER_ERROR';
            }

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = `forge_valence_team_report.pdf`;
            document.body.appendChild(a);
            a.click();

            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        }
        catch (err) {
            console.error("Erro ao solicitar valência do Forge:", err);
            return
        }
    }

    const handleCanRequestForgeValance = () => {
        const forge_card = configs.find(c => c.card_id === 3);

        const rawDate = forge_card?.start_time || forge_card?.event_date;

        if (!rawDate) return false;

        const cleanDateTime = rawDate.split('+')[0].split('Z')[0];

        const campoGrandeDate = `${cleanDateTime}-04:00`;

        const eventTimestamp = new Date(campoGrandeDate).getTime();
        const nowTimestamp = new Date().getTime();

        if (isNaN(eventTimestamp)) {
            console.error('Data inválida no Forge:', campoGrandeDate);
            return false;
        }

        return nowTimestamp >= eventTimestamp;
    }


    return {
        view, setView,
        selectedCard, setSelectedCard,
        candidates, configs,
        loading,
        handleScoreUpdate,
        handlePresenceToggle,
        handleSubmitChanges,
        handleRequestForgeValance
    };
};

export const useCreatePs = () => {
    const router = useRouter();
    const [psName, setPsName] = useState('');
    const [globalStart, setGlobalStart] = useState('');
    const [globalEnd, setGlobalEnd] = useState('');
    const [steps, setSteps] = useState<Omit<ps_card_configs, 'id' | 'created_at' | 'updated_at' | 'edition_ps'>[]>(PS_CREATE_MOCK_DATA);

    const addStep = () => {
        setSteps([...steps, {
            title: '',
            description: '',
            state: 'NOT_AVAILABLE',
            card_id: steps.length + 1,
            type: 'PRESENCE_EVALUATION'
        }]);
    };

    const updateStep = (card_id: ps_card_configs['card_id'], fields: Partial<Omit<ps_card_configs, 'id'>>) => {
        setSteps(steps.map(s => s.card_id === card_id ? { ...s, ...fields } : s));
    };

    const handleValidateStep = () => {
        for (const step of steps) {
            if (!step.title || !step.type) {
                return false;
            }

            if (step.type === 'PRESENCE_EVALUATION') {
                if (!step.event_date || !step.start_time || !step.end_time || !step.location) {
                    return false;
                }
            }

            if (step.type === 'DOCUMENT_SUBMISSION') {
                if (!step.deadline) {
                    return false;
                }
            }
        }
        return true;
    }

    const handleSubmitPs = async () => {
        if (!psName || !globalStart || !globalEnd || steps.length === 0) {
            alert('Por favor, preencha todos os campos obrigatórios.');
            return;
        }

        if (!handleValidateStep()) {
            alert('Por favor, preencha todos os campos dos cards.');
            return;
        }

        try {
            const res = await fetch('/api/admin/ps', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: psName,
                    start_date: globalStart,
                    finish_date: globalEnd,
                    // TODO Fixado em uma semana, talvez colocar um campo pra isso futuramente
                    registration_closing: (new Date(new Date(globalStart).getTime() + 5 * 24 * 60 * 60 * 1000)).toISOString(),
                    cards_config: steps

                })
            });

            if (!res.ok) {
                throw 'INTERNAL_SERVER_ERROR'
            }

            const data = await res.json();

            if (!data.success) {
                throw data.message || 'INTERNAL_SERVER_ERROR'
            }

            router.push('/in/admin/ps/management');
        } catch (error) {
            console.error('Erro ao criar processo seletivo:', error);
        }
    }

    return {
        psName, setPsName,
        globalStart, setGlobalStart,
        globalEnd, setGlobalEnd,
        steps, addStep, updateStep, setSteps,
        handleSubmitPs,
        router
    }
}
