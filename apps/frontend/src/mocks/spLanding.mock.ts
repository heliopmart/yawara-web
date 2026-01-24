import {TimelineStep, SelectionProcessLandingData, FAQItem} from "@yawara/types"

export const SP_LANDING_MOCK: SelectionProcessLandingData = {
    headline: {
        title: "PROCESSO SELETIVO", //
        subtitle: "Só os melhores são selecionados no processo seletivo do YAWARA.", //
        introText: "Inspirado nos modelos da Microsoft e Amazon a PS Yawara combina teoria e prática com desafios reais do projeto, e com uma pitada de Rede Neural para avaliar os candidatos." //
    },
    timeline: [
        { id: 1, title: "Inscrição para o Processo Seletivo", description: "Envio de documentação e dados iniciais.", isCompleted: true },
        { id: 2, title: "Envio do histórico escolar em PDF", description: "Análise de histórico acadêmico dos candidatos.", isCompleted: false },
        { id: 3, title: "Envio da resolução do desafio em PDF", description: "Avaliação das habilidades técnicas e lógicas.", isCompleted: false },
        { id: 4, title: "Participação da etapa 'A FORJA'", description: "Fase de desafios em equipe e entrevistas.", isCompleted: false },
        { id: 5, title: "Participação da etapa 'O CORREDOR'", description: "Última fase eliminatória de alta pressão.", isCompleted: false },
        { id: 6, title: "Escolha dos núcleos que o candidato passou", description: "Seleção final do núcleo de atuação.", isCompleted: false },
        { id: 7, title: "Resultado Final e Boas Vindas", description: "Comunicação dos resultados e integração à equipe.", isCompleted: false },
    ],
    techBlock: {
        title: "YAWARA INVESTE EM TECNOLOGIA",
        intro: "O processo seletivo do yawara é recheado de tecnologias.",
        description: "Umas delas e a Rede Neural carinhosamente chamada de YAWARA SYSTEM NEURAL ARCHITECTURE ( Y-SNA ). Ela é responsável por classificar os candidatos de acordo com as métricas que o Líder de cada núcleo precisa, porém de forma muito mais eficiente. Um candidato não é desclassificado porque não atingiu um base-line fixo igual outros processos. Porque o nosso base-line é dinâmico!",
        highlightedTerms: ["Rede Neural de Classificação de Base Line", "Y-SNA", "YAWARA SYSTEM NEURAL ARCHITECTURE"],
    },
    processBlock: {
        title: "APENAS OS MELHORES",
        intro: "Nosso processo seletivo é um dos mais inovadores e desafiadores da UFGD!",
        description: "Umas delas e a Rede Neural carinhosamente chamada de YAWARA SYSTEM NEURAL ARCHITECTURE ( Y-SNA ). Ela é responsável por classificar os candidatos de acordo com as métricas que o Líder de cada núcleo precisa, porém de forma muito mais eficiente. Um candidato não é desclassificado porque não atingiu um base-line fixo igual outros processos. Porque o nosso base-line é dinâmico!",
        highlightedTerms: ["UFGD", "Processo Seletivo", "YAWARA", "Melhor projeto da UFGD", "Projeto de extensão"],
    },
    faq: [
        { id: 1, question: "Quando começa a PS?", answer: "O Processo Seletivo do Yawara tem datas anuais, geralmente no início de cada semestre, em Março e Agosto." },
        { id: 2, question: "Como funciona a etapa 'A FORJA'?", answer: "É uma fase de dinâmicas de grupo e desafios práticos, testando a capacidade de trabalhar em equipe sob pressão." },
    ]
};