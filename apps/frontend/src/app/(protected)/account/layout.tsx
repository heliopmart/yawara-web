'use client';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

import '@/styles/globals.scss';


import React, { useState } from 'react';
import styles from './processoSeletivoLayout.module.scss';
import SideNav from '@/components/selectionProcess/SideNav';
import { usePathname } from 'next/navigation'; // Para gerenciar o fechamento do menu ao navegar

// Links de navegação lateral (Mock de Rotas)
const navLinks = [
    { label: 'PROCESSO SELETIVO', href: '/account/processo-seletivo' },
    { label: 'MINHA EQUIPE', href: '/account/my-team' },
    { label: 'NÚCLEOS', href: '/account/nucleu' },
    { label: 'FERRAMENTAS E RECURSOS', href: '/account/ferramentas' },
    { label: 'REQUISIÇÕES', href: '/account/requests' },
    { label: 'DOCUMENTOS', href: '/account/documents' },
    { label: 'MINHA CONTA', href: '/account/my-account' },
];

interface PSLayoutProps {
    children: React.ReactNode;
}

const PSLayout: React.FC<PSLayoutProps> = ({ children }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const pathname = usePathname(); // Usamos o hook do Next.js

    // Fechar o menu automaticamente ao navegar para uma nova rota
    React.useEffect(() => {
        setIsMenuOpen(false);
    }, [pathname]);

    return (
        <html
            suppressHydrationWarning={true}
        >
            <body>
                <div className={styles.mainContainer}>

                    <button
                        className={styles.hamburgerButton}
                        onClick={() => setIsMenuOpen(true)}
                        aria-label="Toggle Navigation Menu"
                    >
                        &#x2261;
                    </button>

                    <SideNav
                        links={navLinks}
                        isOpen={isMenuOpen}
                        onClose={() => setIsMenuOpen(false)}
                    />

                    <div className={styles.contentArea}>
                        {children}
                    </div>

                    {/* Fundo escuro (overlay) quando o menu está aberto no mobile */}
                    {isMenuOpen && <div className={styles.overlay} onClick={() => setIsMenuOpen(false)} />}
                </div>
            </body>
        </html>
    );
};

export default PSLayout;