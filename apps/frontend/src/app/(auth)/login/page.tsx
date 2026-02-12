'use client'
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AuthForm from '@/components/auth/AuthForm';
import { sendResetPasswordSchema, loginSchema } from '@/lib/validations/auth.validation';
import { AuthFormProps, AuthErrorRespose } from "@yawara/types"

const mainFields: AuthFormProps['fields'] = [
    { name: 'email', label: 'E-MAIL', type: 'email' },
    { name: 'password', label: 'SENHA', type: 'password' },
];

const LoginPage: React.FC = () => {
    const router = useRouter();
    const [fields, setFields] = useState<AuthFormProps['fields']>(mainFields);
    const [styleForm, setStyleForm] = useState<'login' | 'forgot'>('login');
    const [error, setError] = useState<{ message: string } | null>(null);

    const handleParseMessage = (message: string | AuthErrorRespose[]): string => {
        if (typeof message === 'string') {
            return message;
        }
        return message.map(msg => msg.message).join('<br/>');
    };

    const handleForgotPasswordSubmit = async (data: Record<string, string | boolean>) => {
        setError(null);
        try{
            const validation = sendResetPasswordSchema.safeParse(data)
            if (!validation.success) {
                setError({ message: handleParseMessage(JSON.parse(validation.error.message)) });
                return;
            }

            const res = await fetch('/api/auth/password/send-verification', {
                method: 'POST',
            });

            if(!res.ok){
                if(res.status === 401){
                    setError({ message: "Ops! Parece que esse usuário não existe." });
                    return;
                }
                throw 'INTERNAL_SERVER_ERROR';
            }

            const res_data = await res.json()

            if(res_data){
                alert("Um e-mail com instruções para redefinição de senha foi enviado, verifique sua caixa de entrada.")
                setStyleForm('login')
                setFields(mainFields);
            }else{
                setError({ message: "Não foi possível processar sua solicitação no momento, tente novamente mais tarde." });
                setFields(mainFields);
            }
        }
        catch (error) {
            setError({ message: "Ah não! estamos passando por instabilidades." });
        }
    }

    
    const handleLogin = async (data: Record<string, string>) => {
        setError(null);
        try {
            const validation = loginSchema.safeParse(data)
            if (!validation.success) {
                setError({ message: handleParseMessage(JSON.parse(validation.error.message)) });
                return;
            }

            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            if(!response.ok){
                if(response.status === 401){
                    setError({ message: "Ops! Parece que seu e-mail ou senha estão incorretos." });
                    return;
                }
            }

            const apiResponse = await response.json();

            if (apiResponse.success) {
                router.push('/in');
            } else {
                setError({ message: handleParseMessage(JSON.parse(apiResponse.error.message)) });
            }

        } catch (error) {
            setError({ message: "Ah não! estamos passando por instabilidades." });
        }
    };

    const handleSubmit = async (data: Record<string, string>) => {
        if (styleForm === 'login') {
            await handleLogin(data);
        } else if (styleForm === 'forgot') {
            await handleForgotPasswordSubmit(data);
        }
    };

    const handleSetLayoutForgotPassword = () => {
        setStyleForm('forgot')
        setFields([{ name: 'email', label: 'E-MAIL', type: 'email' }]);
    }

    useEffect(() => {
        setFields(mainFields);
    }, [])

    return (
        <AuthForm
            type="login"
            title={styleForm === 'login' ? 'LOGIN' : 'SOLICITÇÃO DE REDEFINIÇÃO'}
            fields={fields}
            buttonText="ENTRAR"
            onSubmit={handleSubmit}
            onForgotPassword={handleSetLayoutForgotPassword}
            error={error}
        />
    );
};

export default LoginPage;