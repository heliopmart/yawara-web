'use client';
import React from 'react';
import AuthForm from '@/components/auth/AuthForm';
import { useRouter } from 'next/navigation';

const handleRegister = (data: Record<string, string>) => {
  console.log('Dados de Cadastro Enviados (para auth-api):', data);
  
  // Após o cadastro bem-sucedido, redireciona para a tela de confirmação de e-mail
  // router.push('/registre/confirm'); 
};

const RegisterPage: React.FC = () => {
  // Use 'use client' aqui se for usar o hook useRouter
  
  const registerFields = [
    { name: 'name', label: 'NOME COMPLETO', type: 'text' },
    { name: 'email', label: 'E-MAIL', type: 'email' },
    { name: 'password', label: 'SENHA', type: 'password' },
    { name: 'confirmPassword', label: 'CONFIRMAR SENHA', type: 'password' },
  ];

  return (
    <AuthForm
      type="register"
      title="CADASTRO"
      fields={registerFields}
      buttonText="CADASTRAR"
      onSubmit={handleRegister}
    />
  );
};

export default RegisterPage;