import React from 'react';
import type { Metadata } from 'next';
import WpaRegister from '@/components/layout/Wpa'
import { Inter } from 'next/font/google';

import '@/styles/globals.scss';

import CookieBanner from '@/components/cookieBanner'

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
    title: 'Equipe Yawara | UFGD',
    description: 'Projeto de extensão e pesquisa da equipe Yawara Motostudent focado em engenharia de alta performance e sustentabilidade.',
    icons: {
        icon: '/favicon.ico',
        shortcut: '/favicon.ico',
        apple: '/favicon.ico',

    },
};

const RootLayout = ({ children }: { children: React.ReactNode }) => {
    return (
        <html
            suppressHydrationWarning={true}
        >
            <body>
                <WpaRegister />
                {children}
                <CookieBanner />
            </body>
        </html>
    );
};

export default RootLayout;