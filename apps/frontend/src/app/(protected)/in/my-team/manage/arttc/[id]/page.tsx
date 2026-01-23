'use client';

import { useManageArttc } from "@/hooks/useMyTeam"; 
import styles from '@/app/(protected)/in/my-team/arttc.module.scss'; 

const ManageArttcPage = () => {
    const {
        router,
        arttc,
        loading,
        uploading,
        handleUploadReport,
        setFile,
        handleDownload
    } = useManageArttc();

    return (
        <main className={styles.container}>
            <header className={styles.header}>
                <button onClick={() => router.back()} className={styles.backBtn}>
                    <span>←</span> VOLTAR PARA A ART
                </button>
                <div className={styles.titleInfo}>
                    <span className={`${styles.typeBadge} ${arttc?.type === 'FINAL' ? styles.completed : ''}`}>
                        {arttc?.type === 'FINAL' ? 'META CONCLUÍDA' : 'META EM EXECUÇÃO'}
                    </span>
                    <h1>{arttc?.title || "CARREGANDO..."}</h1>
                    <p>ID da Meta: {arttc?.id}</p>
                </div>
            </header>

            <div className={styles.contentGrid}>
                {/* LADO ESQUERDO: Documentação e Fundamentação */}
                <section className={styles.detailsSection}>
                    <h3 className={styles.sectionTitle}>FUNDAMENTAÇÃO TÉCNICA</h3>
                    <div className={styles.card}>
                        <p>Baixe o arquivo de início desta meta para entender os requisitos.</p>
                        <button 
                            onClick={() => handleDownload(arttc?.file_id)}
                            className={styles.downloadBtn}
                            disabled={!arttc?.file_id}
                        >
                            {arttc?.file_id ? 'DOWNLOAD ARQUIVO DE INÍCIO' : 'SEM ARQUIVO INICIAL'}
                        </button>
                    </div>

                    {arttc?.report_file_id && (
                        <div className={`${styles.card} ${styles.successCard}`}>
                            <h4>RELATÓRIO FINAL ENTREGUE</h4>
                            <button 
                                onClick={() => handleDownload(arttc?.report_file_id)}
                                className={styles.downloadBtn}
                            >
                                VER RELATÓRIO ENVIADO
                            </button>
                        </div>
                    )}
                </section>

                {/* LADO DIREITO: Ação de Finalização */}
                <section className={styles.actionSection}>
                    <h3 className={styles.sectionTitle}>FINALIZAR META</h3>
                    <div className={styles.card}>
                        {arttc?.status === 'ACTIVE' ? (
                            <>
                                <p>Para concluir esta ARTTC, suba o relatório técnico final (PDF).</p>
                                <input 
                                    type="file" 
                                    title="Selecione o relatório em PDF"
                                    accept=".pdf"
                                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                                    className={styles.fileInput}
                                />
                                <button 
                                    onClick={handleUploadReport}
                                    className={styles.finishBtn}
                                    disabled={uploading}
                                >
                                    {uploading ? 'ENVIANDO...' : 'SUBIR RELATÓRIO E ENCERRAR'}
                                </button>
                            </>
                        ) : (
                            <div className={styles.lockedInfo}>
                                <p>🔒 Esta meta foi encerrada em:</p>
                                <strong>{new Date(arttc?.finish_at || '').toLocaleString('pt-BR')}</strong>
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </main>
    );
};

export default ManageArttcPage;