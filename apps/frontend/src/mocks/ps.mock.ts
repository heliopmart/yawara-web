// apps/frontend/src/mocks/ps.mock.ts

import { ProcessoSeletivoData } from '@yawara/types';

export const PS_MOCK_DATA: ProcessoSeletivoData = {
  progressPercentage: 60, // 3/5 etapas completas ou em andamento
  currentStepLabel: 'YOU ARE IN THE ASSESSMENT PHASE',
  steps: [
    {
      id: 1,
      title: 'Submit Academic History',
      description: '1. Open SIGEAD. 2. Look for... 6. Wait for a reply for our next step →',
      status: 'COMPLETED', // Verde na imagem
      actionButton: { text: 'ENVIAR HISTÓRICO (.PDF)', href: '#' },
    },
    {
      id: 2,
      title: 'Submit Challenge Resolution',
      description: 'We sent you an email on 2028/02/28 at 11:00 AM with a challenge. Good luck!',
      status: 'COMPLETED', // Verde na imagem
      deadline: '2028/02/28 11:00 AM',
      actionButton: { text: 'ENVIAR RESOLUÇÃO (.PDF)', href: '#' },
    },
    {
      id: 3,
      title: 'Participation in "A FORJA"',
      description: 'Congratulations, you are among the selected! Participate on 03/02/2028 from 7 AM to 10 AM.',
      status: 'COMPLETED', // Verde na imagem
      helpLinks: [
        { text: 'What is "A FORJA"?', href: '#' },
        { text: 'How to prepare for "A FORJA"?', href: '#' },
      ],
    },
    {
      id: 4,
      title: 'Participation in "O CORREDOR"',
      description: 'You are eligible to participate in the next step. You will participate on 04/03/2028 from 7 AM to 10 AM.',
      status: 'FUTURE', // Futuro, não iniciado
      helpLinks: [
        { text: 'What is "O CORREDOR"?', href: '#' },
        { text: 'How to prepare for "O CORREDOR"?', href: '#' },
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
    message: 'Although you were not classified, your results are GREAT! We open a new PS next semester and hope you participate.',
    evaluationPdfLink: '#',
  },
};