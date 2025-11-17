import React from 'react';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

import '@/styles/globals.scss';

import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
    title: 'Equipe Yawara | UFGD',
    description: 'Projeto de extensão e pesquisa da equipe Yawara Motostudent focado em engenharia de alta performance e sustentabilidade.',
};


interface RootLayoutProps {
    children: React.ReactNode;
}

const RootLayout = ({ children }: { children: React.ReactNode }) => {
return (
    <html
        suppressHydrationWarning={true}
    >
        <body>
            <Header />

            {children}

            <Footer />
        </body>
    </html>
);
};

export default RootLayout;