'use client';

import React from 'react';
import { useEditionCreate } from '@/hooks/useEditionCreate';
import styles from './psConfig.module.scss';
import {FaTrash, FaPlus} from 'react-icons/fa'

export default function CreateProcessPage() {
    const {
        edition, cards, loading, message,
        handleEditionChange, addCard, removeCard, updateCard, handleSubmit
    } = useEditionCreate();

    return (
        <main className={styles.container}>
            <div className={styles.header}>
                <h1>Novo <span>Processo Seletivo</span></h1>
            </div>

            <form onSubmit={handleSubmit} className={styles.mainForm}>

                {/* --- DADOS DA EDIÇÃO --- */}
                <section className={styles.sectionEdition}>
                    <div className={styles.inputGroup}>
                        <label>Nome da Edição</label>
                        <input
                            type="text"
                            value={edition.name}
                            onChange={(e) => handleEditionChange('name', e.target.value)}
                            placeholder="Ex: Yawara 2025.1"
                            required
                        />
                    </div>
                    <div className={styles.inputGroup}>
                        <label>Início</label>
                        <input
                            aria-label='Início'
                            type="datetime-local"
                            value={edition.start_date}
                            onChange={(e) => handleEditionChange('start_date', e.target.value)}
                            required
                        />
                    </div>
                    <div className={styles.inputGroup}>
                        <label>Término</label>
                        <input
                            aria-label='Término'
                            type="datetime-local"
                            value={edition.finish_date}
                            onChange={(e) => handleEditionChange('finish_date', e.target.value)}
                            required
                        />
                    </div>
                </section>

                {/* --- CONFIGURAÇÃO DOS CARDS --- */}
                <section className={styles.cardsContainer}>
                    <h2>Configuração dos Cards</h2>

                    <div className={styles.cardsGrid}>
                        {cards.map((card, index) => (
                            <div key={index} className={styles.cardItem}>
                                <div className={styles.headerCard}>
                                    <h3>Card #{card.card_id}</h3>
                                    {cards.length > 1 && (
                                        <button type="button" onClick={() => removeCard(index)} className={styles.removeBtn} title="Remover Card">
                                            <FaTrash />
                                        </button>
                                    )}
                                </div>

                                <div className={styles.inputGroup}>
                                    <label>Local (OPCIONAL)</label>
                                    <input
                                        type="text"
                                        aria-label='Local'
                                        value={card.event_location}
                                        onChange={(e) => updateCard(index, 'event_location', e.target.value)}
                                        placeholder="Ex: Auditório"
                                    />
                                </div>

                                <div className={styles.inputGroup}>
                                    <label>Data do Evento (OPCIONAL)</label>
                                    <input
                                        type="date"
                                        aria-label='Data do Evento'
                                        value={card.event_date}
                                        onChange={(e) => updateCard(index, 'event_date', e.target.value)}
                                    />
                                </div>

                                <div className={styles.row}>
                                    <div className={styles.inputGroup}>
                                        <label>Início (OPCIONAL)</label>
                                        <input
                                            type="time"
                                            aria-label='Início'
                                            value={card.event_times[0]}
                                            onChange={(e) => updateCard(index, 'start_time', e.target.value)}
                                        />
                                    </div>
                                    <div className={styles.inputGroup}>
                                        <label>Fim (OPCIONAL)</label>
                                        <input
                                            type="time"
                                            aria-label='Fim'
                                            value={card.event_times[1]}
                                            onChange={(e) => updateCard(index, 'end_time', e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className={styles.inputGroup}>
                                    <label>Prazo Limite (Entrega) (OPCIONAL)</label>
                                    <input
                                        type="datetime-local"
                                        aria-label='Prazo Limite (Entrega)'
                                        value={card.limit_date}
                                        onChange={(e) => updateCard(index, 'limit_date', e.target.value)}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className={styles.actions}>
                        <button type="button" onClick={addCard} className={styles.btnAdd}>
                            <FaPlus /> Adicionar Card
                        </button>
                        <button type="submit" disabled={loading} className={styles.btnSubmit}>
                            {loading ? 'Criando...' : 'Salvar Processo Seletivo'}
                        </button>
                    </div>
                </section>

                {/* --- FEEDBACK --- */}
                {message && (
                    <div className={`${styles.feedback} ${styles[message.type]}`}>
                        {message.text}
                    </div>
                )}

            </form>
        </main>
    );
}