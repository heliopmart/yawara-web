'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from '@/app/(protected)/in/my-team/art.module.scss';

interface Member {
    id: string;
    name: string;
    score: number;
}

const AddArtPage = () => {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState('');
    const [availableMembers, setAvailableMembers] = useState<Member[]>([]);
    const [allocatedMembers, setAllocatedMembers] = useState<Member[]>([]);
    const [file, setFile] = useState<File | null>(null);

    useEffect(() => {
        const mockData: Member[] = [
            { id: '1', name: 'Helio', score: 98 },
            { id: '2', name: 'Engenheiro de Hardware X', score: 85 },
            { id: '3', name: 'Cientista de Dados Y', score: 92 },
            { id: '4', name: 'Desenvolvedor Firmware Z', score: 78 },
        ];
        setAvailableMembers(mockData);
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
                    <h1>Nova Anotação Registrada de Trabalho (ART)</h1>
                </div>
            </header>

            <form className={styles.form} onSubmit={(e) => e.preventDefault()}>
                <div className={styles.fieldSection}>
                    <div className={styles.inputWrapper}>
                        <label>TÍTULO DO COMPONENTE</label>
                        <input type="text" placeholder="Ex: Módulo de Gerenciamento de Células (BMS)" />
                    </div>

                    <div className={styles.inputWrapper}>
                        <label>DESCRIÇÃO TÉCNICA E OBJETIVOS</label>
                        <textarea placeholder="Descreva os requisitos de hardware..." rows={4} />
                    </div>
                </div>

                <div className={styles.teamSection}>
                    <h3 className={styles.sectionTitle}>ALOCAÇÃO DE ENGENHARIA</h3>
                    
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
                            <p className={styles.listLabel}>DISPONÍVEIS NO NÚCLEO</p>
                            {filteredMembers.map(member => (
                                <div key={member.id} className={styles.memberCard}>
                                    <div className={styles.memberInfo}>
                                        <span className={styles.memberName}>{member.name}</span>
                                        <span className={styles.memberScore}>SCORE: {member.score}</span>
                                    </div>
                                    <button 
                                        type="button" 
                                        onClick={() => handleAddMember(member)}
                                        className={styles.addBtn}
                                    >
                                        + ADICIONAR
                                    </button>
                                </div>
                            ))}
                        </div>

                        <div className={styles.allocatedList}>
                            <p className={styles.listLabel}>MEMBROS SELECIONADOS</p>
                            {allocatedMembers.length === 0 && <span className={styles.emptyMsg}>Nenhum membro alocado</span>}
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
                    PUBLICAR REGISTRO TÉCNICO
                </button>
            </form>
        </main>
    );
};

export default AddArtPage;