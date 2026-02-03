import {EnumPsCardConfigState, ps_user_cards} from '../ps'
export interface RecruitmentStep {
  id: number;
  title: string;
  description: string;
  state: EnumPsCardConfigState;
  userState: EnumPsCardConfigState;
  estimatedDuration?: string; 
  deadline?: string; 
  actionButton?: {
    text: string; 
    href: string; 
  };
  helpLinks?: { 
    text: string; 
    href: string;
  }[];
}

export interface ps_data_display {
  candidate_id?: string;
  title: string;
  progressPercentage: number;
  currentStepLabel: string;
  steps: RecruitmentStep[];

  is_completed: boolean;
  is_accepted: boolean;

  nucleusChoice?: {
    isWaiting: boolean; 
    firstOption: string;
    secondOption: string;
    showSelectionButton: boolean;
    eligibleNuclei?: ps_user_cards['nuclei_eligible']
  };
  finalResult?: {
    show: boolean;
    message: string;
    evaluationPdfLink: string;
  };
}

