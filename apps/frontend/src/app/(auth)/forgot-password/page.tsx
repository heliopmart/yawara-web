'use client'

import React, { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import AuthForm from '@/components/auth/AuthForm';
import { resetPasswordSchema } from '@/lib/validations/auth.validation';
import { AuthErrorRespose } from "@yawara/types";

const ResetPasswordContent: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<{ message: string } | null>(null);
  
  const hash = searchParams.get('hash');

  const handleResetPassword = async (data: Record<string, string | boolean>) => {
    setError(null);

    if (data.password !== data.confirmPassword) {
      setError({ message: 'As senhas não conferem.' });
      return;
    }

    const handleParseMessage = (message: string | AuthErrorRespose[]): string => {
      if (typeof message === 'string') return message;
      return message.map(msg => msg.message).join('<br/>');
    };

    const validation = resetPasswordSchema.safeParse({
      password: data.password,
      email: data.email,
      hash: hash,
    });

    if (!validation.success) {
      setError({ message: handleParseMessage(JSON.parse(validation.error.message)) });
      return;
    }

    try {
      const response = await fetch('/api/auth/password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validation.data),
      });

      if (!response.ok) throw 'INTERNAL_SERVER_ERROR';

      const res_data = await response.json();

      if (res_data.success) {
        router.push('/login?status=password_updated');
      } else {
        setError({ message: res_data.error.message || 'Link inválido ou expirado.' });
      }
    } catch (err) {
      setError({ message: 'Erro ao conectar com o servidor.' });
    }
  };

  const resetFields = [
    { name: 'email', label: 'E-MAIL', type: 'email' },
    { name: 'password', label: 'NOVA SENHA', type: 'password' },
    { name: 'confirmPassword', label: 'CONFIRMAR NOVA SENHA', type: 'password' },
  ];

  return (
    <AuthForm
      type="login"
      title="REDEFINIR SENHA"
      fields={resetFields}
      buttonText="ATUALIZAR SENHA"
      onSubmit={handleResetPassword}
      error={error}
    />
  );
};

const ResetPasswordPage: React.FC = () => {
  return (
    <Suspense fallback={null}>
      <ResetPasswordContent />
    </Suspense>
  );
};

export default ResetPasswordPage;