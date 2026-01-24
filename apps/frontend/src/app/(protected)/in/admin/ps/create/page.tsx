'use client';

import { useCreatePs } from '@/hooks/useManagePs'
import styles from './psConfig.module.scss';

const CreatePsPage = () => {
    const {
        psName, setPsName,
        globalStart, setGlobalStart,
        globalEnd, setGlobalEnd,
        steps, addStep, updateStep, setSteps,
        handleSubmitPs,
        router
    } = useCreatePs()

    return (
        <main className={styles.container}>
            {/* Header com Metadados Globais */}
            <header className={styles.header}>
                <button onClick={() => router.back()} className={styles.backBtn}>← VOLTAR</button>
                <div className={styles.psGlobalInfo}>
                    <div className={styles.inputGroup}>
                        <label>NOME DA EDIÇÃO (PS)</label>
                        <input
                            type="text"
                            placeholder="Ex: Yawara 2026.1"
                            value={psName}
                            onChange={(e) => setPsName(e.target.value)}
                        />
                    </div>
                    <div className={styles.dateRow}>
                        <div className={styles.inputGroup}>
                            <label>INÍCIO GERAL</label>
                            <input title="Inicio da PS" type="date" value={globalStart} onChange={(e) => setGlobalStart(e.target.value)} />
                        </div>
                        <div className={styles.inputGroup}>
                            <label>TÉRMINO GERAL</label>
                            <input title="Término da PS" type="date" value={globalEnd} onChange={(e) => setGlobalEnd(e.target.value)} />
                        </div>
                    </div>
                </div>
            </header>

            <div className={styles.setupFlow}>
                {steps.map((step, index) => (
                    <div key={step.card_id} className={styles.stepRow}>
                        <div className={styles.stepHeader}>
                            <div className={styles.stepNumber}>0{index + 1}</div>
                            <select
                                value={step.type}
                                title='Tipo de Card'
                                onChange={(e) => updateStep(step.card_id, { type: e.target.value as any })}
                                className={styles.typeSelector}
                            >
                                <option value="PRESENCE_EVALUATION">AVALIAÇÃO PRESENCIAL</option>
                                <option value="DOCUMENT_SUBMISSION">SUBMISSÃO DE DOCUMENTO</option>
                            </select>
                        </div>

                        <div className={styles.mainFields}>
                            <div className={styles.inputGroup}>
                                <label>NOME DA ETAPA</label>
                                <input
                                    type="text"
                                    placeholder="Ex: A Forja"
                                    value={step.title}
                                    onChange={(e) => updateStep(step.card_id, { title: e.target.value })}
                                />
                            </div>

                            {/* CAMPOS DINÂMICOS: AVALIAÇÃO PRESENCIAL */}
                            {step.type === 'PRESENCE_EVALUATION' && (
                                <div className={styles.dynamicFields}>
                                    <div className={styles.inputGroup}>
                                        <label>DATA DO EVENTO</label>
                                        <input title='Data do Evento' type="date" onChange={(e) => updateStep(step.card_id, { event_date: e.target.value })} />
                                    </div>
                                    <div className={styles.inputGroup}>
                                        <label>LOCAL</label>
                                        <input type="text" placeholder="Ex: Bloco B, Lab 10" onChange={(e) => updateStep(step.card_id, { location: e.target.value })} />
                                    </div>
                                    <div className={styles.inputGroup}>
                                        <label>INÍCIO</label>
                                        <input title='Inicio' type="time" onChange={(e) => updateStep(step.card_id, { start_time: e.target.value })} />
                                    </div>
                                    <div className={styles.inputGroup}>
                                        <label>TÉRMINO</label>
                                        <input title='Término' type="time" onChange={(e) => updateStep(step.card_id, { end_time: e.target.value })} />
                                    </div>
                                </div>
                            )}

                            {/* CAMPOS DINÂMICOS: SUBMISSÃO DE DOCUMENTO */}
                            {step.type === 'DOCUMENT_SUBMISSION' && (
                                <div className={styles.dynamicFields}>
                                    <div className={styles.inputGroup}>
                                        <label>PRAZO LIMITE (DEADLINE)</label>
                                        <input type="datetime-local" title='Prazo Limite' onChange={(e) => updateStep(step.card_id, { deadline: e.target.value })} />
                                    </div>
                                </div>
                            )}
                        </div>

                        <button className={styles.removeStep} onClick={() => setSteps(steps.filter(s => s.card_id !== step.card_id))}>
                            ELIMINAR ETAPA
                        </button>
                    </div>
                ))}

                <button className={styles.addStepBtn} onClick={addStep}>
                    + ADICIONAR ETAPA AO FLUXO
                </button>
            </div>

            <footer className={styles.footer}>
                <button className={styles.submitBtn} onClick={() => handleSubmitPs()}>INICIALIZAR PROCESSO SELETIVO</button>
            </footer>
        </main>
    );
};

export default CreatePsPage;