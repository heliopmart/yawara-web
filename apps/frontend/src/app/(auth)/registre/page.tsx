'use client';
import React, { useState } from 'react';
import AuthForm from '@/components/auth/AuthForm';
import { useRouter } from 'next/navigation';

const RegisterPage: React.FC = () => {
  const router = useRouter();
  const [error, setError] = useState<{ message: string } | null>(null);
  

  const handleRegister = async (data: Record<string, string>) => {
    setError(null);

    const { password, confirmPassword, ...restOfData } = data;

    if (password !== confirmPassword) {
      setError({ message: 'As senhas não conferem.' });
      return;
    }
    const apiData = {
      ...restOfData,
      password,
    };

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiData),
      });

      const apiResponse = await response.json();

      if (apiResponse.success) {
        router.push('/login?status=registered');
      } else {
        setError({ message: apiResponse.error.message });
      }

    } catch (error) {
      console.error('Erro de rede ou parsing:', error);
      setError({ message: "Ah não! estamos passando por instabilidades." });
    }
  };
  const registerFields = [
    { name: 'name', label: 'NOME COMPLETO', type: 'text' },
    { name: 'email', label: 'E-MAIL', type: 'email' },
    { name: 'course', label: 'CURSO', type: 'text' },
    { name: 'password', label: 'SENHA', type: 'password', minLength: 6 },
    { name: 'confirmPassword', label: 'CONFIRMAR SENHA', type: 'password', minLength: 6 },
  ];

  return (
    <AuthForm
      type="register"
      title="CADASTRO"
      fields={registerFields}
      buttonText="CADASTRAR"
      onSubmit={handleRegister}
      error={error}
    />
  );
};

export default RegisterPage;