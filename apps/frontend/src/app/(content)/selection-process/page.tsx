'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './selectionProcessLanding.module.scss';
import { TimelineStep, FAQItem } from "@yawara/types"
import { SP_LANDING_MOCK } from '@/mocks/spLanding.mock'; 

// --- Componentes Auxiliares ---

// Componente para a Linha do Tempo Animada/Responsiva
const Timeline: React.FC<{ steps: TimelineStep[] }> = ({ steps }) => {
    return (
        <div className={styles.timelineGrid}>
            {steps.map((step, index) => (
                <div key={step.id} className={styles.timelineStep}>
                    <div className={styles.stepConnector} />
                    <div className={styles.stepMarker}>
                        {step.isCompleted ? '✓' : index + 1}
                    </div>
                    <span className={styles.timelineLabel}>{step.title}</span>
                </div>
            ))}
        </div>
    );
};


// Componente para o FAQ (Acordeão)
const FAQ: React.FC<{ faq: FAQItem[] }> = ({ faq }) => {
    const [activeIndex, setActiveIndex] = useState<number | null>(null);

    const toggleFAQ = (index: number) => {
        setActiveIndex(index === activeIndex ? null : index);
    };

    return (
        <div className={styles.faqList}>
            {faq.map((item) => (
                <div
                    key={item.id}
                    className={styles.faqItem}
                    onClick={() => toggleFAQ(item.id)}
                >
                    <div className={styles.faqQuestion}>
                        {item.question}
                        <span className={styles.faqIcon}>
                            {item.id === activeIndex ? '−' : '+'}
                        </span>
                    </div>
                    <div className={`${styles.faqAnswer} ${item.id === activeIndex ? styles.faqAnswerOpen : ''}`}>
                        {item.answer}
                    </div>
                </div>
            ))}
        </div>
    );
};


const SelectionProcessLanding: React.FC = () => {
    const data = SP_LANDING_MOCK;
    const renderDescription = (text: string, highlights: string[]) => {
        let content: React.ReactNode[] = [text];
        highlights.forEach(term => {
            content = content.flatMap(segment => {
                if (typeof segment === 'string' && segment.includes(`[TERM_${term}]`)) {
                    const parts = segment.split(`[TERM_${term}]`);
                    const nodes: React.ReactNode[] = [];
                    parts.forEach((part, i) => {
                        nodes.push(part);
                        if (i < parts.length - 1) {
                            nodes.push(<strong key={term + i}>{term}</strong>);
                        }
                    });
                    return nodes;
                }
                return segment;
            }) as React.ReactNode[];
        });
        return content;
    };


    return (
        <main className={styles.mainContent}>

            {/* 1. HERO / HEADLINE */}
            <section className={styles.heroSection}>
                <header className={styles.header}>
                    <div className={styles.contentWrapper}>
                        <div className={styles.contentTitle}>
                            <h1 className={styles.title}>
                                PROCESSO SELETIVO
                            </h1>
                            <h2 className={styles.subtitle}>
                                Só os melhores são selecionados no processo seletivo do YAWARA. <br/>
                                Inspirado nos modelos da Microsoft e Amazon a PS Yawara combina teoria e prática com desafios reais do projeto, e com uma pitada de Rede Neural para avaliar os candidatos
                            </h2>
                            <Link href={'/login'}>
                                <button className={styles.ctaButton}>
                                    quero me inscrever
                                </button>
                            </Link>
                        </div>
                    </div>
                </header>

            </section>

            <section className={styles.timelineSection}>
                <h2 className={styles.timelineTitle}>Linha do tempo do PS</h2>
                <Timeline steps={data.timeline} />
            </section>

            <section className={styles.techSection}>
                <div className={styles.techContent}>
                    <div className={styles.techImageBlock}>
                        <Image
                            src={'/images/castle-image-ps.png'}
                            alt='Image tec'
                            width={400}
                            height={300}
                            className={styles.techImage}
                        />
                    </div>

                    <div className={styles.techTextBlock}>
                        <h2 className={styles.techTitle}>{data.techBlock.title}</h2>
                        <p className={styles.techIntro}>{data.techBlock.intro}</p>
                        <p className={styles.techDescription}>
                            {renderDescription(data.techBlock.description, data.techBlock.highlightedTerms)}
                        </p>
                        <Link className={styles.techLink} href='/selection-process/score-predictor'>Entenda melhor a Y-SNA e faça um teste com seu histórico.</Link>
                    </div>
                </div>
                <div className={styles.techContent}>
                    <div className={styles.techTextBlock}>
                        <h2 className={styles.techTitle}>{data.processBlock.title}</h2>
                        <p className={styles.techDescription}>
                            {renderDescription(data.processBlock.description, data.processBlock.highlightedTerms)}
                        </p>
                    </div>
                    <div className={styles.techImageBlock}>
                        <Image
                            src={'/images/forge-image-ps.png'}
                            alt='Image tec'
                            width={400}
                            height={300}
                            className={styles.techImage}
                        />
                    </div>
                </div>
            </section>

            {/* 4. FAQ */}
            <section className={styles.faqSection}>
                <h2 className={styles.faqTitle}>Perguntas Frequentes</h2>
                <FAQ faq={data.faq} />
            </section>

        </main>
    );
};

export default SelectionProcessLanding;