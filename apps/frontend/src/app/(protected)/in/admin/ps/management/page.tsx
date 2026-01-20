'use client';

import { useManagementPs } from '@/hooks/usePresenceList';
import { isEventWindowOpen } from '@/utils/dateUtils';
import styles from './management.module.scss';

export const PsManagementPage = () => {
    const {
        view, setView,
        selectedCard, setSelectedCard,
        candidates, configs,
        handleScoreUpdate, handlePresenceToggle
    } = useManagementPs();

    const templateProgress = candidates[0]?.cards_progress as unknown as any[];
    const cardTemplate = templateProgress?.find(p => p.card_id === selectedCard);
    const currentCriteria = (cardTemplate && 'notes' in cardTemplate) 
        ? Object.keys(cardTemplate.notes) 
        : [];

    const currentCardConfig = configs.find(c => c.card_id === selectedCard);

    return (
        <main className={styles.container}>
            <header className={styles.header}>
                <h1>Gestão de Processo Seletivo</h1>
                <nav className={styles.viewToggle}>
                    <button className={view === 'PRESENCE' ? styles.active : ''} onClick={() => setView('PRESENCE')}>PRESENÇA</button>
                    <button className={view === 'SCORES' ? styles.active : ''} onClick={() => setView('SCORES')}>NOTAS</button>
                </nav>
            </header>

            <section className={styles.filterBar}>
                <select value={selectedCard} onChange={(e) => setSelectedCard(Number(e.target.value))} title='Cards'>

                    <option value={2}>CARD 02 - DINÂMICA</option>
                    <option value={3}>CARD 03 - ENTREVISTA</option>
                </select>
            </section>

            <table className={styles.table}>
                <thead>
                    <tr>
                        <th>CANDIDATO</th>
                        {view === 'PRESENCE' ? (
                            <><th>STATUS</th><th className={styles.alignRight}>AÇÃO</th></>
                        ) : (
                            <>
                                {currentCriteria.map(key => <th key={key}>{key.toUpperCase()}</th>)}
                                <th className={styles.alignRight}>AÇÃO</th>
                            </>
                        )}
                    </tr>
                </thead>
                <tbody>
                    {candidates.map(candidate => {
                        const progressArr = candidate.cards_progress as unknown as any[];
                        const prog = progressArr.find(p => p.card_id === selectedCard);
                        const isLocked = currentCardConfig ? !isEventWindowOpen(currentCardConfig) : false;

                        return (
                            <tr key={candidate.id}>
                                <td>{candidate.id.split('-')[0]}...</td>

                                {view === 'PRESENCE' ? (
                                    <>
                                        <td>
                                            <span className={prog?.state === 'COMPLETED' ? styles.done : styles.pending}>
                                                {prog?.state}
                                            </span>
                                        </td>
                                        <td className={styles.alignRight}>
                                            <button 
                                                disabled={isLocked}
                                                onClick={() => handlePresenceToggle(candidate.id, selectedCard)}
                                            >
                                                {prog?.state === 'COMPLETED' ? 'Remover' : 'Confirmar'}
                                            </button>
                                        </td>
                                    </>
                                ) : (
                                    <>
                                        {currentCriteria.map(key => (
                                            <td key={key}>
                                                <input 
                                                    title='Nota'
                                                    type="number" 
                                                    value={prog?.notes?.[key] || 0}
                                                    onChange={(e) => handleScoreUpdate(candidate.id, selectedCard, key, Number(e.target.value))}
                                                />
                                            </td>
                                        ))}
                                        <td className={styles.alignRight}>
                                            <button className={styles.saveBtn}>Salvar</button>
                                        </td>
                                    </>
                                )}
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </main>
    );
};