import React from 'react';
import Link from 'next/link';
import styles from './accountDashboard.module.scss';
import DynamicAlertCard from '@/components/account/DynamicAlertCard';

const StaticLinks = () => (
  <div className={styles.linksGrid}>
    <Link href="/in/tools" className={styles.staticCard}>
      <h3>Equipamentos</h3>
      <p>Aloque seus equipamentos aqui.</p>
    </Link>
    <Link href="/in/my-account" className={styles.staticCard}>
      <h3>Minha Conta</h3>
      <p>Gerencie suas informações pessoais e configurações.</p>
    </Link>
    <Link href="/in/nuclei" className={styles.staticCard}>
      <h3>Núcleos</h3>
      <p>Verifique o que os outros núcleos estão fazendo.</p>
    </Link>
  </div>
);

const AccountDashboard: React.FC = () => {
    
    let cardProps = {
        title: "BEM-VINDO DE VOLTA",
        message: "Não há novas mensagens ou ações pendentes. Verifique o menu lateral para detalhes.",
        buttonText: "Ver Minha Equipe",
        buttonLink: "/in/my-team",
        statusColor: "default" as "default" | "warning" | "success",
    };

    return (
        <div className={styles.dashboardContainer}>
            <DynamicAlertCard {...cardProps} />   

            <section className={styles.quickAccess}>
                <h2>Acesso Rápido</h2>
                <StaticLinks />
            </section>         
        </div>
    );
};

export default AccountDashboard;