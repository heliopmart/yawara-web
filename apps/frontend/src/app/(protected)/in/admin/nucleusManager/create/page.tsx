'use client';

import React from 'react';
import { useCreateNucleus } from '@/hooks/useNucleusManagement';
import styles from './createNuclei.module.scss';
import { FaUserTie, FaSearch, FaSave, FaArrowLeft, FaIdCard } from 'react-icons/fa';
import { useRouter } from 'next/navigation';

export default function CreateNucleusPage() {
    const router = useRouter();
    const {
        name, setName,
        searchTerm, setSearchTerm,
        selectedLeaderId, setSelectedLeaderId,
        filteredMembers,
        handleCreate,
        isLoading,
        isSaving
    } = useCreateNucleus();

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <button onClick={() => router.back()} className={styles.backBtn}>
                    <FaArrowLeft /> VOLTAR
                </button>
                <h1>CRIAR NOVO NÚCLEO</h1>
            </header>

            <section className={styles.section}>
                <div className={styles.inputGroup}>
                    <label><FaIdCard /> NOME DO NÚCLEO</label>
                    <input 
                        type="text" 
                        placeholder="Ex: NÚCLEO DE HIDROGÉNIO" 
                        value={name}
                        onChange={(e) => setName(e.target.value.toUpperCase())}
                    />
                </div>
            </section>

            <section className={styles.section}>
                <h2><FaUserTie /> Candidatos a Líder</h2>
                
                <div className={styles.searchBar}>
                    <FaSearch className={styles.searchIcon} />
                    <input 
                        type="text" 
                        placeholder="Filtrar por nome ou email..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className={styles.tableContainer}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>NOME</th>
                                <th>SCORE</th>
                                <th>AÇÃO</th>
                            </tr>
                        </thead>
                        <tbody>
                            {!isLoading && filteredMembers?.map(member => (
                                <tr key={member.id} className={selectedLeaderId === member.id ? styles.selectedRow : ''}>
                                    <td>{member.name}</td>
                                    <td>{member.score}</td>
                                    <td>
                                        <button 
                                            className={`${styles.selectBtn} ${selectedLeaderId === member.id ? styles.active : ''}`}
                                            onClick={() => setSelectedLeaderId(member.id)}
                                        >
                                            {selectedLeaderId === member.id ? 'SELECIONADO' : 'DEFINIR LÍDER'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            <footer className={styles.actions}>
                <button 
                    className={styles.primaryBtn} 
                    onClick={handleCreate}
                    disabled={isSaving || !name || !selectedLeaderId}
                >
                    {isSaving ? 'A PROCESSAR...' : <><FaSave /> CRIAR NÚCLEO</>}
                </button>
            </footer>
        </div>
    );
}