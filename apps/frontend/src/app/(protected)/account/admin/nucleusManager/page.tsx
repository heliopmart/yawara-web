'use client';

import React from 'react';
import { useNucleusManagement } from '@/hooks/useNucleusManagement';
import styles from './NucleusManager.module.scss';
import { FaTrash, FaPlus, FaSave, FaServer } from 'react-icons/fa'; // Ícones sugeridos

export default function NucleusManagementPage() {
    const { 
        psData, 
        vacancies, 
        setVacancies, 
        subjects, 
        addSubject, 
        removeSubject, 
        updateSubject,
        handleSave,
        isLoading,
        isSaving
    } = useNucleusManagement();

    if (isLoading) {
        return <div className={styles.container}>Carregando dados do núcleo...</div>;
    }

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1>Gestão de Perfil do Núcleo</h1>
                <p className={styles.subtitle}>
                    {psData ? `Ciclo Ativo: ${psData.name}` : 'Nenhum ciclo seletivo ativo'}
                </p>
            </header>

            {/* CARD 1: Configuração de Vagas */}
            <section className={styles.section}>
                <h2><FaServer size={20}/> Capacidade & Demanda</h2>
                <div className={styles.formRow}>
                    <div className={styles.inputGroup}>
                        <label>Vagas Disponíveis (K)</label>
                        <input 
                            aria-label='Vagas Disponiveis'
                            type="number" 
                            value={vacancies}
                            onChange={(e) => setVacancies(Number(e.target.value))}
                            min={0}
                        />
                    </div>
                    <div className={styles.inputGroup}>
                        <label>Status do Ciclo</label>
                        <input type="text" value={psData?.id ? "ATIVO" : "INATIVO"} aria-label='Status' disabled />
                    </div>
                </div>
            </section>

            {/* CARD 2: Matriz de Pesos (Input da Rede Neural) */}
            <section className={styles.section}>
                <h2>Parâmetros de Atenção (Pesos)</h2>
                <p style={{marginBottom: '20px', fontSize: '0.9rem', color: '#666'}}>
                    Defina quais disciplinas são críticas para o seu núcleo neste ciclo. 
                    A IA usará estes pesos (1-5) para filtrar os candidatos.
                </p>

                <div className={styles.subjectsGrid}>
                    {subjects.filter(item => !item.isDeleted).map((item, index) => (
                        <div key={index} className={styles.subjectRow}>
                            {/* Nome da Matéria */}
                            <div className={styles.inputGroup}>
                                <input 
                                    type="text" 
                                    placeholder="Nome da Disciplina (ex: Termodinâmica)"
                                    value={item.subject_name}
                                    onChange={(e) => updateSubject(index, 'subject_name', e.target.value)}
                                />
                            </div>

                            {/* Peso */}
                            <div className={styles.inputGroup}>
                                <select 
                                    aria-label='Peso'
                                    className={styles.weightInput}
                                    value={item.weight}
                                    onChange={(e) => updateSubject(index, 'weight', Number(e.target.value))}
                                >
                                    <option value={1}>1 - Baixo</option>
                                    <option value={2}>2 - Médio</option>
                                    <option value={3}>3 - Relevante</option>
                                    <option value={4}>4 - Alto</option>
                                    <option value={5}>5 - Crítico</option>
                                </select>
                            </div>

                            {/* Botão Remover */}
                            <button 
                                onClick={() => removeSubject(index)} 
                                className={`${styles.btn} ${styles.danger}`}
                                title="Remover disciplina"
                            >
                                <FaTrash size={18} />
                            </button>
                        </div>
                    ))}

                    <button onClick={addSubject} className={styles.addButton}>
                        <FaPlus size={16} style={{marginRight: 5}}/> ADICIONAR DISCIPLINA
                    </button>
                </div>
            </section>

            <div className={styles.actions}>
                <button className={`${styles.btn} ${styles.secondary}`}>Cancelar</button>
                <button 
                    className={`${styles.btn} ${styles.primary}`} 
                    onClick={handleSave}
                    disabled={isSaving}
                >
                    {isSaving ? 'Salvando...' : <><FaSave size={16} style={{marginRight: 5}}/> Salvar Configuração</>}
                </button>
            </div>
        </div>
    );
}