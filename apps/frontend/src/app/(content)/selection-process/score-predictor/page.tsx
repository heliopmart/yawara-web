'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import styles from './predictor.module.scss';

const SnaPredictor = () => {
    const [file, setFile] = useState<File | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [progress, setProgress] = useState(0);

    const handleStartAnalysis = () => {
        setIsAnalyzing(true);
        // Simulação de animação de "pensamento" da rede
        let p = 0;
        const interval = setInterval(() => {
            p += Math.random() * 15;
            if (p >= 100) {
                p = 100;
                clearInterval(interval);
                setTimeout(() => setIsAnalyzing(false), 500);
            }
            setProgress(Math.floor(p));
        }, 300);
    };

    return (
        <div className={styles.pageWrapper}>
            {/* SESSÃO 1: HEADER E CHAMADA PRINCIPAL */}
            <header className={styles.header}>
                <div className={styles.container}>
                    <span className={styles.overline}>YAWARA SYSTEM NEURAL ARCHITECTURE</span>
                    <h1 className={styles.mainTitle}>Y-SNA: O Coração Neural do Processo Seletivo do <i> Yawara </i>.</h1>
                    <p className={styles.heroDescription}>
                        Uma arquitetura híbrida de inteligência artificial projetada para converter trajetórias
                        acadêmicas em vetores de competência técnica para o ecossistema MotoStudent.
                    </p>
                </div>
            </header>

            {/* SESSÃO 2: O QUE É E PARA QUE SERVE */}
            <section className={styles.whiteSection}>
                <div className={styles.container}>
                    <div className={styles.featureGrid}>
                        <div className={styles.featureText}>
                            <h2 className={styles.sectionHeading}>O "Portão de Ferro"</h2>
                            <p>
                                A Y-SNA não é apenas um software de triagem; é um <strong>Agente Externo de Validação</strong>.
                                Sua função crítica é estabelecer uma barreira técnica objetiva que blinda o recrutamento
                                contra vieses cognitivos e favoritismos.
                            </p>
                            <p>
                                Ao normalizar notas de diferentes instituições através de tensores, garantimos que a
                                elegibilidade seja fundamentada em métricas auditáveis e isonomia matemática absoluta.
                            </p>
                        </div>
                        <div className={styles.featureGraphic}>
                            <div className={styles.neuralNode}>
                                <div className={styles.pulseCore} />
                                <div className={styles.ring} />
                                <div className={styles.ring} />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* SESSÃO 3: FLUXO DE TRABALHO (PIPELINE) */}
            <section className={styles.graySection}>
                <div className={styles.container}>
                    <h2 className={styles.centeredHeading}>O Fluxo de Processamento Neural</h2>
                    <div className={styles.pipelineSteps}>
                        {[
                            { step: '01', title: 'Upload', desc: 'Ingestão de PDF Raw e extração via OCR.' },
                            { step: '02', title: 'Canonical', desc: 'Normalização via NLP (BERT/spaCy) e Fallback Gemini.' },
                            { step: '03', title: 'Engine', desc: 'Cálculo de Escore de Competência (EART) via TensorFlow.' },
                            { step: '04', title: 'XAI', desc: 'Extração de gradientes para explicação da decisão.' },
                            { step: '05', title: 'Report', desc: 'Geração de Telemetria e Diagnóstico de Gaps.' }
                        ].map((item, idx) => (
                            <div key={idx} className={styles.pipelineCard}>
                                <span className={styles.stepNum}>{item.step}</span>
                                <h4>{item.title}</h4>
                                <p>{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* SESSÃO 4: ENGINE 1 VS ENGINE 2 */}
            <section className={styles.whiteSection}>
                <div className={styles.container}>
                    <h2 className={styles.centeredHeading}>A Evolução da Inteligência</h2>

                    <div className={styles.comparisonWrapper}>
                        <div className={styles.compText}>
                            <p className={styles.introParagraph}>
                                O Y-SNA adota uma <strong>Arquitetura Híbrida Evolutiva</strong> projetada para transcender a estaticidade dos algoritmos de seleção tradicionais. Esta abordagem soluciona o problema de <em>Cold Start</em> (ausência inicial de dados históricos rotulados), permitindo que o sistema seja funcional desde o primeiro ciclo de admissão.
                            </p>

                            <div className={styles.engineExplainer}>
                                <div className={styles.engineBox}>
                                    <h4>Engine 1 (Fase V1): O Rigor Heurístico</h4>
                                    <p>
                                        Na fase atual, a rede opera em modo determinístico sobre uma infraestrutura de tensores. A topologia de <strong>Perceptron de Camada Única (SLP)</strong> utiliza pesos sinápticos "congelados", configurados manualmente para replicar a fórmula exata de escore técnico (EART). Isso garante que cada decisão seja uma tradução direta do peso de importância definido pelos líderes dos núcleos, comportando-se como um algoritmo exato de soma ponderada auditável.
                                    </p>
                                </div>

                                <div className={styles.engineBox}>
                                    <h4>Engine 2 (Fase V2): O Aprendizado Profundo</h4>
                                    <p>
                                        Conforme o projeto acumula métricas de desempenho real (Ground Truth) dos membros na oficina, a arquitetura expande-se para um <strong>Multilayer Perceptron (MLP)</strong>. Através de rotinas autônomas de <em>Fine-Tuning</em> e <em>Transfer Learning</em>, a Engine passa a detectar padrões não-lineares de sucesso que escapam à lógica manual, aprendendo a distinguir sutilmente entre um candidato apenas aprovado e um talento excepcional.
                                    </p>
                                </div>
                            </div>

                            <div className={styles.xaiHighlight}>
                                <h4>XAI: A "Caixa de Vidro" do Recrutamento</h4>
                                <p>
                                    A opacidade tradicional das redes neurais é convertida em transparência através da <strong>Explainable AI (XAI)</strong>. O sistema processa os gradientes de ativação para decompor a influência de cada variável no resultado final. Isso transforma a análise em um roteiro pedagógico: o candidato recebe uma devolutiva fundamentada que aponta exatamente quais competências técnicas precisam ser desenvolvidas para futuros ciclos.
                                </p>
                            </div>
                        </div>

                        {/* Tabela Comparativa (Mantida conforme sua preferência) */}
                        <div className={styles.tableScroll}>
                            <table className={styles.comparisonTable}>
                                <thead>
                                    <tr>
                                        <th>Recurso</th>
                                        <th>Engine 1 (V1)</th>
                                        <th>Engine 2 (V2)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>Topologia</td>
                                        <td>Single Layer Perceptron (SLP)</td>
                                        <td>Multilayer Perceptron (MLP)</td>
                                    </tr>
                                    <tr>
                                        <td>Aprendizado</td>
                                        <td>Pesos Heurísticos Injetados </td>
                                        <td>Transfer Learning & Fine-Tuning </td>
                                    </tr>
                                    <tr>
                                        <td>Lógica</td>
                                        <td>Linear (Soma Ponderada)</td>
                                        <td>Não-Linear (ReLU / Camadas Ocultas) </td>
                                    </tr>
                                    <tr>
                                        <td>Status</td>
                                        <td><span className={styles.activeTag}>Ativo</span></td>
                                        <td><span className={styles.devTag}>Em Treinamento</span></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </section>

            {/* SESSÃO 5: TESTE A Y-SNA */}
            <section className={styles.testSection}>
                <div className={styles.container}>
                    <div className={styles.testCard}>
                        <div className={styles.testHeader}>
                            <h2>Diagnóstico Instantâneo</h2>
                            <p>Versão Ref.: Ciclo Admissão 2026/1 (Engine v1.2)</p>
                        </div>

                        <div className={styles.testExplainer}>
                            <p>O relatório gerado apresentará sua <strong>Telemetria Completa</strong>: um radar de gaps comparando seu desempenho com a Baseline do núcleo escolhido. Seus dados são anonimizados via protocolos RLS conforme a LGPD.</p>
                        </div>

                        {isAnalyzing ? (
                            <div className={styles.thinkingState}>
                                <div className={styles.progressBar}>
                                    <div className={styles.progressFill} style={{ width: `${progress}%` }} />
                                </div>
                                <p>SNA Engine: {progress}% - Calculando Tensores de Competência...</p>
                            </div>
                        ) : (
                            <div className={styles.uploadArea}>
                                <label className={styles.customUpload}>
                                    <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} hidden />
                                    <span>{file ? file.name : 'Selecionar Histórico Escolar (.pdf)'}</span>
                                </label>
                                <button className={styles.actionBtn} disabled={!file} onClick={handleStartAnalysis}>
                                    EXECUTAR ANÁLISE NEURAL
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* SESSÃO 6: RECURSOS ADICIONAIS */}
            <section className={styles.graySection}>
                <div className={styles.container}>
                    <div className={styles.resourcesHeader}>
                        <h2 className={styles.centeredHeading}>Recursos de Engenharia</h2>
                        <p className={styles.centeredSub}>
                            Acesse a base de conhecimento completa sobre a YAWARA SYSTEM NEURAL ARCHITECTURE e audite nossos protocolos de transparência algorítmica.
                        </p>
                    </div>

                    <div className={styles.linkGrid}>
                        {/* Card: Whitepaper PDF */}
                        <Link href="/docs/Y-SNA-Technical-Architecture.pdf" target="_blank" className={styles.resourceCard}>
                            <div className={styles.cardContent}>
                                <div className={styles.iconBox}>
                                    <span className={styles.pdfIcon}>PDF</span>
                                </div>
                                <div className={styles.cardText}>
                                    <h4>Especificação de Arquitetura</h4>
                                    <p>Download do paper completo detalhando a transição SLP para MLP e modelagem estocástica.</p>
                                </div>
                            </div>
                            <span className={styles.externalLinkIcon}>↓</span>
                        </Link>

                        {/* Card: API Docs em Servidor Externo */}
                        <Link href="https://api.yawara.org/docs" target="_blank" className={styles.resourceCard}>
                            <div className={styles.cardContent}>
                                <div className={styles.iconBox}>
                                    <span className={styles.apiIcon}>API</span>
                                </div>
                                <div className={styles.cardText}>
                                    <h4>Documentação do Microsserviço</h4>
                                    <p>Referência técnica do servidor externo Python (FastAPI) e endpoints de inferência neural.</p>
                                </div>
                            </div>
                            <span className={styles.externalLinkIcon}>↗</span>
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default SnaPredictor;