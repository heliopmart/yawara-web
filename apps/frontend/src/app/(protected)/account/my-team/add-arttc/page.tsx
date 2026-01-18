'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from '@/app/(protected)/account/my-team/arttc.module.scss';

interface Member {
    id: string;
    name: string;
    score: number;
}

interface ArtReference {
    id: string;
    title: string;
}

const AddArttcPage = () => {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState('');
    const [availableMembers, setAvailableMembers] = useState<Member[]>([]);
    const [allocatedMembers, setAllocatedMembers] = useState<Member[]>([]);
    const [artReferences, setArtReferences] = useState<ArtReference[]>([]);
    const [selectedArtId, setSelectedArtId] = useState('');
    const [file, setFile] = useState<File | null>(null);

    useEffect(() => {
        // Mocks para Integrantes e ARTs de referência
        const membersMock: Member[] = [
            { id: '1', name: 'Helio', score: 98 },
            { id: '2', name: 'Dev Firmware A', score: 88 },
            { id: '3', name: 'Eng Software B', score: 91 },
        ];
        const artsMock: ArtReference[] = [
            { id: 'art_101', title: 'Inversor de Frequência V1' },
            { id: 'art_102', title: 'Módulo de Telemetria' },
        ];
        
        setAvailableMembers(membersMock);
        setArtReferences(artsMock);
    }, []);

    const handleAddMember = (member: Member) => {
        if (!allocatedMembers.find(m => m.id === member.id)) {
            setAllocatedMembers([...allocatedMembers, member]);
        }
    };

    const handleRemoveMember = (id: string) => {
        setAllocatedMembers(allocatedMembers.filter(m => m.id !== id));
    };

    const filteredMembers = availableMembers.filter(m =>
        m.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !allocatedMembers.find(am => am.id === m.id)
    );

    return (
        <main className={styles.container}>
            <header className={styles.header}>
                <button onClick={() => router.back()} className={styles.backBtn}>
                    <span>←</span> VOLTAR
                </button>
                <div className={styles.titleInfo}>
                    <span className={styles.typeBadge}>Ação Registrada de Trabalho Técnico-Cientifico</span>
                    <h1>Relatório Inicial (ARTTC)</h1>
                </div>
            </header>

            <form className={styles.form} onSubmit={(e) => e.preventDefault()}>
                <div className={styles.fieldSection}>
                    <div className={styles.inputWrapper}>
                        <label>NOME DA ARTTC</label>
                        <input type="text" placeholder="Ex: Algoritmo de Controle PID - Tração" />
                    </div>

                    <div className={styles.inputWrapper}>
                        <label>ART DE REFERÊNCIA </label>
                        <select 
                            value={selectedArtId} 
                            onChange={(e) => setSelectedArtId(e.target.value)}
                            title='Selecione a ART vinculada'
                            className={styles.selectInput}
                        >
                            <option value="">Selecione a ART vinculada</option>
                            {artReferences.map(art => (
                                <option key={art.id} value={art.id}>{art.title}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className={styles.teamSection}>
                    <h3 className={styles.sectionTitle}>EQUIPE DE DESENVOLVIMENTO</h3>
                    <div className={styles.searchBox}>
                        <input 
                            type="text" 
                            placeholder="Pesquisar membro por nome..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className={styles.teamGrid}>
                        <div className={styles.memberList}>
                            <p className={styles.listLabel}>DISPONÍVEIS</p>
                            {filteredMembers.map(member => (
                                <div key={member.id} className={styles.memberCard}>
                                    <div className={styles.memberInfo}>
                                        <span className={styles.memberName}>{member.name}</span>
                                        <span className={styles.memberScore}>SCORE: {member.score}</span>
                                    </div>
                                    <button type="button" onClick={() => handleAddMember(member)} className={styles.addBtn}>
                                        + ADD
                                    </button>
                                </div>
                            ))}
                        </div>

                        <div className={styles.allocatedList}>
                            <p className={styles.listLabel}>ALOCADOS NA ARTTC</p>
                            {allocatedMembers.map(member => (
                                <div key={member.id} className={styles.allocatedCard}>
                                    <span>{member.name}</span>
                                    <button onClick={() => handleRemoveMember(member.id)}>×</button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                 <div className={styles.uploadSection}>
                    <label className={styles.dropzone}>
                        <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                        <span>{file ? `PDF PRONTO: ${file.name}` : 'ANEXAR DOCUMENTO DE REFERÊNCIA (.PDF)'}</span>
                    </label>
                </div>

                <button type="submit" className={styles.submitBtn}>
                    REGISTRAR ARTTC NO SISTEMA
                </button>
            </form>
        </main>
    );
};

export default AddArttcPage;