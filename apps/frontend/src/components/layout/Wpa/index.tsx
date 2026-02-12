'use client';

import { useEffect } from 'react';

export default function WpaRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => console.log('Yawara SW registrado!', reg.scope))
        .catch((err) => console.error('Erro ao registrar SW:', err));
    }
  }, []);

  return null; 
}