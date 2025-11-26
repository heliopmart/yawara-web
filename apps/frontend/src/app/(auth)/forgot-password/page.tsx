'use client'
import React from 'react';
import AuthForm from '@/components/auth/AuthForm';

const handleForgotPassword = (data: Record<string, string>) => {
  console.log('Dados de Login Enviados (para auth-api):', data);
  // Futuramente, use axios ou fetch para enviar dados ao seu auth-api:
  // fetch('http://localhost:4000/api/login', { method: 'POST', body: JSON.stringify(data) });
};

const ForgotPasswordPage: React.FC = () => {
  const forgotPasswordFields = [
    { name: 'email', label: 'E-MAIL', type: 'email' },
    { name: 'password', label: 'SENHA', type: 'password' },
    { name: 'confirm-password', label: 'CONFIRMAR SENHA', type: 'password' },
  ];

  return (
    <AuthForm
      type="login"
      title="LOGIN"
      fields={forgotPasswordFields}
      buttonText="ENTRAR"
      onSubmit={handleForgotPassword}
      error={null}
    />
  );
};

export default ForgotPasswordPage;