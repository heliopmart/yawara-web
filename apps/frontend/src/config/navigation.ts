import { AuthRole } from '@yawara/types'

export interface NavLink {
    label: string;
    href: string;
}

const COMMON_LINKS: NavLink[] = [
    { label: 'MINHA CONTA', href: '/in/my-account' },
];

export const NAVIGATION_BY_ROLE: Record<AuthRole, NavLink[]> = {
    GUEST: [],

    USER: [
        { label: 'PROCESSO SELETIVO', href: '/in/selection-process' },
        ...COMMON_LINKS
    ],

    MEMBER: [
        { label: 'MINHA EQUIPE', href: '/in/my-team' },
        { label: 'NÚCLEOS', href: '/in/nuclei' },
        { label: 'FERRAMENTAS E RECURSOS', href: '/in/tools' },
        { label: 'DOCUMENTOS', href: '/in/docs' },
        ...COMMON_LINKS
    ],

    LEADER: [
        { label: 'MINHA EQUIPE', href: '/in/my-team' },
        { label: 'NÚCLEOS', href: '/in/nuclei' },
        { label: 'FERRAMENTAS', href: '/in/tools' },
        { label: 'REQUISIÇÕES', href: '/in/requests' },

        { label: 'GERENCIAR NÚCLEO', href: '/in/admin/nucleusManager' },
        ...COMMON_LINKS
    ],

    ADMIN: [
        { label: 'MINHA EQUIPE', href: '/in/my-team' },
        { label: 'FERRAMENTAS', href: '/in/tools' },
        { label: 'REQUISIÇÕES', href: '/in/requests' },
        { label: 'CRIAR PROCESSO SELETIVO', href: '/in/admin/ps/create' },
        { label: 'PROCESSO SELETIVO | PRESENÇA', href: '/in/admin/ps/management' },

        // REMOVE
        { label: 'PROCESSO SELETIVO', href: '/in/selection-process' },
        ...COMMON_LINKS
    ],

    MODERATOR: [
        { label: 'MINHA EQUIPE', href: '/in/my-team' },
        { label: 'NÚCLEOS', href: '/in/nuclei' },
        { label: 'FERRAMENTAS E RECURSOS', href: '/in/tools' },
        { label: 'REQUISIÇÕES', href: '/in/requests' },
        { label: 'DOCUMENTOS', href: '/in/admin/docs' },
        { label: 'PROCESSO SELETIVO | PRESENÇA', href: '/in/admin/ps/management' },
        { label: 'EVENTOS', href: '/in/events' },

        ...COMMON_LINKS
    ],

    DEVELOPER: [
        { label: 'MINHA EQUIPE', href: '/in/my-team' },
        { label: 'NÚCLEOS', href: '/in/nuclei' },
        { label: 'FERRAMENTAS E RECURSOS', href: '/in/tools' },
        { label: 'REQUISIÇÕES', href: '/in/requests' },
        { label: 'DOCUMENTOS', href: '/in/admin/docs' },
        { label: 'GERENCIAR NÚCLEO', href: '/in/admin/nucleusManager' },
        { label: 'CRIAR PROCESSO SELETIVO', href: '/in/admin/ps/create' },
        { label: 'PROCESSO SELETIVO | PRESENÇA', href: '/in/admin/ps/management' },
        { label: 'EVENTOS', href: '/in/events' },
        { label: 'PROCESSO SELETIVO', href: '/in/selection-process' },
        ...COMMON_LINKS
    ]
};

export const getLinksByRole = (role: AuthRole): NavLink[] => {
    return NAVIGATION_BY_ROLE[role] || NAVIGATION_BY_ROLE['GUEST'];
};