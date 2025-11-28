'use client';

import { useState, useEffect } from 'react';
import styles from './CookieBanner.module.scss';
import Link from 'next/link';

import {getCookie, setCookie} from '@/utils/frontCookie'

export default function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = getCookie('yawara_cookie_consent');
    
    if (!consent) {
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    setCookie('yawara_cookie_consent', 'true', 365);
    setIsVisible(false);
  };

  const handleClose = () => {
      setIsVisible(false);
  }

  if (!isVisible) return null;

  return (
    <div className={styles.bannerContainer}>
      <div className={styles.content}>
        <p>
          Utilizamos cookies para melhorar a sua experiência em nossa plataforma e analisar o tráfego. 
          Ao continuar navegando, você concorda com a nossa{' '}
          <Link href="/politica-de-privacidade">Política de Privacidade</Link>.
        </p>
      </div>
      
      <div className={styles.actions}>
        {/* Botão opcional de fechar/recusar */}
        {/* <button onClick={handleClose} className={styles.closeButton}>
          Fechar
        </button> */}

        <button onClick={handleAccept} className={styles.acceptButton}>
          Aceitar e Continuar
        </button>
      </div>
    </div>
  );
}