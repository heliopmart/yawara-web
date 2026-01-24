'use client';

import styles from '@/app/(protected)/in/my-team/art.module.scss';
import {useAddNote} from "@/hooks/useMyTeam";

interface Member {
    id: string;
    name: string;
    score: number;
}

const AddArtPage = () => {
   const {
        router,
        note,
        filtered,
        allocatedMembers,
        filterText,
        file,

        handleFilteredMembers,
        handleAllocateMember,
        handleExcludeAllocatedMembers,
        setNote,
        setFilterText,
        setFile,
        
        handleSubmit
    } = useAddNote('ART');

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

            <form className={styles.form} onSubmit={handleSubmit}>
                <div className={styles.fieldSection}>
                    <div className={styles.inputWrapper}>
                        <label>TÍTULO DO COMPONENTE</label>
                        <input type="text" onChange={(e) => setNote(prev => ({...prev, title: e.target.value}))} value={note?.title} placeholder="Ex: Módulo de Gerenciamento de Células (BMS)" />
                    </div>

                    <div className={styles.inputWrapper}>
                        <label>DESCRIÇÃO TÉCNICA E OBJETIVOS</label>
                        <textarea placeholder="Descreva os requisitos de hardware..." rows={4} value={note?.description} onChange={(e) => setNote(prev => ({...prev, description: e.target.value}))} />
                    </div>
                </div>

                <div className={styles.teamSection}>
                    <h3 className={styles.sectionTitle}>ALOCAÇÃO DE ENGENHARIA</h3>
                    
                    <div className={styles.searchBox}>
                        <input 
                            type="text" 
                            placeholder="Pesquisar membro por nome..." 
                            value={filterText}
                            onChange={(e) => setFilterText(e.target.value)}
                        />
                    </div>

                    <div className={styles.teamGrid}>
                        <div className={styles.memberList}>
                            <p className={styles.listLabel}>DISPONÍVEIS NO NÚCLEO</p>
                            {filtered?.length === 0 && <span className={styles.emptyMsg}>Nenhum membro disponivel</span>}

                            {filtered?.map(member => (
                                <div key={member.id} className={styles.memberCard}>
                                    <div className={styles.memberInfo}>
                                        <span className={styles.memberName}>{member.user.name}</span>
                                        <span className={styles.memberScore}>Advertências: {member.warnings}</span>
                                    </div>
                                    <button 
                                        type="button" 
                                        onClick={() => handleAllocateMember(member.id)}
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
                            {allocatedMembers?.map(member => (
                                <div key={member.id} className={styles.allocatedCard}>
                                    <span>{member.user.name}</span>
                                    <button onClick={() => handleExcludeAllocatedMembers(member.id)}>×</button>
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