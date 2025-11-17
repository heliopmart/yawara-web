import React from 'react';
import '@/styles/globals.scss';

import Header from '@/components/layout/Header';

interface AuthLayoutProps {
  children: React.ReactNode;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <html
        suppressHydrationWarning={true}
    >
        <body>
            <Header />

            {children}
        </body>
    </html>
  );
};

export default AuthLayout;