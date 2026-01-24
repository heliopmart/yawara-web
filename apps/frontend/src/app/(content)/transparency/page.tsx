'use client';

import styles from './Transparency.module.scss';
import { useTransparency } from '@/hooks/useTransparency';
import {
    FaDownload, FaTools, FaRegFilePdf, FaWallet,
    FaCheckCircle, FaUserCheck, FaHistory
} from 'react-icons/fa';

const Transparency = () => {
    const { nucleos, inventario, financeiro, loading } = useTransparency();

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
                {/* Seção Financeira */}
                <section className={styles.section}>
                    <h2 className={styles.title}><FaWallet /> Gestão Financeira</h2>
                    <div className={styles.cashFlowGrid}>
                        <div className={styles.cardFinance}>
                            <span>Saldo em Conta</span>
                            <strong>R$ {financeiro.saldo.toLocaleString()}</strong>
                        </div>
                        <div className={styles.cardFinance}>
                            <span>Entradas (Editais/Patrocínios)</span>
                            <strong className={styles.green}>+ R$ {financeiro.historico.filter(item => item.tipo === 'Entrada').reduce((acc, item) => acc + item.valor, 0).toLocaleString()}</strong>
                        </div>
                        <div className={styles.cardFinance}>
                            <span>Saídas (Operacional)</span>
                            <strong className={styles.red}>- R$ {financeiro.historico.filter(item => item.tipo === 'Saída').reduce((acc, item) => acc + item.valor, 0).toLocaleString()}</strong>
                        </div>
                    </div>
                    <button className={styles.btnDownload}><FaRegFilePdf /> Baixar Relatório Financeiro Bimestral</button>
                </section>

                {/* Gestão por ARTs */}
                <section className={styles.section}>
                    <h2 className={styles.title}><FaCheckCircle /> Governança por Núcleos</h2>

                    {nucleos.map(nucleo => (
                        <div key={nucleo.nome} className={styles.nucleoGroup}>
                            <h3 className={styles.nucleoName}>{nucleo.nome}</h3>

                            <div className={styles.artList}>
                                {nucleo.arts.map(art => (
                                    <div key={art.id} className={styles.artCard}>
                                        {/* Cabeçalho da ART (O Arquivo Principal) */}
                                        <div className={styles.artHeader}>
                                            <div className={styles.artMainInfo}>
                                                <h4>{art.id} - {art.titulo}</h4>
                                                <span className={styles.badge}>{art.status}</span>
                                            </div>
                                            <a href={art.linkFile} className={styles.btnMainFile}>
                                                <FaDownload /> Documento ART
                                            </a>
                                        </div>

                                        {/* Listagem de ARTTCs (As Metas) */}
                                        <div className={styles.arttcContainer}>
                                            {art.arttcs.map(arttc => (
                                                <div key={arttc.id} className={styles.arttcBox}>
                                                    <div className={styles.arttcInfo}>
                                                        <p><strong>Meta:</strong> {arttc.meta}</p>
                                                        <p className={styles.resp}>Resp: {arttc.responsavel}</p>
                                                    </div>

                                                    <div className={styles.arttcActions}>
                                                        {/* Arquivo da Meta */}
                                                        <a href={arttc.linkFile} title="Download da Meta">
                                                            <FaDownload /> Arquivo ARTTC
                                                        </a>

                                                        {/* Report Final (se existir) */}
                                                        {arttc.report ? (
                                                            <a href={arttc.report.link} className={styles.reportLink}>
                                                                <FaRegFilePdf /> Report {arttc.report.dataEntrega && `(${arttc.report.dataEntrega})`}
                                                            </a>
                                                        ) : (
                                                            <span className={styles.pendingReport}>Report Pendente</span>
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

                {/* Inventário em Tempo Real */}
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
                                {inventario.map(item => (
                                    <tr key={item.id}>
                                        <td>{item.nome}</td>
                                        <td>{item.comQuem}</td>
                                        <td><span className={styles.dot}></span> {item.status}</td>
                                        <td>{item.ultimaManutencao}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Resultados PS */}
                <section className={styles.section}>
                    <h2 className={styles.title}><FaUserCheck /> Aprovados - Processo Seletivo 2024.2</h2>
                    <div className={styles.approvedList}>
                        <p>A lista oficial de candidatos selecionados para os núcleos de Engenharia, Gestão e Software está disponível para consulta pública.</p>
                        <button className={styles.btnDownload}><FaDownload /> Lista de Aprovados (.PDF)</button>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default Transparency;