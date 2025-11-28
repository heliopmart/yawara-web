import React from 'react';
import { NucleoItem } from '@yawara/types'; 
import { NUCLEOS_MOCK } from '@/mocks/nav.mock';

import HeroSection from '@/components/home/HeroSection';
import NucleosSection from '@/components/home/NucleosSection';
import SustentabilidadeSection from '@/components/home/SustentabilidadeSection';

const HomePage: React.FC = () => {
    const nucleos: NucleoItem[] = NUCLEOS_MOCK; 

    return (
        <main>
            <HeroSection /> 

            <NucleosSection nucleos={nucleos} />

            <SustentabilidadeSection />
            
        </main>
    );
};

export default HomePage;