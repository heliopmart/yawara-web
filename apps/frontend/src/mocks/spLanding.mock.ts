import {TimelineStep, SelectionProcessLandingData, FAQItem} from "@yawara/types"

// export const SP_LANDING_MOCK: SelectionProcessLandingData = {
//     headline: {
//         title: "PROCESSO SELETIVO", //
//         subtitle: "Só os melhores são selecionados no processo seletivo do YAWARA.", //
//         introText: "Inspirado nos modelos da Microsoft e Amazon a PS Yawara combina teoria e prática com desafios reais do projeto, e com uma pitada de Rede Neural para avaliar os candidatos." //
//     },
//     timeline: [
//         { id: 1, title: "Inscrição para o Processo Seletivo", description: "Envio de documentação e dados iniciais.", isCompleted: true },
//         { id: 2, title: "Envio do histórico escolar em PDF", description: "Análise de histórico acadêmico dos candidatos.", isCompleted: false },
//         { id: 3, title: "Envio da resolução do desafio em PDF", description: "Avaliação das habilidades técnicas e lógicas.", isCompleted: false },
//         { id: 4, title: "Participação da etapa 'A FORJA'", description: "Fase de desafios em equipe e entrevistas.", isCompleted: false },
//         { id: 5, title: "Participação da etapa 'O CORREDOR'", description: "Última fase eliminatória de alta pressão.", isCompleted: false },
//         { id: 6, title: "Escolha dos núcleos que o candidato passou", description: "Seleção final do núcleo de atuação.", isCompleted: false },
//         { id: 7, title: "Resultado Final e Boas Vindas", description: "Comunicação dos resultados e integração à equipe.", isCompleted: false },
//     ],
//     techBlock: {
//         title: "YAWARA INVESTE EM TECNOLOGIA",
//         intro: "O processo seletivo do yawara é recheado de tecnologias.",
//         description: "Umas delas e a Rede Neural carinhosamente chamada de YAWARA SYSTEM NEURAL ARCHITECTURE ( Y-SNA ). Ela é responsável por classificar os candidatos de acordo com as métricas que o Líder de cada núcleo precisa, porém de forma muito mais eficiente. Um candidato não é desclassificado porque não atingiu um base-line fixo igual outros processos. Porque o nosso base-line é dinâmico!",
//         highlightedTerms: ["Rede Neural de Classificação de Base Line", "Y-SNA", "YAWARA SYSTEM NEURAL ARCHITECTURE"],
//     },
//     processBlock: {
//         title: "APENAS OS MELHORES",
//         intro: "Nosso processo seletivo é um dos mais inovadores e desafiadores da UFGD!",
//         description: "Umas delas e a Rede Neural carinhosamente chamada de YAWARA SYSTEM NEURAL ARCHITECTURE ( Y-SNA ). Ela é responsável por classificar os candidatos de acordo com as métricas que o Líder de cada núcleo precisa, porém de forma muito mais eficiente. Um candidato não é desclassificado porque não atingiu um base-line fixo igual outros processos. Porque o nosso base-line é dinâmico!",
//         highlightedTerms: ["UFGD", "Processo Seletivo", "YAWARA", "Melhor projeto da UFGD", "Projeto de extensão"],
//     },
//     faq: [
//         { id: 1, question: "Quando começa a PS?", answer: "O Processo Seletivo do Yawara tem datas anuais, geralmente no início de cada semestre, em Março e Agosto." },
//         { id: 2, question: "Como funciona a etapa 'A FORJA'?", answer: "É uma fase de dinâmicas de grupo e desafios práticos, testando a capacidade de trabalhar em equipe sob pressão." },
//     ]
// };

