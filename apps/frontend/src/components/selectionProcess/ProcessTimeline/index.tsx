'use client';

import React from 'react';
import Link from 'next/link';
import styles from './processTimeline.module.scss';
import { usePs } from '@/hooks/usePs';
import { useCard } from '@/hooks/useCard';
import { RecruitmentStep } from '@yawara/types';
import { LoadingState } from './LoadingState';

export const TimelineStep = ({ step, index }: { step: RecruitmentStep; index: number }) => {
    const { status, handleFileChange } = useCard(step);
    const isActive = step.userState === "PENDING_ACTION";

    return (
        <div className={`${styles.stepRow} ${styles[step.userState?.toLowerCase() || 'not_available']}`}>
            <div className={styles.indicator}>
                <div className={styles.node}>
                    {step.userState === 'COMPLETED' ? '✓' : index + 1}
                </div>
                <div className={styles.line} />
            </div>

            <div className={`${styles.content}`}>
                <header>
                    <h3>{step.title}</h3>
                    <span className={styles.statusLabel}>{step.userState === 'COMPLETED' ? "COMPLETO" : "PENDENTE"}</span>
                </header>

                {(step.state !== 'NOT_AVAILABLE' && step.userState !== 'NOT_AVAILABLE') ? (
                    <>
                        <p>{step.description}</p>
                        {
                            step.helpLinks?.map((link, idx) => (
                                <p key={idx}>Entenda sobre: <Link href={link.href}>{link.text}</Link></p>
                            ))
                        }

                        {index === 1 && step.userState === 'PENDING_ACTION' && (
                            <a href={'download/challenge.pdf'} className={styles.downloadLink}>
                                BAIXAR DESAFIO ( PDF )
                            </a>
                        )}

                        {isActive && (status === 'PENDING_ACTION' || status === 'FAILED') && (
                            <div className={styles.actionArea}>
                                <label className={styles.uploadBtn}>
                                    ANEXAR DOCUMENTAÇÃO
                                    <input type="file" onChange={handleFileChange} hidden />
                                </label>
                            </div>
                        )}

                    </>
                ) : ""}
            </div>
        </div>
    );
};

export const ProcessTimeline = () => {
    const {
        data,
        register_PS,
        handle_sign_up_ps,
        nuclei_1,
        nuclei_2,
        handleChosenNuclei,
        updateChosenNuclei,
        error
    } = usePs();

    if (error && !register_PS) return <div className={styles.error}>{error.message}</div>;

    // Estado: Sem Processo Ativo
    if (register_PS) {
        return (
            <div className={styles.onboarding}>
                <div className={styles.glitchTitle} data-text="PROCESSO SELETIVO">PROCESSO SELETIVO</div>
                <h2>YAWARA MOTOSTUDENT</h2>
                <p>Nenhuma inscrição ativa encontrada para seu perfil. Clique no botão abaixo para iniciar o protocolo de inscrição.</p>
                <button onClick={handle_sign_up_ps} className={styles.primaryBtn}>FAZER INSCRIÇÃO</button>
            </div>
        );
    }

    if (!data) return <LoadingState/>;


    return (
        <div className={styles.timelineContainer}>
            {/* 1. Fluxo de Etapas */}
            <section className={styles.stepsSection}>
                {data.steps.map((step, idx) => (
                    <TimelineStep key={step.id} step={step} index={idx} />
                ))}
            </section>

            {/* 2. Seleção de Núcleos (Dinâmico) */}
            {data.nucleusChoice?.isWaiting && (
                <section className={styles.interactionCard}>
                    <div className={styles.cardHeader}>
                        <span className={styles.redDot} />
                        <h4>ALOCAÇÃO DE NÚCLEO</h4>
                    </div>
                    <div className={styles.selectGrid}>
                        <select value={nuclei_1} title='Primeira Opção' onChange={(e) => handleChosenNuclei(e)}>
                            <option value="" disabled>1ª Opção de Núcleo</option>
                            {data.nucleusChoice?.eligibleNuclei?.map(n => <option key={n} value={n}>{n}</option>)}
                        </select>
                        <select value={nuclei_2} title='Segunda Opção' onChange={(e) => handleChosenNuclei(e)}>
                            <option value="" disabled>2ª Opção de Núcleo</option>
                            {data.nucleusChoice?.eligibleNuclei?.map(n => <option key={n} value={n}>{n}</option>)}
                        </select>
                    </div>
                    {data.nucleusChoice.showSelectionButton && (
                        <button onClick={updateChosenNuclei} className={styles.confirmBtn}>CONFIRMAR ESCOLHAS</button>
                    )}
                </section>
            )}

            {/* 3. Resultado Final */}
            {data.finalResult?.show && (
                <section className={`${styles.interactionCard} ${styles.resultCard}`}>
                    <h4>VEREDITO FINAL</h4>
                    <p>{data.finalResult.message}</p>
                    <a href={data.finalResult.evaluationPdfLink} className={styles.downloadLink}>
                        BAIXAR RELATÓRIO DE DESEMPENHO (PDF)
                    </a>
                </section>
            )}
        </div>
    );
};
