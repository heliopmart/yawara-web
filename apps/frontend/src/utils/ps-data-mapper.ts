import { ps_data_display, EnumPsCardConfigState, RecruitmentStep, ps_full_data } from "@yawara/types"

// =================================================================
// 2. CONFIGURAÇÃO ESTÁTICA (TÍTULO, DESCRIÇÃO e LINKS)
// =================================================================

const STATIC_CARD_CONFIGS: Record<number, Omit<RecruitmentStep, 'state' | 'userState'>> = {
    1: {
        id: 1,
        title: 'Envie seu histórico acadêmico',
        description: '1. Faça login no SIGECAD \n 2. Acesse a pagina do Academico \n 2. Clique no menu superior "Documentos" \n 3. Baixe o arquivo em PDF \n 4. Envie o arquivo aqui',
        actionButton: { text: 'ENVIAR HISTÓRICO (.PDF)', href: '#' },
    },
    2: {
        id: 2,
        title: 'Envie a resolução do desafio',
        description: 'Enviamos um e-mail com o desafio. A data limite de entrega é: {deadline_placeholder}.',
        actionButton: { text: 'ENVIAR RESOLUÇÃO (.PDF)', href: '#' },
    },
    3: {
        id: 3,
        title: 'Participação na "A FORJA"',
        description: 'Parabéns, você está entre os selecionados! Participe no dia {date_placeholder} das {time_start} às {time_end} em {location_placeholder}.',
        helpLinks: [
            { text: 'O que é "A FORJA"?', href: '#' },
            { text: 'Como se preparar para "A FORJA"?', href: '#' },
        ],
    },
    4: {
        id: 4,
        title: 'Participação na "O CORREDOR"',
        description: 'Você está apto a participar da próxima etapa. Você participará no dia {date_placeholder} das {time_start} às {time_end} em {location_placeholder}.',
        helpLinks: [
            { text: 'O que é "O CORREDOR"?', href: '#' },
            { text: 'Como se preparar para "A CORREDOR"?', href: '#' },
        ],
    },
};

const COMPLETED_STATES = new Set<EnumPsCardConfigState>(['COMPLETED', 'FAILED']);

// =================================================================
// 3. FUNÇÃO PRINCIPAL DE MAPEAMENTO
// =================================================================

/**
 * Transforma os dados retornados do JOIN do backend (Supabase) 
 * no formato amigável para o componente de frontend.
 */
export const mapBackendDataToFrontend = (rawBackendData: ps_full_data): ps_data_display => {
    const userApplication = rawBackendData.ps_user_cards[0];

    if (!userApplication) {
        throw {
            code: "PS_EDITION_NOT_FOUND",
            message: "Nenhuma inscrição ativa encontrada para o usuário no processo seletivo atual."
        }
    }

    const editionConfig = rawBackendData.ps_card_configs;
    const userProgress = userApplication.cards_progress;

    let completedStepsCount = 0;

    const displaySteps: RecruitmentStep[] = editionConfig
        .sort((a, b) => a.card_id - b.card_id)
        // .filter(config => config.card_id != 5)
        .map(config => {

            const staticData = STATIC_CARD_CONFIGS[config.card_id] || { id: config.card_id, title: `Card ${config.card_id} (NOVO)`, description: 'Nova etapa sem descrição estática.' };

            const progressData = userProgress.find(p => p.card_id === config.card_id);
            const userState = progressData?.state || 'NOT_AVAILABLE';

            if (COMPLETED_STATES.has(userState)) {
                completedStepsCount++;
            }

            let description = staticData.description;
            let deadlineStr: string | undefined = undefined;

            if (config.limit_date) {
                const datePart = config.limit_date.split('T')[0];
                const d = new Date(config.limit_date);

                const date = d.toLocaleDateString('pt-BR', { dateStyle: 'short' });
                const time = d.toLocaleTimeString('pt-BR', { timeStyle: 'short' });

                deadlineStr = `${date} ${time}`;
                description = description.replace('{deadline_placeholder}', deadlineStr);
            }

            if (config.event_date && config.event_times && config.event_location) {
                const date = new Date(config.event_date).toLocaleDateString('pt-BR');
                const timeStart = config.event_times[0];
                const timeEnd = config.event_times[1];

                description = description
                    .replace('{date_placeholder}', date)
                    .replace('{time_start}', timeStart)
                    .replace('{time_end}', timeEnd)
                    .replace('{location_placeholder}', config.event_location);
            }

            return {
                ...staticData,
                description: description,
                state: config.state,
                userState: userState as EnumPsCardConfigState,
                deadline: deadlineStr,
                documentUrl: progressData?.file_id,
            };
        });

    const totalDisplaySteps = displaySteps.length;
    const progressPercentage = Math.round((completedStepsCount / totalDisplaySteps) * 100);

    const currentStepConfig = displaySteps.find(s =>
        !COMPLETED_STATES.has(s.userState)
    );
    const currentStepLabel = `Quase lá! Você está na etapa: ${currentStepConfig?.title || 'Aguardando Resultados Finais'}`;

    const finalResultShow = userApplication.show_final_result;

    return {
        title: rawBackendData.name,
        progressPercentage: progressPercentage,
        currentStepLabel: currentStepLabel,
        steps: displaySteps,
        is_completed: rawBackendData.is_completed,
        is_accepted: userApplication.is_accepted,

        nucleusChoice: {
            isWaiting: userApplication.is_waiting_result,
            firstOption: 'Núcleo de Gestão',
            secondOption: 'Núcleo de Combustão',
            showSelectionButton: !!((userApplication.nuclei_eligible && userApplication.nuclei_eligible.length > 0) && (!userApplication.nuclei_chosen || userApplication.nuclei_chosen.length === 0)),
            eligibleNuclei: userApplication.nuclei_eligible,
        },

        finalResult: {
            show: finalResultShow,
            message: (userApplication.nuclei_chosen && userApplication.nuclei_chosen.length > 0)
                ? `Parabéns! Você foi selecionado para fazer parte do Yawara no semestre ${rawBackendData.name}! Seu núcleo será o de ${userApplication.nuclei_chosen.join(' e ')}.`
                : 'Embora você não tenha sido classificado, seus resultados são ótimos! Esperamos que participe novamente no próximo semestre.',
            evaluationPdfLink: userApplication.final_result_doc || '#',
        },
    };
};