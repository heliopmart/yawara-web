'use client';
import '@/styles/globals.scss';

import React, { useState, useMemo } from 'react';
import styles from './processoSeletivoLayout.module.scss';
import SideNav from '@/components/selectionProcess/SideNav';
import { AuthRole } from '@yawara/types';
import { usePathname } from 'next/navigation'; 

import { getLinksByRole } from '@/config/navigation';
import { useUserRole } from '@/hooks/useUserRole';

interface AccountLayoutProps {
    children: React.ReactNode;
}

const AccountLayout: React.FC<AccountLayoutProps> = ({ children }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const pathname = usePathname();

    const { role, isLoading } = useUserRole();

    const navLinks = useMemo(() => {
        if (isLoading) return [];
        return getLinksByRole(role as AuthRole);
    }, [role, isLoading]);

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

                    {isMenuOpen && <div className={styles.overlay} onClick={() => setIsMenuOpen(false)} />}
                </div>
            </body>
        </html>
    );
};

export default AccountLayout;