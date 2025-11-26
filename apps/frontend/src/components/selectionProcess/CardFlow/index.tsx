'use client';

import React from 'react';
import Link from 'next/link';
import styles from './cardFlow.module.scss';
import { RecruitmentStep, EnumPsCardConfigState } from '@yawara/types';
import {useCard} from '@/hooks/useCard';
import { usePs } from '@/hooks/usePs';

const getCardClassName = (status: EnumPsCardConfigState) => {
    switch (status) {
        case 'COMPLETED':
            return styles.cardCompleted;
        case 'FAILED':
            return styles.cardFailed;
        case 'PENDING_ACTION':
        case 'UNDER_REVIEW':
            return styles.cardWaiting;
        case 'NOT_AVAILABLE':
        default:
            return styles.cardFuture;
    }
};

const StatusIcon: React.FC<{ status: EnumPsCardConfigState }> = ({ status }) => {
    if (status === 'COMPLETED') return <div className={`${styles.statusIcon} ${styles.iconCompleted}`}>✓</div>;
    if (status === 'FAILED') return <div className={`${styles.statusIcon} ${styles.iconFailed}`}>✕</div>;
    return <div className={`${styles.statusIcon} ${styles.iconDefault}`}>•</div>;
};

const Card: React.FC<{ step: RecruitmentStep }> = ({ step }) => {
    const {
        status,
        handleFileChange
    } = useCard(step)

    const cardClass = getCardClassName(status || step.userState);
    const isSubmissionButton = step.id === 2 && step.actionButton;



    return (
        <div className={`${styles.stepCard} ${cardClass}`}>
            <div className={styles.cardHeader}>
                <StatusIcon status={status || step.userState} />
                <h3 className={styles.cardTitle}>{step.title.toUpperCase()}</h3>
            </div>

            <p className={styles.cardDescription} style={{ whiteSpace: 'pre-line' }}>{step.description}</p>

            {step.actionButton && (
                <label>
                    <input type="file" accept={'.pdf'} multiple={false} onChange={handleFileChange} title='Upload file'  style={{ display: 'none' }} />
                    <div role='button' className={`${styles.actionButton} ${isSubmissionButton ? styles.actionButtonSuccess : ''}`}>
                        { status != 'COMPLETED' ? step.actionButton.text : 'Enviar outro arquivo (.pdf)'}
                    </div>
                </label>
            )}

            {step.helpLinks && (
                <div className={styles.helpLinks}>
                    {step.helpLinks.map((link, index) => (
                        <Link key={index} href={link.href} className={styles.helpLink}>
                            {link.text}
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
};

const InteractionCard: React.FC<{ statusClass: string, content: React.ReactNode }> = ({ statusClass, content }) => {
    return (
        <div className={`${styles.stepCard} ${statusClass}`}>
            {content}
        </div>
    );
};

const CardFlow: React.FC = () => {
    const {
        nuclei_1,
        nuclei_2,
        handleChosenNuclei,
        updateChosenNuclei,

        data,
        error,
    } = usePs()


    if (!data) {
        return (
            <div className={styles.cardFlowContainer}>
                <h2 className={styles.pageTitle}>PROCESSO SELETIVO</h2>
                <p>Carregando dados do processo seletivo...</p>
            </div>
        );
    }


    return (
        <div className={styles.cardFlowContainer}>
            <h2 className={styles.pageTitle}>PROCESSO SELETIVO</h2>

            <div className={styles.progressHeader}>
                <p className={styles.progressLabel}>MEU PROGRESSO - {data.title}</p>
                <div className={styles.progressBar}>
                    <div
                        className={styles.progressFill}
                        style={{ width: `${data.progressPercentage}%` }}
                    />
                </div>
            </div>

            <h3 className={styles.currentStepHeader}>VOCÊ ESTÁ NA — ETAPA</h3>

            <div className={styles.stepsGrid}>
                {data.steps.filter(step => step.id !== 5).map((step) => (
                    step.state !== "NOT_AVAILABLE" && <Card key={step.id} step={step} />
                ))}
            </div>

            <div className={styles.interactionBlocks}>

                {data.nucleusChoice?.isWaiting && (
                    <InteractionCard
                        statusClass={data.nucleusChoice.isWaiting ? styles.nucleusChoiceWaiting : styles.nucleusChoice}
                        content={
                            <>
                                <h4 className={styles.blockTitle}>Escolha quais núcleos você se interessa:</h4>

                                <div className={styles.selectionGroup}>
                                    {
                                        (data.steps.filter(step => step.id === 5)[0].userState === 'COMPLETED') ? (

                                            <div className={styles.selectedNucleus}>
                                                <span> {data.nucleusChoice.firstOption} </span>
                                            </div>

                                        ) : (
                                            <select className={styles.selectInput} title='Primeira opção' defaultValue={data.nucleusChoice.firstOption} onChange={handleChosenNuclei} value={nuclei_1}>
                                                {
                                                    data.nucleusChoice.eligibleNuclei?.map((nucleus) => (
                                                        <option key={nucleus} value={nucleus}>{`Núcleo de ${nucleus}`}</option>
                                                    ))
                                                }
                                            </select>
                                        )
                                    }
                                </div>

                                <div className={styles.selectionGroup}>
                                    {
                                        (data.steps.filter(step => step.id === 5)[0].userState === 'COMPLETED') ? (

                                            <div className={styles.selectedNucleus}>
                                                <span> {data.nucleusChoice.secondOption} </span>
                                            </div>

                                        ) : (
                                            <select className={styles.selectInput} title='Segunda opção' defaultValue={data.nucleusChoice.secondOption} onChange={handleChosenNuclei} value={nuclei_2}>
                                                {
                                                    data.nucleusChoice.eligibleNuclei?.map((nucleus) => (
                                                        <option key={nucleus} value={nucleus}>{`Núcleo de ${nucleus}`}</option>
                                                    ))
                                                }
                                            </select>
                                        )
                                    }
                                </div>

                                {data.nucleusChoice.showSelectionButton && (
                                    <button onClick={() => updateChosenNuclei()} className={styles.selectionButton}>ENVIAR ESCOLHA</button>
                                )}
                            </>
                        }
                    />
                )}

                {data.finalResult?.show && (
                    <InteractionCard
                        statusClass={data.finalResult.show ? styles.finalResultFailed : styles.finalResult}
                        content={
                            <>
                                <h4 className={styles.blockTitle}>RESULTADO FINAL</h4>
                                <p>{data.finalResult.message}</p>
                                <Link href={data.finalResult.evaluationPdfLink} className={styles.downloadLink}>
                                    Baixar PDF de avaliação do PS 2026/1
                                </Link>
                            </>
                        }
                    />
                )}

            </div>
        </div>
    );
};

export default CardFlow;