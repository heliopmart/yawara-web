// packages/types/src/index.ts (Simplified for Card Flow)

/** Status possibilities for a recruitment step. */
export type CandidateStatus = 'COMPLETED' | 'FAILED' | 'PENDING_ACTION' | 'UNDER_REVIEW' | 'FUTURE';

/** Interface for a single step in the Selection Process. */
export interface RecruitmentStep {
  id: number;
  title: string; // Ex: 'Send Academic History'
  description: string;
  status: CandidateStatus;
  estimatedDuration?: string; // Ex: '35 seconds'
  deadline?: string; // Ex: '2028/02/28 at 11:00 AM'
  actionButton?: {
    text: string; // Ex: 'SEND HISTORY | PDF'
    href: string; // The target route or API
  };
  helpLinks?: { 
    text: string; // Ex: 'What is "A FORJA"?'
    href: string;
  }[];
}

/** Interface for the main Processo Seletivo data. */
export interface ProcessoSeletivoData {
  progressPercentage: number;
  currentStepLabel: string; // Ex: 'YOU ARE IN THE __ STEP'
  steps: RecruitmentStep[];
  
  // Blocks rendered below the flow
  nucleusChoice?: {
    isWaiting: boolean; // Yellow state
    firstOption: string;
    secondOption: string;
    showSelectionButton: boolean;
  };
  finalResult?: {
    show: boolean; // Red state
    message: string;
    evaluationPdfLink: string;
  };
}