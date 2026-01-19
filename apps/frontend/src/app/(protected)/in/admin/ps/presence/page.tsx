'use client';

import React from 'react';
import { usePresenceList } from '@/hooks/usePresenceList';
import styles from './presence.module.scss';
import { FaSave, FaUserCheck, FaAsterisk } from 'react-icons/fa'; // Ícones sugeridos

export default function PresencePage() {
    const {
        displayList,
        availableCards,
        selectedCardId,
        setSelectedCardId,
        toggleLocalPresence,
        saveChanges,
        hasPendingChanges,
        loading,
        saving,
        error
    } = usePresenceList();

    const totalPresent = displayList.filter(p => p.is_present).length;
    const totalUnsaved = displayList.filter(p => p.is_dirty).length;

    if (loading) return (
        <div className={styles.loadingContainer}>
            <div className={styles.spinner}></div>
            <p>Carregando painel de presença...</p>
        </div>
    );

    if (error) return (
        <div className={styles.errorContainer}>
            <FaAsterisk size={48} color="#e74c3c" />
            <h2>Ops! Algo deu errado.</h2>
            <p>{error}</p>
            <button onClick={() => window.location.reload()}>Tentar Novamente</button>
        </div>
    );

    return (
        <main className={styles.container}>

            {/* HEADER FIXO OU DESTAQUE */}
            <header className={styles.header}>
                <div className={styles.topRow}>
                    <div className={styles.titleArea}>
                        <h1>Lista de <span>Presença</span></h1>
                        <p className={styles.subtitle}>Gerencie a entrada dos participantes nos eventos presenciais.</p>
                    </div>

                    {/* ESTATÍSTICAS RÁPIDAS */}
                    <div className={styles.statsCard}>
                        <div className={styles.statItem}>
                            <FaUserCheck size={20} />
                            <span>{totalPresent}</span> / {displayList.length}
                            <small>Presentes</small>
                        </div>
                    </div>
                </div>

                <div className={styles.controlsRow}>
                    {/* SELETOR DE CARD */}
                    <div className={styles.selectorWrapper}>
                        <label>Evento / Etapa:</label>
                        <select
                            aria-label="Selecione o card de presença"
                            value={selectedCardId || ''}
                            onChange={(e) => setSelectedCardId(Number(e.target.value))}
                            className={styles.cardSelector}
                            disabled={saving}
                        >
                            {availableCards.length === 0 && <option>Nenhum evento presencial encontrado</option>}
                            {availableCards.map(c => (
                                <option key={c.id} value={c.id}>{c.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* BOTÃO DE SALVAR */}
                    <button
                        onClick={saveChanges}
                        disabled={!hasPendingChanges || saving}
                        className={`${styles.saveButton} ${hasPendingChanges ? styles.active : ''}`}
                    >
                        {saving ? (
                            <span>Salvando...</span>
                        ) : (
                            <>
                                <FaSave size={18} />
                                Salvar Alterações
                                {totalUnsaved > 0 && <span className={styles.badge}>{totalUnsaved}</span>}
                            </>
                        )}
                    </button>
                </div>
            </header>

            {/* LISTAGEM */}
            <div className={styles.listContainer}>
                {availableCards.length === 0 ? (
                    <div className={styles.emptyState}>
                        Esta edição não possui cards configurados com local presencial.
                    </div>
                ) : (
                    <div className={styles.list}>
                        {displayList.map((participant) => (
                            <div
                                key={participant.id}
                                className={`
                        ${styles.item} 
                        ${participant.is_present ? styles.present : styles.absent}
                        ${participant.is_dirty ? styles.dirty : ''}
                    `}
                                onClick={() => toggleLocalPresence(participant.id, participant.is_present)} // Permite clicar na linha toda
                            >
                                <div className={styles.info}>
                                    <strong>{participant.name}</strong>
                                    {participant.is_dirty && (
                                        <span className={styles.unsavedTag}>• Não salvo</span>
                                    )}
                                </div>

                                <div className={styles.statusAction}>
                                    <button
                                        className={`${styles.actionButton} ${participant.is_present ? styles.btnPresent : styles.btnAbsent}`}
                                        // stopPropagation para não conflitar com o click da linha se quiser
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            toggleLocalPresence(participant.id, participant.is_present);
                                        }}
                                    >
                                        {participant.is_present ? 'Presente' : 'Ausente'}
                                    </button>
                                </div>
                            </div>
                        ))}

                        {displayList.length === 0 && (
                            <div className={styles.emptyList}>Nenhum participante elegível encontrado.</div>
                        )}
                    </div>
                )}
            </div>
        </main>
    );
}