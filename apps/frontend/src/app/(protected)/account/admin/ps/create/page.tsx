'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './psConfig.module.scss';

interface StepConfig {
    id: number;
    title: string;
    type: 'DOCUMENT_SUBMISSION' | 'PRESENCE_EVALUATION';
    // Campos para PRESENÇA
    startTime?: string;
    endTime?: string;
    location?: string;
    eventDate?: string;
    // Campos para DOCUMENTO
    deadline?: string;
}

const CreatePsPage = () => {
    const router = useRouter();
    const [psName, setPsName] = useState('');
    const [globalStart, setGlobalStart] = useState('');
    const [globalEnd, setGlobalEnd] = useState('');
    const [steps, setSteps] = useState<StepConfig[]>([]);

    const addStep = () => {
        const newId = Date.now();
        setSteps([...steps, { 
            id: newId, 
            title: '', 
            type: 'PRESENCE_EVALUATION' 
        }]);
    };

    const updateStep = (id: number, fields: Partial<StepConfig>) => {
        setSteps(steps.map(s => s.id === id ? { ...s, ...fields } : s));
    };

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
                    <div key={step.id} className={styles.stepRow}>
                        <div className={styles.stepHeader}>
                            <div className={styles.stepNumber}>0{index + 1}</div>
                            <select 
                                value={step.type}
                                title='Tipo de Card'
                                onChange={(e) => updateStep(step.id, { type: e.target.value as any })}
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
                                    onChange={(e) => updateStep(step.id, { title: e.target.value })}
                                />
                            </div>

                            {/* CAMPOS DINÂMICOS: AVALIAÇÃO PRESENCIAL */}
                            {step.type === 'PRESENCE_EVALUATION' && (
                                <div className={styles.dynamicFields}>
                                    <div className={styles.inputGroup}>
                                        <label>DATA DO EVENTO</label>
                                        <input title='Data do Evento' type="date" onChange={(e) => updateStep(step.id, { eventDate: e.target.value })} />
                                    </div>
                                    <div className={styles.inputGroup}>
                                        <label>LOCAL</label>
                                        <input type="text" placeholder="Ex: Bloco B, Lab 10" onChange={(e) => updateStep(step.id, { location: e.target.value })} />
                                    </div>
                                    <div className={styles.inputGroup}>
                                        <label>INÍCIO</label>
                                        <input title='Inicio' type="time" onChange={(e) => updateStep(step.id, { startTime: e.target.value })} />
                                    </div>
                                    <div className={styles.inputGroup}>
                                        <label>TÉRMINO</label>
                                        <input title='Término' type="time" onChange={(e) => updateStep(step.id, { endTime: e.target.value })} />
                                    </div>
                                </div>
                            )}

                            {/* CAMPOS DINÂMICOS: SUBMISSÃO DE DOCUMENTO */}
                            {step.type === 'DOCUMENT_SUBMISSION' && (
                                <div className={styles.dynamicFields}>
                                    <div className={styles.inputGroup}>
                                        <label>PRAZO LIMITE (DEADLINE)</label>
                                        <input type="datetime-local" title='Prazo Limite' onChange={(e) => updateStep(step.id, { deadline: e.target.value })} />
                                    </div>
                                </div>
                            )}
                        </div>
                        
                        <button className={styles.removeStep} onClick={() => setSteps(steps.filter(s => s.id !== step.id))}>
                            ELIMINAR ETAPA
                        </button>
                    </div>
                ))}

                <button className={styles.addStepBtn} onClick={addStep}>
                    + ADICIONAR ETAPA AO FLUXO
                </button>
            </div>

            <footer className={styles.footer}>
                <button className={styles.submitBtn}>INICIALIZAR PROCESSO SELETIVO</button>
            </footer>
        </main>
    );
};

export default CreatePsPage;