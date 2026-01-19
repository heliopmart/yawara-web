'use client';

import React, { useState, useEffect } from 'react';
import styles from './teamRoster.module.scss';
import { useManagerTeam } from "@/hooks/useMyTeam"



const TeamRosterPage = () => {
    const {
        role,
        user,

        isLoading,
        isManager,
        isSemesterEnd,

        team,
        handleScoreUpdate,
        banUser,
        createNewWarnings
    } = useManagerTeam()

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
                            <th>NOTAS DE PARTICIPAÇÃO (1-4)</th>
                            <th>STATUS DISCIPLINAR</th>
                            <th className={styles.alignRight}>AÇÕES DE COMANDO</th>
                        </tr>
                    </thead>
                    <tbody>
                        {team.map(member => (
                            <tr key={member.id}>
                                <td className={styles.memberName}>
                                    {member.user.name}
                                    {member.role === 'LEADER' && <span className={styles.leaderTag}>LDR</span>}
                                </td>
                                <td>
                                    <div className={styles.scoreGrid}>
                                        <input
                                            title='Nota de Participação'
                                            key={'n_social_1'}
                                            type="number"
                                            value={member.n_social.participation}
                                            disabled={!isSemesterEnd}
                                            onChange={(e) => handleScoreUpdate(member.id, 'n_social', 'participation', Number(e.target.value))}
                                            className={styles.scoreInput}
                                        />
                                        <input
                                            title='Nota de Proatividade'
                                            key={'n_social_2'}
                                            type="number"
                                            value={member.n_social.proactivity}
                                            disabled={!isSemesterEnd}
                                            onChange={(e) => handleScoreUpdate(member.id, 'n_social', 'proactivity', Number(e.target.value))}
                                            className={styles.scoreInput}
                                        />
                                        <input
                                            title='Nota de Relatório Geral'
                                            key={'n_tech_1'}
                                            type="number"
                                            value={member.n_tech.reports}
                                            disabled={!isSemesterEnd}
                                            onChange={(e) => handleScoreUpdate(member.id, 'n_tech', 'reports', Number(e.target.value))}
                                            className={styles.scoreInput}
                                        />
                                        <input
                                            title='Nota de Entrega Geral'
                                            key={'n_tech_2'}
                                            type="number"
                                            value={member.n_tech.delivery}
                                            disabled={!isSemesterEnd}
                                            onChange={(e) => handleScoreUpdate(member.id, 'n_tech', 'delivery', Number(e.target.value))}
                                            className={styles.scoreInput}
                                        />
                                    </div>
                                </td>
                                <td>
                                    <span className={member.warnings > 0 ? styles.warningActive : styles.cleanRecord}>
                                        {member.warnings} ADVERTÊNCIAS
                                    </span>
                                </td>
                                <td className={styles.alignRight}>
                                    <div className={styles.actionGroup}>
                                        {isManager && (
                                            <>
                                                <button className={styles.warnBtn} onClick={() => createNewWarnings(member.id)} title="Advertência">⚠</button>
                                                <button className={styles.banBtn} onClick={() => banUser(member.id)} title="Banir Membro">🚫</button>
                                            </>
                                        )}
                                        {role === 'ADMIN' && (
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