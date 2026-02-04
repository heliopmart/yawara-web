'use client';
import React, { useState } from 'react';
import AuthForm from '@/components/auth/AuthForm';
import { registreSchema } from '@/lib/validations/auth.validation';
import { COURSE_GROUPED_MOCK } from '@/mocks/register.mock';
import { useRouter } from 'next/navigation';
import {AuthErrorRespose} from "@yawara/types"

const RegisterPage: React.FC = () => {
  const router = useRouter();
  const [error, setError] = useState<{ message: string } | null>(null);

  const handleParseMessage = (message: string | AuthErrorRespose[]): string => {
    if (typeof message === 'string') {
      return message;
    }
    return message.map(msg => msg.message).join('<br/>');
  };

  const handleRegister = async (data: Record<string, string>) => {
    setError(null);

    const { password, confirmPassword, ...restOfData } = data;

    if (password !== confirmPassword) {
      setError({ message: 'As senhas não conferem.' });
      return;
    }

    const validation = registreSchema.safeParse({...data, yearOfEntry: parseInt(data.yearOfEntry) });
    if (!validation.success) {
      setError({ message: handleParseMessage(JSON.parse(validation.error.message)) });
      return;
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validation.data),
      });

      const apiResponse = await response.json();

      if (apiResponse.success) {
        router.push('/login?status=registered');
      } else {
        setError({ message: handleParseMessage(JSON.parse(apiResponse.error.message)) });
      }

    } catch (error) {
      console.error('Erro de rede ou parsing:', error);
      setError({ message: "Ah não! estamos passando por instabilidades." });
    }
  };
  const registerFields = [
    { name: 'name', label: 'NOME COMPLETO', type: 'text' },
    { name: 'email', label: 'E-MAIL', type: 'email' },
    {
      name: 'course',
      label: 'CURSO',
      type: 'select',
      options: COURSE_GROUPED_MOCK
    },
    { name: 'yearOfEntry', label: 'ANO DE INGRESSO', type: 'number'},
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