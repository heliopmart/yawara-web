'use client'
import React from 'react';
import AuthForm from '@/components/auth/AuthForm';

const handleLogin = (data: Record<string, string>) => {
  console.log('Dados de Login Enviados (para auth-api):', data);
  // Futuramente, use axios ou fetch para enviar dados ao seu auth-api:
  // fetch('http://localhost:4000/api/login', { method: 'POST', body: JSON.stringify(data) });
};

const LoginPage: React.FC = () => {
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
    />
  );
};

export default LoginPage;