'use client'; 
import React from 'react';
import styles from './accountDashboard.module.scss';
import DynamicAlertCard from '@/components/account/DynamicAlertCard';
import { PS_MOCK_DATA } from '@/mocks/ps.mock'; 

// Definindo o tipo de status principal para o dashboard
type DashboardStatus = 'ACTION_NEEDED' | 'REVIEW_IN_PROGRESS' | 'WELCOME';

const getDashboardStatus = (data: typeof PS_MOCK_DATA): DashboardStatus => {
    const requiresAction = data.steps.some(step => step.userState === 'PENDING_ACTION');
    
    if (requiresAction || data.nucleusChoice?.isWaiting) {
        return 'ACTION_NEEDED';
    }
    const allCompleted = data.steps.every(step => step.userState === 'COMPLETED' || step.userState === 'FAILED');

    if (allCompleted && !data.finalResult) {
        return 'REVIEW_IN_PROGRESS';
    }
    
    return 'WELCOME';
};

const AccountDashboard: React.FC = () => {
    const userData = PS_MOCK_DATA; 
    const status = getDashboardStatus(userData);
    
    // ----------------------------------------------------
    // Lógica para o DynamicAlertCard:
    // ----------------------------------------------------
    let cardProps = {
        title: "BEM-VINDO DE VOLTA",
        message: "Não há novas mensagens ou ações pendentes. Verifique o menu lateral para detalhes.",
        buttonText: "Ver Minha Equipe",
        buttonLink: "/account/my-team",
        statusColor: "default" as "default" | "warning" | "success",
    };

    if (status === 'ACTION_NEEDED') {
        const nextStep = userData.steps.find(step => step.userState === 'PENDING_ACTION');
        
        cardProps.title = "ATENÇÃO: AÇÃO NECESSÁRIA";
        cardProps.message = nextStep 
            ? `Você precisa concluir a etapa: ${nextStep.title.toUpperCase()}.`
            : "Sua escolha de núcleo está pendente. Por favor, envie sua preferência.";
        cardProps.buttonText = nextStep ? nextStep.actionButton?.text || "Ir para Etapa" : "Enviar Escolha";
        cardProps.buttonLink = nextStep ? "/account" : "/account"; // O link deve ser ajustado
        cardProps.statusColor = "warning";
        
    } else if (status === 'REVIEW_IN_PROGRESS') {
        cardProps.title = "EM ANÁLISE";
        cardProps.message = "Parabéns! Suas etapas foram concluídas. Os resultados estão sendo avaliados e serão publicados em breve.";
        cardProps.buttonText = "Ver Processo Seletivo";
        cardProps.buttonLink = "/account";
        cardProps.statusColor = "default";
    }

    return (
        <div className={styles.dashboardContainer}>
            <DynamicAlertCard {...cardProps} />            
        </div>
    );
};

export default AccountDashboard;