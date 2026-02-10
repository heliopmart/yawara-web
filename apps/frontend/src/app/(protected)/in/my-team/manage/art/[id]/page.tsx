'use client';

import { useManageArt } from "@/hooks/useMyTeam";
import styles from '@/app/(protected)/in/my-team/art.module.scss';
import Link from "next/link";

const ManageArtPage = () => {
    const {
        router,
        art,
        loading,
        handleDownload
    } = useManageArt();

    const totalArttcs = art?.arttc?.length || 0;
    const completedArttcs = art?.arttc?.filter(a => a.status === 'INACTIVE').length || 0;

    return (
        <main className={styles.container}>
            <header className={styles.header}>
                <button onClick={() => router.back()} className={styles.backBtn}>
                    <span>←</span> VOLTAR
                </button>
                <div className={styles.titleInfo}>
                    <span className={styles.statusBadge}>{art?.status === 'ACTIVE' ? 'NÚCLEO ATIVO' : 'ARQUIVADO'}</span>
                    <h1>{!loading ? art?.title : "CARREGANDO..."}</h1>
                    <p>Central de Governança e Histórico de Metas Técnicas (ARTTCs).</p>
                </div>
            </header>

            <div className={styles.governanceGrid}>
                <section className={styles.historySection}>
                    <div className={styles.sectionHeader}>
                        <h3 className={styles.sectionTitle}>HISTÓRICO DE METAS TÉCNICAS (ARTTCs)</h3>
                        <div className={styles.stats}>
                            <span>{completedArttcs}/{totalArttcs} Metas Concluídas</span>
                        </div>
                    </div>

                    <div className={styles.arttcList}>
                        {!loading && art?.arttc?.map((arttc) => (
                            <div key={arttc.id} className={`${styles.arttcCard} ${arttc.status === 'INACTIVE' ? styles.finished : ''}`}>
                                <div className={styles.cardHeader}>
                                    <h4>{arttc.title}</h4>
                                    <span className={styles.typeBadge}>{arttc.type}</span>
                                </div>

                                <div className={styles.cardBody}>
                                    <p>Criada em: {new Date(arttc.created_at || '').toLocaleDateString('pt-BR')}</p>
                                    {arttc.finish_at && (
                                        <p>Finalizada em: {new Date(arttc.finish_at).toLocaleDateString('pt-BR')}</p>
                                    )}
                                </div>

                                <div className={styles.cardFooter}>
                                    <Link
                                        href={`/in/my-team/manage/arttc/${arttc.id}`}
                                        className={styles.manageBtn}
                                    >
                                        GERENCIAR ARTTC <span>→</span>
                                    </Link>

                                    {arttc.report_file_id && (
                                        <button onClick={() => handleDownload(arttc.report_file_id, `${arttc.title}-report`, 'ARTTC')} className={styles.downloadBtn}>
                                            BAIXAR REPORT
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                <aside className={styles.sidebarSection}>
                    <h3 className={styles.sectionTitle}>FUNDAÇÃO DA ART</h3>

                    <div className={styles.instructionCardMembers}>
                        <h4>Membros Alocados</h4>

                        <div className={styles.membersList}>
                            {
                                art?.members?.map((member) => (
                                    <div className={styles.member} key={member.team_id}>
                                        <span>{member.name} | <i>{member.role}</i></span>
                                    </div>
                                ))
                            }
                        </div>
                    </div>

                    <div className={styles.instructionCard}>
                        <h4>Resumo do Núcleo</h4>
                        <p>{art?.description || "Nenhuma descrição detalhada fornecida."}</p>
                    </div>

                    <div className={styles.foundationCard}>
                        <p>Documento original de planejamento do núcleo.</p>
                        {art?.file_id ? (
                            <button className={styles.download_art_file} onClick={() => handleDownload(art.file_id, `${art.title}-plano-inicial`, 'ART')}>
                                DOWNLOAD PLANO INICIAL
                            </button>
                        ) : (
                            <span className={styles.noFile}>Sem documento de fundação</span>
                        )}
                    </div>
                </aside>
            </div>
        </main>
    );
};

export default ManageArtPage;