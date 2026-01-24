'use client';

import { useManagementPs } from '@/hooks/useManagePs';
import { isEventWindowOpen } from '@/utils/dateUtils';
import styles from './management.module.scss';

const PsManagementPage = () => {
    const {
        view, setView,
        selectedCard, setSelectedCard,
        candidates, configs,
        handleScoreUpdate, handlePresenceToggle,
        handleSubmitChanges
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
                    <option value="none" disabled>Selecione um card</option>
                    {
                        configs.map((config) => (
                            <option key={config.card_id} value={config.card_id}>{config.title}</option>
                        ))
                    }
                </select>
            </section>

            <table className={styles.table}>
                <thead>
                    <tr>
                        <th>CANDIDATO</th>
                        {view === 'PRESENCE' ? (
                            <>
                                <th>STATUS</th>
                                {currentCardConfig?.type === 'PRESENCE_EVALUATION' && (
                                    <th className={styles.alignRight}>AÇÃO</th>
                                )}
                            </>
                        ) : (
                            <>
                                {currentCriteria.map(key => <th key={key}>{key.toUpperCase().split("_").join(" ")}</th>)}
                            </>
                        )}
                    </tr>
                </thead>
                <tbody>
                    {candidates.map(candidate => {
                        const progressArr = candidate.cards_progress as unknown as any[];
                        const prog = progressArr.find(p => p.card_id === selectedCard);
                        const isLocked = currentCardConfig ? !isEventWindowOpen(currentCardConfig) : false;
                        const card_config = configs.find(c => c.card_id === selectedCard);
                        const state_view = prog?.state === 'COMPLETED' ? card_config?.type === 'PRESENCE_EVALUATION' ? 'Presente' : 'Avaliado' : 'Pendente';

                        return (
                            <tr key={candidate.id}>
                                <td>{candidate.name}</td>

                                {view === 'PRESENCE' ? (
                                    <>
                                        <td>
                                            <span className={prog?.state === 'COMPLETED' ? styles.done : styles.pending}>
                                                {state_view}
                                            </span>
                                        </td>
                                        <td className={styles.alignRight}>
                                            {
                                                card_config?.type === 'PRESENCE_EVALUATION' && (
                                                    <button 
                                                        className={styles.saveBtn}
                                                        disabled={isLocked}
                                                        onClick={() => handlePresenceToggle(candidate.id, selectedCard)}
                                                    >
                                                        {isLocked ? "Indisponivel" : prog?.state === 'COMPLETED' ? 'Ausente' : 'Presença'}
                                                    </button>
                                                )
                                            }
                                        </td>
                                    </>
                                ) : (
                                    <>
                                        {currentCriteria.map(key => (
                                            <td key={key}>
                                                <input 
                                                    className={styles.scoreInput}
                                                    title='Nota'
                                                    type="number" 
                                                    disabled={(prog?.state !== 'COMPLETED' || isLocked)}
                                                    min={0}
                                                    max={5}
                                                    value={prog?.notes?.[key] || 0}
                                                    onChange={(e) => handleScoreUpdate(candidate.id, selectedCard, key, Number(e.target.value))}
                                                />
                                            </td>
                                        ))}
                                    </>
                                )}
                            </tr>
                        );
                    })}
                </tbody>
            </table>

            <button
                title={'Enviar Lista de Presença'}
                type='submit'
                className={styles.submitChanges}
                onClick={() => handleSubmitChanges()}
            >
                Salvar Alterações
            </button>
        </main>
    );
};

export default PsManagementPage;