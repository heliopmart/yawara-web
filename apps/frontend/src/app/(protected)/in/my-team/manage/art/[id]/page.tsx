'use client';

import {useManageArt} from "@/hooks/useMyTeam"
import styles from '@/app/(protected)/in/my-team/art.module.scss'; 

interface Report {
    id: string;
    date: string;
    author: string;
    filename: string;
    type: 'PARTIAL' | 'FINAL';
}

const ManageArtPage = ({ params }: { params: { id: string } }) => {
    const {
        router,
        art,
        file,
        loading,
        
        setFile,
        handleDonwload,
        handleUploadReport
    } = useManageArt(params.id);

    return (
        <main className={styles.container}>
            <header className={styles.header}>
                <button onClick={() => router.back()} className={styles.backBtn}>
                    <span>←</span> VOLTAR
                </button>
                <div className={styles.titleInfo}>
                    <span className={styles.statusBadge}>ACTIVE SYSTEM</span>
                    <h1>Gerenciar: {!loading ? art?.title : "CARREGANDO..."}</h1>
                    <p>Acompanhamento de progresso e validação de documentação técnica.</p>
                </div>
            </header>

            <div className={styles.manageGrid}>
                <section className={styles.teamSection}>
                    <h3 className={styles.sectionTitle}>UPDATE DE PROGRESSO</h3>
                    <p className={styles.instructionText}>
                        Suba um novo relatório parcial ou a entrega final para revisão.
                    </p>
                    
                    <div className={styles.uploadSection}>
                        <label className={styles.dropzone}>
                            <input 
                                type="file" 
                                accept=".pdf" 
                                onChange={(e) => setFile(e.target.files?.[0] || null)} 
                            />
                            <span>{file ? `CARREGADO: ${file.name}` : 'SELECIONAR RELATÓRIO (.PDF)'}</span>
                        </label>
                    </div>

                    <div className={styles.actionButtons}>
                        <button className={styles.submitBtn} onClick={() => handleUploadReport('PARTIAL')}>ENVIAR RELATÓRIO</button>
                        <button className={styles.finalizeBtn} onClick={() => handleUploadReport('FINAL')}>FINALIZAR ART</button>
                    </div>
                </section>

                <section className={styles.teamSection}>
                    <h3 className={styles.sectionTitle}>LOG DE DOCUMENTAÇÃO</h3>
                    <div className={styles.timeline}>
                        {!loading && art?.arttc?.map((report) => (
                            <div key={report.id} className={styles.timelineItem}>
                                <div className={styles.timelinePoint} />
                                <div className={styles.reportInfo}>
                                    <div className={styles.reportMeta}>
                                        <span className={styles.reportDate}>{new Date(report.finish_at || '').toDateString()}</span>
                                        <span className={styles.reportAuthor}>Criado em: {new Date(report.created_at || '').toDateString()}</span>
                                    </div>
                                    <button onClick={() => handleDonwload(report.file_id)} className={styles.reportLink}>
                                       {report.code} <span>[DOWNLOAD]</span>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </main>
    );
};

export default ManageArtPage;