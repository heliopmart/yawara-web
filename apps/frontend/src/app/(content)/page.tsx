import React from 'react';
import { NavItem, NucleoItem } from '@yawara/types'; 
import { NUCLEOS_MOCK } from '@/mocks/nav.mock';

import HeroSection from '@/components/home/HeroSection';
import NucleosSection from '@/components/home/NucleosSection';
import SustentabilidadeSection from '@/components/home/SustentabilidadeSection';

// Este componente é um Server Component por padrão no App Router
const HomePage: React.FC = () => {
    const nucleos: NucleoItem[] = NUCLEOS_MOCK; 

    return (
        <main>
            {/* Componente Hero - Título, Texto e Imagem da Moto */}
            <HeroSection /> 

            {/* Componente Núcleos - Carrega os dados Mock/API */}
            <NucleosSection nucleos={nucleos} />

            {/* Componente Sustentabilidade */}
            <SustentabilidadeSection />
            
            {/* O Footer seria incluído no layout.tsx */}
        </main>
    );
};

export default HomePage;