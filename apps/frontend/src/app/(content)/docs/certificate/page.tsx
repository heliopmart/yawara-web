'use client';

import React, { Suspense } from 'react';
import { FaFilePdf, FaSearch, FaQrcode, FaCheckCircle, FaReadme } from 'react-icons/fa';
import styles from './Certificate.module.scss';
import { useCertificate } from '@/hooks/useCertificate';

function CertificateContent() {
    const {
        activeTab,
        inputValue,
        loading,
        result,
        error,
        mode,
        qrCodeRegionId,
        setMode,
        handleInputChange,
        handleSubmit,
        switchTab,
        handle_download_certificate
    } = useCertificate();

    return (
        <div className={styles.card}>
            {/* Abas */}
            <div className={styles.tabs}>
                <button
                    onClick={() => switchTab('validate')}
                    className={`${styles.tabButton} ${activeTab === 'validate' ? styles.active : ''}`}
                >
                    Validar Código
                </button>
                <button
                    onClick={() => switchTab('search')}
                    className={`${styles.tabButton} ${activeTab === 'search' ? styles.active : ''}`}
                >
                    Buscar por CPF
                </button>
            </div>

            {/* Conteúdo */}
            <div className={styles.content}>
                <div className={styles.header}>
                    <h2>
                        {activeTab === 'validate' ? 'Validação de Certificado' : 'Meus Certificados'}
                    </h2>
                    <p>
                        {activeTab === 'validate'
                            ? 'Digite o UUID impresso no certificado.'
                            : 'Informe seu CPF para listar suas certificações.'}
                    </p>
                </div>

                {mode === 'camera' && activeTab === 'validate' && (
                    <div className={styles.cameraWrapper}>
                        <div id={qrCodeRegionId} style={{ width: '100%' }}></div>

                        <button
                            className={styles.btnCancel}
                            onClick={() => setMode('input')}
                        >
                            Cancelar
                        </button>
                    </div>
                )}

                {mode === 'input' && (
                    <form onSubmit={handleSubmit} className={styles.form}>
                        <input
                            type="text"
                            placeholder={activeTab === 'validate' ? "Ex: 550e8400-e29b..." : "Ex: 000.000.000-00"}
                            value={inputValue}
                            onChange={handleInputChange}
                            className={styles.input}
                            required
                        />

                        <button type="submit" disabled={loading} className={styles.btnPrimary}>
                            {loading ? (
                                <span>Processando...</span>
                            ) : (
                                <>
                                    <FaSearch size={18} />
                                    {activeTab === 'validate' ? 'Verificar' : 'Buscar'}
                                </>
                            )}
                        </button>

                        {activeTab === 'validate' && (
                            <button type="button" className={styles.btnSecondary} onClick={() => setMode('camera')}>
                                <FaQrcode size={18} />
                                Escanear QR Code
                            </button>
                        )}
                    </form>
                )}

                {/* Resultados */}
                <div className={`${styles.resultBox} ${result ? styles.success : styles.error}`}>

                    {/* ERRO */}
                    {error && (
                        <div className={styles.errorMessage}>
                            <FaReadme size={20} />
                            <span>{error ?? "Ops! Não foi possivel encontrar esse certificado"}</span>
                        </div>
                    )}

                    {/* SUCESSO - VALIDAR CÓDIGO */}
                    {result && activeTab === 'validate' && !Array.isArray(result) && !error && (
                        <div className={styles.result}>
                            <span className={`${styles.statusBadge} ${styles.valid}`}>
                                <FaCheckCircle style={{ marginRight: 5 }} /> Certificado Válido
                            </span>

                            <h3>{result.student_name}</h3>
                            <p style={{ color: '#aaa', marginBottom: '1rem' }}>{result.course_name}</p>

                            <div className={styles.detailRow}>
                                <span>Data de Emissão:</span>
                                <span>{new Date(result.issue_date ?? '').toLocaleDateString()}</span>
                            </div>
                            <div className={styles.detailRow}>
                                <span>Carga Horária:</span>
                                <span>{result.hours}h</span>
                            </div>

                        </div>
                    )}

                    {/* SUCESSO - LISTA CPF */}
                    {result && activeTab === 'search' && Array.isArray(result) && !error && (
                        <div className={styles.certificateList}>
                            <h3>Certificados encontrados:</h3>
                            {result.map((cert) => (
                                <div key={cert.id} className={styles.certificateItem}>
                                    <div className={styles.certInfo}>
                                        <b>{cert.course_name}</b>
                                        <span>{new Date(cert.issue_date).toLocaleDateString()}</span>
                                    </div>
                                    <button className={styles.downloadBtn} onClick={() => handle_download_certificate(cert.id)} title="Baixar PDF">
                                        <FaFilePdf size={20} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function CertificatePage() {
    return (
        <div className={styles.pageContainer}>
            
            <Suspense fallback={<div style={{color: 'white', textAlign: 'center'}}>Carregando módulo de validação...</div>}>
                <CertificateContent />
            </Suspense>

            <p className={styles.legalFooter}>
                A verificação confirma a emissão pela Equipe Yawara.
                Não substitui validação acadêmica oficial.
            </p>
        </div>
    );
}