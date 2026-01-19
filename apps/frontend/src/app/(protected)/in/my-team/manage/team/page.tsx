'use client';

import React, { useState, useEffect } from 'react';
import styles from './teamRoster.module.scss';

interface TeamMember {
    id: string;
    name: string;
    nucleus: string;
    scores: [number, number, number, number];
    warnings: number;
    role: 'ADMIN' | 'LEADER' | 'MEMBER';
}

const TeamRosterPage = () => {
    const [team, setTeam] = useState<TeamMember[]>([]);
    const [isSemesterEnd, setIsSemesterEnd] = useState(false);
    const userRole = 'LEADER';

    useEffect(() => {
        // Mock do time do seu núcleo
        const mockTeam: TeamMember[] = [
            { id: '1', name: 'Helio', nucleus: 'Eletrônica', scores: [0, 0, 0, 0], warnings: 0, role: 'LEADER' },
            { id: '2', name: 'Membro Alpha', nucleus: 'Eletrônica', scores: [8, 7, 9, 8], warnings: 1, role: 'MEMBER' },
            { id: '3', name: 'Membro Beta', nucleus: 'Mecânica', scores: [0, 0, 0, 0], warnings: 0, role: 'MEMBER' },
        ];
        setTeam(mockTeam);
    }, []);

    const handleScoreUpdate = (memberId: string, index: number, value: number) => {
        if (!isSemesterEnd) return; 
        setTeam(prev => prev.map(m => {
            if (m.id === memberId) {
                const newScores = [...m.scores] as [number, number, number, number];
                newScores[index] = value;
                return { ...m, scores: newScores };
            }
            return m;
        }));
    };

    return (
        <main className={styles.container}>
            <header className={styles.header}>
                <div className={styles.titleInfo}>
                    <span className={styles.badge}>RECURSOS HUMANOS / OPERAÇÕES</span>
                    <h1>Gestão de Ativos Humanos</h1>
                    <p>Atribuição de performance e controle disciplinar do núcleo.</p>
                </div>
                
                <div className={styles.semesterToggle}>
                    <label>FIM DE SEMESTRE:</label>
                    <button 
                        className={isSemesterEnd ? styles.active : ''} 
                        onClick={() => setIsSemesterEnd(!isSemesterEnd)}
                    >
                        {isSemesterEnd ? 'SISTEMA LIBERADO' : 'NOTAS TRAVADAS'}
                    </button>
                </div>
            </header>

            <div className={styles.tableWrapper}>
                <table className={styles.rosterTable}>
                    <thead>
                        <tr>
                            <th>INTEGRANTE</th>
                            <th>NÚCLEO</th>
                            <th>NOTAS DE PARTICIPAÇÃO (1-4)</th>
                            <th>STATUS DISCIPLINAR</th>
                            <th className={styles.alignRight}>AÇÕES DE COMANDO</th>
                        </tr>
                    </thead>
                    <tbody>
                        {team.map(member => (
                            <tr key={member.id}>
                                <td className={styles.memberName}>
                                    {member.name}
                                    {member.role === 'LEADER' && <span className={styles.leaderTag}>LDR</span>}
                                </td>
                                <td><span className={styles.nucleusTag}>{member.nucleus}</span></td>
                                <td>
                                    <div className={styles.scoreGrid}>
                                        {member.scores.map((score, i) => (
                                            <input 
                                                title='Nota'
                                                key={i}
                                                type="number" 
                                                value={score} 
                                                disabled={!isSemesterEnd}
                                                onChange={(e) => handleScoreUpdate(member.id, i, Number(e.target.value))}
                                                className={styles.scoreInput}
                                            />
                                        ))}
                                    </div>
                                </td>
                                <td>
                                    <span className={member.warnings > 0 ? styles.warningActive : styles.cleanRecord}>
                                        {member.warnings} ADVERTÊNCIAS
                                    </span>
                                </td>
                                <td className={styles.alignRight}>
                                    <div className={styles.actionGroup}>
                                        <button className={styles.warnBtn} title="Advertência">⚠</button>
                                        <button className={styles.banBtn} title="Banir Membro">🚫</button>
                                        {userRole === 'LEADER' && (
                                            <button className={styles.reallocateBtn} title="Realocar Núcleo">🔄</button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </main>
    );
};

export default TeamRosterPage;