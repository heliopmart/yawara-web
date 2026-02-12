'use client';
import React, { useState } from 'react';
import AuthForm from '@/components/auth/AuthForm';
import { registreSchema } from '@/lib/validations/auth.validation';
import { COURSE_GROUPED_MOCK } from '@/mocks/register.mock';
import { useRouter } from 'next/navigation';
import { AuthErrorRespose } from "@yawara/types"


function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

const RegisterPage: React.FC = () => {
  const router = useRouter();
  const [error, setError] = useState<{ message: string } | null>(null);

  const handleParseMessage = (message: string | AuthErrorRespose[]): string => {
    if (typeof message === 'string') {
      return message;
    }
    return message.map(msg => msg.message).join('<br/>');
  };

  const handleRegister = async (data: Record<string, string | boolean>) => {
    setError(null);

    const { password, confirmPassword, ...restOfData } = data;
    const wpa: any = { ...restOfData };
    let subscription = null;

    if (password !== confirmPassword) {
      setError({ message: 'As senhas não conferem.' });
      return;
    }

    if (data.wpa_enabled) {
      try {
        alert("Para receber notificações, por favor permita o recebimento de notificações quando solicitado pelo navegador. Você pode cancelar a qualquer momento nas configurações do navegador.");

        if (!('serviceWorker' in navigator)) {
          throw new Error("Service Worker não suportado pelo navegador.");
        }

        const registration = await navigator.serviceWorker.getRegistration();

        if (!registration) {
          console.error("Nenhum Service Worker encontrado. Certifique-se de que ele foi registrado no layout.");
          throw new Error("SW_NOT_REGISTERED");
        }

        const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        if (!publicVapidKey) throw new Error("VAPID Key não configurada.");

        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
        });

        wpa.wpa_subscription = subscription.toJSON();
        wpa.wpa_enabled = true;

        wpa.wpa_subscription = subscription.toJSON();
        wpa.wpa_enabled = true;
      } catch (e) {
        console.warn("Usuário negou notificações ou erro no browser", e);
        wpa.wpa_enabled = false;
      }
    }


    const validation = registreSchema.safeParse({ ...data, ...wpa, yearOfEntry: parseInt(data.yearOfEntry as string) });
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
    { name: 'yearOfEntry', label: 'ANO DE INGRESSO', type: 'number' },
    { name: 'password', label: 'SENHA', type: 'password', minLength: 6 },
    { name: 'confirmPassword', label: 'CONFIRMAR SENHA', type: 'password', minLength: 6 },
    {
      name: 'wpa_enabled',
      label: 'DESEJO RECEBER NOTIFICAÇÕES DE PRAZOS E NOTAS',
      type: 'checkbox'
    },
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