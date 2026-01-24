'use client';

import { useAddNote } from "@/hooks/useMyTeam";
import styles from '@/app/(protected)/in/my-team/arttc.module.scss';

const AddArttcPage = () => {
    const {
        router,
        note,
        filtered,
        allocatedMembers,
        filterText,
        file,
        arts,


        handleAllocateMember,
        handleExcludeAllocatedMembers,
        setFilterText,
        setFile,
        setNote,
        handleSubmit,
        handleArtChange
    } = useAddNote('ARTTC');

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

            <form className={styles.form} onSubmit={handleSubmit}>
                <div className={styles.fieldSection}>
                    <div className={styles.inputWrapper}>
                        <label>NOME DA ARTTC</label>
                        <input type="text" onChange={(e) => setNote(prev => ({...prev, title: e.target.value}))} value={note?.title} placeholder="Ex: Módulo de Gerenciamento de Células (BMS)" />
                    </div>

                    <div className={styles.inputWrapper}>
                        <label>DESCRIÇÃO TÉCNICA E OBJETIVOS</label>
                        <textarea placeholder="Descreva os requisitos de hardware..." rows={4} value={note?.description} onChange={(e) => setNote(prev => ({ ...prev, description: e.target.value }))} />
                    </div>

                    <div className={styles.inputWrapper}>
                        <label>ART DE REFERÊNCIA </label>
                        <select
                            value={note?.type === 'ARTTC' ? note.art : ''}
                            onChange={handleArtChange}
                            title='Selecione a ART vinculada'
                            className={styles.selectInput}
                        >
                            <option value="">Selecione a ART vinculada</option>
                            {arts.map(art => (
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
                            value={filterText}
                            onChange={(e) => setFilterText(e.target.value)}
                        />
                    </div>

                    <div className={styles.teamGrid}>
                        <div className={styles.memberList}>
                            <p className={styles.listLabel}>DISPONÍVEIS</p>
                            {filtered?.map(member => (
                                <div key={member.id} className={styles.memberCard}>
                                    <div className={styles.memberInfo}>
                                        <span className={styles.memberName}>{member.user.name}</span>
                                        <span className={styles.memberScore}>Advertência: {member.warnings}</span>
                                    </div>
                                    <button type="button" onClick={() => handleAllocateMember(member.id)} className={styles.addBtn}>
                                        + ADD
                                    </button>
                                </div>
                            ))}
                        </div>

                        <div className={styles.allocatedList}>
                            <p className={styles.listLabel}>ALOCADOS NA ARTTC</p>
                            {allocatedMembers.map(member => (
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
                    REGISTRAR ARTTC NO SISTEMA
                </button>
            </form>
        </main>
    );
};

export default AddArttcPage;