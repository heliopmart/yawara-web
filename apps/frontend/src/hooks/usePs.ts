import { ps_full_data, ps_data_display } from '@yawara/types'
import React, { useState, useEffect } from 'react'
import { mapBackendDataToFrontend } from '@/utils/ps-data-mapper'

export const usePs = () => {
    const [nuclei_1, setNuclei_1] = useState<string>()
    const [nuclei_2, setNuclei_2] = useState<string>()

    const [data, setData] = useState<ps_data_display | null>();
    const [rawData, setRawData] = useState<ps_full_data>();
    const [error, setError] = useState<{ message: string } | null>(null);
    const [register_PS, setRegister_PS] = useState<boolean>(false);

    const handlePs = async () => {
        setError(null);
        try {
            const response = await fetch('/api/ps', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            const apiResponse = await response.json();

            if (apiResponse.success) {
                try {
                    const data = mapBackendDataToFrontend(apiResponse.data)
                    setRawData(apiResponse.data)
                    setData(data)
                } catch (e : any) {
                    if (e.code == 'PS_EDITION_NOT_FOUND') {
                        setRegister_PS(true)
                    }
                }
            } else {

                if (apiResponse.code === 'PS_SIGNUP_FAILED') {
                    setRegister_PS(true)
                    setError({ message: apiResponse.error.message });   
                }

                setError({ message: apiResponse.error.message });
            }

        } catch (error) {
            console.error('Erro de rede ou parsing:', error);
            setError({ message: "Ah não! estamos passando por instabilidades." });
        }
    };

    const handleChosenNuclei = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const nuclei = e.target.value

        if (!rawData) {
            return
        }

        if (!nuclei) {
            return
        }

        if (rawData.ps_user_cards[0].nuclei_eligible?.includes(nuclei) === false) {
            return
        }

        if (!nuclei_1) {
            setNuclei_1(nuclei)
            return
        }
        if (!nuclei_2 && nuclei !== nuclei_1) {
            setNuclei_2(nuclei)
            return
        }
    }

    const updateChosenNuclei = async () => {
        if (!rawData || !nuclei_1 || !nuclei_2) {
            return
        }

        try {
            const response = await fetch('/api/ps', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    edition_id: rawData.ps_user_cards[0].edition_id,
                    nuclei_chosen: [nuclei_1, nuclei_2],
                    card_id: '5'
                })
            });

            if (!response.ok) {
                updateNucleiChosenData(false)
            }

            const res = await response.json();

            if (res.success) {
                updateNucleiChosenData(true)
            } else {
                throw res.error.message
            }
        } catch (error) {
            console.error('Erro ao atualizar núcleos escolhidos:', error);
            updateNucleiChosenData(false)
        }

        function updateNucleiChosenData(success: boolean) {
            if (!data || !nuclei_1 || !nuclei_2) {
                return
            }

            if (success) {
                setData(prev => {
                    if (!prev) return prev;
                    return {
                        ...prev,
                        steps: prev.steps.map((step) => {
                            if (step.id === 5) {
                                return {
                                    ...step,
                                    status: 'COMPLETED',
                                    is_active: false
                                };
                            }
                            return step;
                        }),

                        nucleusChoice: {
                            ...prev.nucleusChoice,
                            firstOption: nuclei_1,
                            secondOption: nuclei_2,
                            isWaiting: true,
                            showSelectionButton: false
                        }
                    }
                })
            }

            setData(prev => {
                if (!prev) return prev;
                return {
                    ...prev,
                    steps: prev.steps.map((step) => {
                        if (step.id === 5) {
                            return {
                                ...step,
                                status: 'FAILED',
                                is_active: false
                            };
                        }
                        return step;
                    })
                }
            })
        }
    }

    const handle_sign_up_ps = async () => {
        try {
            const response = await fetch('/api/ps/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            if (!response.ok) {
                throw 'NETWORK_RESPONSE_NOT_OK'
            }
            const res = await response.json();

            if (res.success) {
                setRegister_PS(false)
                handlePs()
            } else {
                throw res.error.message
            }
        } catch (e) {
            console.error('Erro ao inscrever no processo seletivo:', e);
            throw e
        }
    }

    useEffect(() => {
        handlePs();
        return
    }, [])

    return {
        nuclei_1,
        nuclei_2,
        handleChosenNuclei,
        updateChosenNuclei,
        handle_sign_up_ps,

        data,
        error,
        register_PS,
    }
}