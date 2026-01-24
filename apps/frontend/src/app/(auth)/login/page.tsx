'use client'
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import AuthForm from '@/components/auth/AuthForm';

const LoginPage: React.FC = () => {
    const router = useRouter();
    const [error, setError] = useState<{ message: string } | null>(null);

    const handleLogin = async (data: Record<string, string>) => {
        setError(null);
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            const apiResponse = await response.json();

            if (apiResponse.success) {
                router.push('/in');
            } else {
                setError({ message: apiResponse.error.message });
            }

        } catch (error) {
            console.error('Erro de rede ou parsing:', error);
            setError({ message: "Ah não! estamos passando por instabilidades." });
        }
    };

    const loginFields = [
        { name: 'email', label: 'E-MAIL', type: 'email' },
        { name: 'password', label: 'SENHA', type: 'password' },
    ];

    return (
        <AuthForm
            type="login"
            title="LOGIN"
            fields={loginFields}
            buttonText="ENTRAR"
            onSubmit={handleLogin}
            error={error}
        />
    );
};

export default LoginPage;