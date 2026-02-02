'use client';

import styles from './Transparency.module.scss';
import { useTransparency } from '@/hooks/useTransparency';
import {
    FaDownload, FaTools, FaRegFilePdf, FaWallet,
    FaCheckCircle, FaUserCheck, FaHistory
} from 'react-icons/fa';

const Transparency = () => {
    const { 
        nuclei, inventory, financial, ps_editions, loading, loadingDownload,
        downloadArtDoc, downloadArttcDoc, downloadArttcReport, downloadPsResult
    } = useTransparency();

    if (loading) return <div className={styles.loading}>Carregando Dashboard...</div>;

    return (
        <div className={styles.transparencyWrapper}>
            <header className={styles.hero}>
                <div className={styles.container}>
                    <h1>Portal de Transparência</h1>
                    <p>Governança técnica, financeira e operacional do Projeto Yawara em tempo real.</p>
                </div>
            </header>

            <div className={styles.container}>
                <section className={styles.section}>
                    <h2 className={styles.title}><FaWallet /> Gestão Financeira</h2>
                    <div className={styles.cashFlowGrid}>
                        <div className={styles.cardFinance}>
                            <span>Saldo em Conta</span>
                            <strong>R$ {financial?.balance.toLocaleString()}</strong>
                        </div>
                        <div className={styles.cardFinance}>
                            <span>Entradas (Editais/Patrocínios)</span>
                            <strong className={styles.green}>+ R$ {financial?.history.filter(item => item.type === 'INCOME').reduce((acc, item) => acc + item.amount, 0).toLocaleString()}</strong>
                        </div>
                        <div className={styles.cardFinance}>
                            <span>Saídas (Operacional)</span>
                            <strong className={styles.red}>- R$ {financial?.history.filter(item => item.type === 'EXPENSE').reduce((acc, item) => acc + item.amount, 0).toLocaleString()}</strong>
                        </div>
                    </div>
                    <button className={styles.btnDownload}><FaRegFilePdf /> Baixar Relatório Financeiro Bimestral</button>
                </section>

                <section className={styles.section}>
                    <h2 className={styles.title}><FaCheckCircle /> Governança por Núcleos</h2>

                    {nuclei.map(nucleus => (
                        <div key={nucleus.name} className={styles.nucleoGroup}>
                            <h3 className={styles.nucleoName}>{nucleus.name}</h3>

                            <div className={styles.artList}>
                                {nucleus.arts.map(art => (
                                    <div key={art.id} className={styles.artCard}>
                                        <div className={styles.artHeader}>
                                            <div className={styles.artMainInfo}>
                                                <h4>{art.id.slice(0, 8)} - {art.title}</h4>
                                                <span className={styles.badge}>{art.status}</span>
                                            </div>
                                            {
                                                !loadingDownload && ( 
                                                    <button title="Download do Documento ART" onClick={() => downloadArtDoc(art.file_id, art.title)} className={styles.btnMainFile}>
                                                        <FaDownload /> Documento ART
                                                    </button>
                                                )
                                            }
                                        </div>

                                        <div className={styles.arttcContainer}>
                                            {art.arttcs.map(arttc => (
                                                <div key={arttc.id} className={styles.arttcBox}>
                                                    <div className={styles.arttcInfo}>
                                                        <p><strong>Meta:</strong> {arttc.title}</p>
                                                        <p className={styles.resp}>Resp: {arttc.responsible}</p>
                                                    </div>

                                                    <div className={styles.arttcActions}>
                                                        {
                                                            !loadingDownload && (
                                                                <button title="Download Documento ARTTC" className={styles.btnMainFile} onClick={() => downloadArttcDoc(arttc.file_id, arttc.title)}>
                                                                    <FaDownload /> Arquivo ARTTC
                                                                </button>
                                                            )
                                                        }

                                                        {arttc.report && !loadingDownload ? (
                                                            <button onClick={() => downloadArttcReport(arttc.file_id, arttc.title)} className={styles.reportLink}>
                                                                <FaRegFilePdf /> Relatório de Execução
                                                            </button>
                                                        ) : (
                                                            <span className={styles.pendingReport}>Relatório Pendente</span>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </section>

                <section className={styles.section}>
                    <h2 className={styles.title}><FaTools /> Ativos e Manutenção</h2>
                    <div className={styles.tableResponsive}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Item</th>
                                    <th>Responsável Atual</th>
                                    <th>Status</th>
                                    <th>Última Manut.</th>
                                </tr>
                            </thead>
                            <tbody>
                                {inventory.map(item => (
                                    <tr key={item.id}>
                                        <td>{item.name}</td>
                                        <td>{item.assigned_to}</td>
                                        <td><span className={styles.dot}></span> {item.status}</td>
                                        <td>{item.last_used_at ? new Date(item.last_used_at).toLocaleDateString() : 'N/A'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Resultados PS */}
                <section className={`${styles.section} ${styles.psResultsSection}`}>
                    {
                        ps_editions && ps_editions.map(edition => (
                            <div className={styles.subsection}>
                                <h2 className={styles.title}><FaUserCheck /> Aprovados - {edition.name}</h2>
                                <div className={styles.approvedList}>
                                    <p>A lista oficial de candidatos selecionados para os núcleos do Yawara MotoStudent está disponível para consulta pública.</p>
                                    {
                                        !loadingDownload && (
                                            <button onClick={() => downloadPsResult(edition.name, edition.final_result_doc)} className={styles.btnDownload}><FaDownload /> Lista de Aprovados (.PDF)</button>
                                        )
                                    }
                                </div>
                            </div>
                        ))
                    }
                </section>
            </div>
        </div>
    );
};

export default Transparency;