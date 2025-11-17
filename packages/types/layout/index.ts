
export interface NavItem {
  label: string;
  href: string;
  isExternal?: boolean; 
}

export interface NucleoItem {
    titulo: string;
    slug: string; //
    descricao: string; 
    image?: string;
}

export interface TimelineStep {
    id: number;
    title: string;
    description: string;
    isCompleted: boolean;
}

export interface FAQItem {
    id: number;
    question: string;
    answer: string;
}

export interface SelectionProcessLandingData {
    headline: {
        title: string;
        subtitle: string;
        introText: string;
    };
    timeline: TimelineStep[];
    techBlock: {
        title: string;
        intro: string;
        description: string;
        highlightedTerms: string[];
    };
    processBlock: {
        title: string;
        intro: string;
        description: string;
        highlightedTerms: string[];
    };
    faq: FAQItem[];
}