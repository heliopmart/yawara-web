import { ps_data_display } from '@yawara/types';

export const PS_MOCK_DATA: ps_data_display = {
  title: "Processo Seletivo 2026/1",
  progressPercentage: 60,
  currentStepLabel: 'Quase lá, você está na etapa ',
  steps: [
    {
      id: 1,
      title: 'Envie seu histórico acadêmico',
      description: '1. Faça login no SIGECAD \n 2. Acesse a pagina do Academico \n 2. Clique no menu superior "Documentos" \n 3. Baixe o arquivo em PDF \n 4. Envie o arquivo aqui',
      state: 'COMPLETED',
      userState: 'COMPLETED',
      actionButton: { text: 'ENVIAR HISTÓRICO (.PDF)', href: '#' },
    },
    {
      id: 2,
      title: 'Envie a resolução do desafio',
      description: 'Enviamos um e-mail em 28/02/2028 às 11:00 com um desafio. Boa sorte!',
      state: 'COMPLETED',
      userState: 'COMPLETED',
      deadline: '2028/02/28 11:00 AM',
      actionButton: { text: 'ENVIAR RESOLUÇÃO (.PDF)', href: '#' },
    },
    {
      id: 3,
      title: 'Participação na "A FORJA"',
      description: 'Parabéns, você está entre os selecionados! Participe no dia 02/03/2028 das 7h às 10h.',
      state: 'COMPLETED',
      userState: 'COMPLETED',
      helpLinks: [
        { text: 'O que é "A FORJA"?', href: '#' },
        { text: 'Como se preparar para "A FORJA"?', href: '#' },
      ],
    },
    {
      id: 4,
      title: 'Participação na "O CORREDOR"',
      description: 'Você está apto a participar da próxima etapa. Você participará no dia 04/03/2028 das 7h às 10h.',
      state: 'NOT_AVAILABLE',
      userState: 'NOT_AVAILABLE',
      helpLinks: [
        { text: 'O que é "O CORREDOR"?', href: '#' },
        { text: 'Como se preparar para "O CORREDOR"?', href: '#' },
      ],
    },
  ],

  nucleusChoice: {
    isWaiting: true,
    firstOption: 'Management Nucleus',
    secondOption: 'Combustion Nucleus',
    showSelectionButton: true,
  },

  finalResult: {
    show: true,
    message: 'Parabéns! Você foi selecionado para fazer parte do Yawara Motorsports no semestre 2026/1. Seu núcleo será o de Combustão. Estamos ansiosos para trabalhar com você!',
    evaluationPdfLink: '#',
  },
  is_completed: false,
  is_accepted: false
};