export const SP_LANDING_MOCK: SelectionProcessLandingData = {
    headline: {
        title: "PROCESSO SELETIVO", 
        subtitle: "Só os melhores superam o Portão de Ferro do YAWARA.", 
        introText: "Inspirado em modelos de Big Techs, nosso processo utiliza Inteligência Artificial e desafios de alta pressão para identificar talentos que transformarão a mobilidade sustentável." 
    },
    timeline: [
        { 
            id: 1, 
            title: "Inscrição para o Processo Seletivo", 
            description: "Abertura do certame. O candidato escolhe sua área de interesse entre os núcleos de Engenharia, Software ou Gestão.", 
            isCompleted: true 
        },
        { 
            id: 2, 
            title: "Envio do histórico escolar em PDF", 
            description: "Triagem automatizada via Y-SNA. Nossa IA extrai disciplinas e calcula seu Escore de Competência (E_ART).", 
            isCompleted: false 
        },
        { 
            id: 3, 
            title: "Envio da resolução do desafio em PDF", 
            description: "Etapa 'Portão de Ferro'. Um desafio técnico assíncrono para testar sua capacidade analítica e uso estratégico de LLMs.", 
            isCompleted: false 
        },
        { 
            id: 4, 
            title: "Participação da etapa 'A FORJA'", 
            description: "Desafio prático presencial em equipe multidisciplinar. Onde a liderança emerge e a adaptabilidade é testada sob pressão.", 
            isCompleted: false 
        },
        { 
            id: 5, 
            title: "Participação da etapa 'O CORREDOR'", 
            description: "Circuito de entrevistas rápidas: Resiliência, Flexibilidade e Autocrítica. Sua postura vale tanto quanto seu código.", 
            isCompleted: false 
        },
        { 
            id: 6, 
            title: "Escolha dos núcleos que o candidato passou", 
            description: "Alocação estratégica via Matriz de Competências, cruzando seu perfil técnico com as necessidades das ARTs.", 
            isCompleted: false 
        },
        { 
            id: 7, 
            title: "Resultado Final e Boas Vindas", 
            description: "Divulgação da Nota Final Ponderada (NF) e rito de integração à equipe oficial Yawara MotoStudent.", 
            isCompleted: false 
        },
    ],
    techBlock: {
        title: "DADOS, NÃO OPINIÕES",
        intro: "O Y-SNA é o cérebro que garante a isonomia do nosso recrutamento.",
        description: "Utilizamos a [TERM_YAWARA SYSTEM NEURAL ARCHITECTURE] ([TERM_Y-SNA]), um microsserviço de IA que atua como Agente Externo de Validação. Através de uma [TERM_Rede Neural] híbrida, analisamos seu histórico acadêmico para calcular uma Baseline Probabilística de Competência. Diferente de processos tradicionais, o Y-SNA elimina o viés humano na triagem inicial, garantindo que apenas o mérito técnico abra nosso 'Portão de Ferro'.",
        highlightedTerms: ["Rede Neural", "Y-SNA", "YAWARA SYSTEM NEURAL ARCHITECTURE"],
    },
    processBlock: {
        title: "A FORJA DE TALENTOS",
        intro: "Prepare-se para o processo seletivo mais desafiador e inovador da UFGD.",
        description: "O [TERM_YAWARA] opera em um ambiente de alta performance. Como o [TERM_Melhor projeto da UFGD], nosso [TERM_Processo Seletivo] simula o estresse das competições internacionais. Aqui na [TERM_UFGD], este [TERM_Projeto de extensão] não busca apenas alunos, busca resolvedores de problemas capazes de tomar decisões rápidas em cenários de incerteza, integrando teoria e prática mecânica, elétrica e de software.",
        highlightedTerms: ["UFGD", "Processo Seletivo", "YAWARA", "Melhor projeto da UFGD", "Projeto de extensão"],
    },
    faq: [
        { 
            id: 1,
            question: "Como o Y-SNA avalia meu histórico?", 
            answer: "A IA utiliza PLN para normalizar suas notas e carga horária, aplicando uma soma ponderada (E_ART) com pesos definidos pelos líderes de cada núcleo." 
        },
        { 
            id: 2,
            question: "Posso usar IA (LLM) no desafio 'Portão de Ferro'?", 
            answer: "Sim! Instigamos o uso estratégico de LLMs. Avaliamos sua capacidade de refinar e criticar as respostas da máquina, não apenas o 'copiar e colar'." 
        },
        { 
            id: 3,
            question: "O que é avaliado no 'O Corredor'?", 
            answer: "É um circuito de 4 estações de 10 minutos cada, focadas em testar sua Resiliência, Flexibilidade frente a erros e maturidade na Autocrítica." 
        },
        { 
            id: 4,
            question: "Como é calculada a Nota Final (NF)?", 
            answer: "É uma média ponderada que equilibra seu escore técnico da IA, seu desempenho na Forja, a nota do \"O  Corredor\" e indicadores de Liderança." 
        }
    ]
};