'use client';

import React, { useState, useEffect } from 'react';
import styles from './nuclei.module.scss';

interface Nucleus {
    id: string;
    name: string;
    activeArts: { id: string; title: string }[];
    memberCount: number;
    progress: number;
}

const NucleiPage = () => {
    const [nuclei, setNuclei] = useState<Nucleus[]>([]);

    useEffect(() => {
        const mockData: Nucleus[] = [
            { 
                id: 'n1', 
                name: 'Eletrônica e Sistemas', 
                memberCount: 8, 
                progress: 75,
                activeArts: [
                    { id: 'art1', title: 'BMS Central V2' },
                    { id: 'art2', title: 'Telemetria em Tempo Real' }
                ] 
            },
            { 
                id: 'n2', 
                name: 'Propulsão a Hidrogênio', 
                memberCount: 5, 
                progress: 40,
                activeArts: [
                    { id: 'art3', title: 'Célula de Combustível H2' }
                ] 
            }
        ];
        setNuclei(mockData);
    }, []);

    return (
        <main className={styles.container}>
            <header className={styles.header}>
                <div className={styles.titleWrapper}>
                    <span className={styles.breadcrumb}>YAWARA / OPERAÇÕES</span>
                    <h1>Ecossistema de Núcleos</h1>
                </div>
            </header>

            <div className={styles.nucleiGrid}>
                {nuclei.map((n) => (
                    <section key={n.id} className={styles.nucleusCard}>
                        <div className={styles.cardHeader}>
                            <h2>{n.name}</h2>
                            <div className={styles.stats}>
                                <span>{n.memberCount} MEMBROS</span>
                                <span className={styles.progressText}>{n.progress}% SCAN</span>
                            </div>
                        </div>

                        <div className={styles.progressBar}>
                            <div className={styles.fill} style={{ width: `${n.progress}%` }} />
                        </div>

                        <div className={styles.artsSection}>
                            <h3>ARTs EM EXECUÇÃO</h3>
                            {n.activeArts.length > 0 ? (
                                <ul className={styles.artsList}>
                                    {n.activeArts.map(art => (
                                        <li key={art.id}>
                                            <span className={styles.artId}>[{art.id.toUpperCase()}]</span>
                                            {art.title}
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className={styles.emptyMsg}>Nenhuma ART ativa no ciclo atual.</p>
                            )}
                        </div>
                    </section>
                ))}
            </div>
        </main>
    );
};

export default NucleiPage;