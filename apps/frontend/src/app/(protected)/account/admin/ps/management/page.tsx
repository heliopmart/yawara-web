'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './management.module.scss';

// Definição técnica dos critérios conforme Metodologia Yawara
interface Criterion {
    key: string;
    label: string;
    type: 'NUMBER' | 'PERCENTAGE';
    max: number;
}

interface Candidate {
    id: string;
    name: string;
    currentCard: number;
    cardName: string;
    status: 'PRESENT' | 'ABSENT' | 'PENDING';
    scores: Record<string, number>;
}

const PsManagementPage = () => {
    const router = useRouter();
    const [view, setView] = useState<'PRESENCE' | 'SCORES'>('PRESENCE');
    const [selectedCard, setSelectedCard] = useState<number>(2);
    const [candidates, setCandidates] = useState<Candidate[]>([]);

    // Configurações Dinâmicas baseadas na Metodologia
    const cardConfigs: Record<number, Criterion[]> = {
        2: [ // A FORJA: Foco em Teoria e Base-line
            { key: 'alpha', label: 'CÁLCULO/FÍSICA (α)', type: 'NUMBER', max: 10 },
            { key: 'beta', label: 'LÓGICA/VETORES (β)', type: 'NUMBER', max: 10 },
        ],
        4: [ // CORREDOR POLONÊS: Prática e Saturação
            { key: 'gamma', label: 'PRÁTICA BANCADA (γ)', type: 'NUMBER', max: 10 },
            { key: 'delta', label: 'RESOLUÇÃO (δ)', type: 'NUMBER', max: 10 },
            { key: 'lambda', label: 'SOFT SKILLS (λ)', type: 'NUMBER', max: 10 },
        ],
        5: [ // PORTÃO DE FERRO: Avaliação Final
            { key: 'final_eval', label: 'ENTREVISTA FINAL', type: 'NUMBER', max: 10 },
            { key: 'fit_cultural', label: 'FIT CULTURAL', type: 'NUMBER', max: 10 },
        ]
    };

    useEffect(() => {
        const mockCandidates: Candidate[] = [
            { id: 'C01', name: 'Hélio Pinheiro', currentCard: 2, cardName: 'A Forja', status: 'PENDING', scores: {} },
            { id: 'C02', name: 'Candidato Alfa', currentCard: 2, cardName: 'A Forja', status: 'PRESENT', scores: { alpha: 8, beta: 9 } },
        ];
        setCandidates(mockCandidates);
    }, []);

    const updateScore = (candidateId: string, key: string, value: number) => {
        setCandidates(prev => prev.map(c => 
            c.id === candidateId ? { ...c, scores: { ...c.scores, [key]: value } } : c
        ));
    };

    const currentCriteria = cardConfigs[selectedCard] || [];

    return (
        <main className={styles.container}>
            <header className={styles.header}>
                <div className={styles.titleInfo}>
                    <span className={styles.badge}>MODERAÇÃO - Avaliação do Processo Seletivo</span>
                    <h1>Processo Seletivo: Name Process </h1>
                </div>
                
                <nav className={styles.viewToggle}>
                    <button className={view === 'PRESENCE' ? styles.active : ''} onClick={() => setView('PRESENCE')}>
                        PRESENÇA
                    </button>
                    <button className={view === 'SCORES' ? styles.active : ''} onClick={() => setView('SCORES')}>
                        NOTAS DINÂMICAS
                    </button>
                </nav>
            </header>

            <section className={styles.filterBar}>
                <label>ETAPA ATUAL:</label>
                <select value={selectedCard} onChange={(e) => setSelectedCard(Number(e.target.value))} title='A'>
                    <option value={2}>CARD 02 - A FORJA</option>
                    <option value={4}>CARD 04 - CORREDOR POLONÊS</option>
                    <option value={5}>CARD 05 - PORTÃO DE FERRO</option>
                </select>
            </section>

            <div className={styles.tableContainer}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>CANDIDATO</th>
                            {view === 'PRESENCE' ? (
                                <>
                                    <th>STATUS</th>
                                    <th className={styles.alignRight}>AÇÃO</th>
                                </>
                            ) : (
                                <>
                                    {currentCriteria.map(c => <th key={c.key}>{c.label}</th>)}
                                    <th className={styles.alignRight}>CONTROLE</th>
                                </>
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        {candidates.map(c => (
                            <tr key={c.id}>
                                <td className={styles.nameCell}>
                                    <span className={styles.id}>#{c.id}</span> {c.name}
                                </td>

                                {view === 'PRESENCE' ? (
                                    <>
                                        <td><span className={`${styles.statusDot} ${styles[c.status.toLowerCase()]}`}>{c.status}</span></td>
                                        <td className={styles.alignRight}>
                                            <button className={styles.presentBtn}>Presença</button>
                                        </td>
                                    </>
                                ) : (
                                    <>
                                        {currentCriteria.map(criterion => (
                                            <td key={criterion.key}>
                                                <div className={styles.scoreInputWrapper}>
                                                    <input 
                                                        title='Nota'
                                                        type="number" 
                                                        max={criterion.max}
                                                        value={c.scores[criterion.key] || ''}
                                                        onChange={(e) => updateScore(c.id, criterion.key, Number(e.target.value))}
                                                    />
                                                    <span className={styles.maxLabel}>/ {criterion.max}</span>
                                                </div>
                                            </td>
                                        ))}
                                        <td className={styles.alignRight}>
                                            <button className={styles.saveBtn}>Salvar</button>
                                        </td>
                                    </>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </main>
    );
};

export default PsManagementPage;