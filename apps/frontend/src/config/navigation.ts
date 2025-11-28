import {AuthRole} from '@yawara/types'

export interface NavLink {
    label: string;
    href: string;
}

const COMMON_LINKS: NavLink[] = [
    { label: 'MINHA CONTA', href: '/account/my-account' },
];

export const NAVIGATION_BY_ROLE: Record<AuthRole, NavLink[]> = {
    GUEST: [], // Ou links de login/registro
    
    USER: [
        { label: 'PROCESSO SELETIVO', href: '/account/processo-seletivo' },
        ...COMMON_LINKS
    ],
    
    MEMBER: [
        { label: 'MINHA EQUIPE', href: '/account/my-team' },
        { label: 'NÚCLEOS', href: '/account/nuclei' },
        { label: 'FERRAMENTAS E RECURSOS', href: '/account/ferramentas' },
        { label: 'REQUISIÇÕES', href: '/account/requests' },
        { label: 'DOCUMENTOS', href: '/account/docs' },
        ...COMMON_LINKS
    ],
    
    LEADER: [
        // Líder vê tudo que membro vê...
        { label: 'MINHA EQUIPE', href: '/account/my-team' },
        { label: 'NÚCLEOS', href: '/account/nuclei' },
        { label: 'FERRAMENTAS', href: '/account/ferramentas' },
        { label: 'REQUISIÇÕES', href: '/account/requests' },
        // ...mais itens administrativos
        { label: 'GESTÃO DE ALOCAÇÃO', href: '/account/admin/allocation' },
        { label: 'EMISSÃO DE CERTIFICADOS', href: '/account/admin/certificates' },
        ...COMMON_LINKS
    ],

    ADMIN: [
        // Admin vê tudo
        { label: 'DASHBOARD GERAL', href: '/account/admin/dashboard' },
        // ... resto dos links
        ...COMMON_LINKS
    ],

    MODERATOR: [
        { label: 'MINHA EQUIPE', href: '/account/my-team' },
        { label: 'NÚCLEOS', href: '/account/nuclei' },
        { label: 'FERRAMENTAS E RECURSOS', href: '/account/ferramentas' },
        { label: 'REQUISIÇÕES', href: '/account/requests' },
        { label: 'DOCUMENTOS', href: '/account/docs' },
        { label: 'EVENTOS', href: '/account/events' },
        ...COMMON_LINKS
    ],

    DEVELOPER: [
        { label: 'DASHBOARD GERAL', href: '/account/admin/dashboard' },
        ...COMMON_LINKS
    ]
};

export const getLinksByRole = (role: AuthRole): NavLink[] => {
    return NAVIGATION_BY_ROLE[role] || NAVIGATION_BY_ROLE['GUEST'];
};