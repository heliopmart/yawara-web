import { NavItem, NucleoItem } from '@yawara/types';

/**
 * Links principais do Header (Menu Superior).
 */
export const HEADER_LINKS: NavItem[] = [
  { label: 'Quem Somos', href: '/aboutUs' }, //
  { label: 'Sustentabilidade', href: '/sustainability' }, //
  { label: 'Inovação', href: '/innovations' }, //
  { label: 'Transparência', href: '/transparency' }, //
  { label: 'Patrocinadores', href: '/sponsors' }, //
  { label: 'Processo Seletivo', href: '/selection-process' }, //
];

/**
 * Links do Footer (Menu Inferior).
 */
export const FOOTER_LINKS: NavItem[] = [
  { label: 'Quem Somos', href: '/aboutUs' }, //
  { label: 'Sustentabilidade', href: '/sustainability' }, //
  { label: 'Contate-nos', href: '/contactUs' }, //
  { label: 'Transparência', href: '/transparency' }, //
  { label: 'Nossa Equipe', href: '/ourTeam' }, //
  { label: 'Cadastro', href: '/registre' }, //
  { label: 'Certificados', href: '/docs/certificate' }, //
  { label: 'Yawara na mídia', href: '/media' }, //
  { label: 'Documento', href: '/docs' }, //
  { label: 'UFGD', href: 'https://ufgd.edu.br', isExternal: true }, //
];

/**
 * Dados de mock para os Núcleos de Desenvolvimento.
 */
export const NUCLEOS_MOCK: NucleoItem[] = [
    { 
        titulo: 'Aero-Design', 
        slug: '/nuclei/aerodesign', //
        descricao: 'Aerodinâmica, estética e ergonomia da moto.',
        image: '/icons/aerodesign.svg',
    },
    { 
        titulo: 'Combustão', 
        slug: '/nuclei/combustion', //
        descricao: 'Pesquisa e otimização do desempenho do motor.',
        image: '/icons/combustion.svg',
    },
    { 
        titulo: 'Hidrogênio', 
        slug: '/nuclei/hidrogeny', //
        descricao: 'Desenvolvimento de tecnologia limpa e sustentável.',
        image: '/icons/hydrogen.svg',
    },
    { 
        titulo: 'Sistemas Embarcados', 
        slug: '/nuclei/embedded-systems', //
        descricao: 'Pesquisa e desenvolvimento dos sistemas eletrônicos dos protótipos.',
        image: '/icons/embedded-systems.svg',
    },
    { 
        titulo: 'Mecânica', 
        slug: '/nuclei/mechanics', //
        descricao: 'Estrutura, suspensão e desempenho das motocicletas.',
        image: '/icons/mechanics.svg',
    },
    { 
        titulo: 'Gestão', 
        slug: '/nuclei/management', //
        descricao: 'Gestão financeira, projetos, comunicação e parcerias.',
        image: '/icons/management.svg',
    },
];