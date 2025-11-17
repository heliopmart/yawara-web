import React from 'react';
import Link from 'next/link';
import styles from '@/components/auth/AuthForm/authForm.module.scss';

const EmailConfirmationPage: React.FC = () => {
  return (
    <div className={styles.authContainer}>
      <div className={styles.authBox}>
        <h2 className={styles.title}>VERIFIQUE SEU E-MAIL</h2>
        
        <p style={{marginBottom: '20px', color: '#aaaaaa'}}>
          Enviamos um link de confirmação para o seu endereço de e-mail. Por favor, clique no link para ativar sua conta.
        </p>

        <p style={{marginBottom: '30px', fontWeight: 'bold'}}>
          Se não encontrar, verifique a pasta de spam.
        </p>

        <Link href="/login" className={styles.submitButton}>
          VOLTAR PARA O LOGIN
        </Link>
        
        <div className={styles.footerLinks}>
            <p>Precisa de ajuda? <Link href="/contactUs" className={styles.smallLink}>Contate-nos</Link></p>
        </div>

      </div>
    </div>
  );
};

export default EmailConfirmationPage;