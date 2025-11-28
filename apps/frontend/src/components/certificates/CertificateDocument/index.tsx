import { CertificateData } from "@yawara/types"
import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image as PdfImage } from '@react-pdf/renderer';
import { yawaraIcon } from './yawara-icon'

// ==========================================
// 1. ATIVOS E CONFIGURAÇÕES (FONTES E IMAGENS)
// ==========================================

// --- PLACEHOLDERS DE IMAGEM (BASE64) ---
// PARA SUBSTITUIR: Converta suas imagens reais (PNG/JPG) para Base64.

const LOGO_BASE64 = yawaraIcon

const SIGNATURE1_BASE64 = process.env.SIGNATURE1_BASE64 || null;
const SIGNATURE1_NAME =  process.env.SIGNATURE1_NAME || "";
const SIGNATURE1_ROLE = process.env.SIGNATURE1_ROLE || "Coordenador do Projeto de extensão";

const SIGNATURE2_BASE64 = process.env.SIGNATURE2_BASE64 || null;
const SIGNATURE2_NAME =  process.env.SIGNATURE2_NAME || "";
const SIGNATURE2_ROLE = process.env.SIGNATURE2_ROLE || "Líder do Projeto de extensão";

// ==========================================
// 2. ESTILOS (LAYOUT FLEXBOX CORRIGIDO)
// ==========================================
const styles = StyleSheet.create({
    page: {
        backgroundColor: '#FFFFFF',
        padding: 30,
        fontFamily: 'Helvetica',
        flexDirection: 'column',
    },
    // Borda Externa (Preta)
    borderContainer: {
        border: '3px solid #111',
        flexGrow: 1,
        padding: 5,
        flexDirection: 'column',
    },
    // Borda Interna (Vermelho Yawara)
    innerBorder: {
        border: '1px solid #b91c1c',
        flexGrow: 1,
        padding: 20,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between', // Cabeçalho no topo, Footer no final
    },

    // --- SEÇÃO: CABEÇALHO ---
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
        marginTop: -30,
        borderBottom: '1px solid #eee',
        paddingBottom: 10,
    },
    logoImage: {
        width: 120,
        height: 120,
        objectFit: 'contain', // Garante que a logo não distorça
    },
    titleContainer: {
        alignItems: 'flex-end',
    },
    subTitle: {
        fontSize: 10,
        color: '#b91c1c',
        fontWeight: 700,
        letterSpacing: 1,
    },
    mainTitle: {
        fontSize: 24,
        fontWeight: 700,
        textTransform: 'uppercase',
        color: '#111',
    },

    // --- SEÇÃO: CONTEÚDO PRINCIPAL ---
    mainContent: {
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 30,
        flexGrow: 1, // Faz este bloco ocupar o espaço central
    },
    introText: {
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 1.5,
        marginBottom: 5,
        color: '#333',
    },
    studentNameBlock: {
        marginVertical: 20,
        borderBottom: '2px solid #b91c1c',
        paddingBottom: 10,
        alignItems: 'center',
        width: '100%',
    },
    studentName: {
        fontSize: 26,
        fontWeight: 700,
        color: '#b91c1c',
        textAlign: 'center',
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    cpfText: {
        fontSize: 10,
        color: '#666',
        textAlign: 'center',
        fontStyle: 'italic',
    },
    detailsText: {
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 1.5,
        color: '#333',
    },
    courseHighlight: {
        fontWeight: 700,
        color: '#000',
    },
    mottoText: {
        fontSize: 12,
        fontStyle: 'italic',
        color: '#666',
        marginTop: 25,
        textAlign: 'center',
    },

    // --- SEÇÃO: RODAPÉ (ASSINATURAS + TÉCNICO) ---
    footer: {
        flexDirection: 'column',
        marginTop: 20,
    },

    // Sub-seção: Assinaturas
    signaturesRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
        marginBottom: 30,
        alignItems: 'flex-end',
    },
    signatureBlock: {
        alignItems: 'center',
        width: 200,
    },
    signatureImage: {
        width: 150,
        height: 40,
        marginBottom: 5,
        objectFit: 'contain',
    },
    signatureLine: {
        width: '100%',
        height: 1,
        backgroundColor: '#333',
        marginBottom: 5,
    },
    signerName: {
        fontSize: 11,
        fontWeight: 700,
        color: '#000',
    },
    signerRole: {
        fontSize: 9,
        color: '#555',
        textAlign: 'center',
    },

    // Sub-seção: Barra Técnica (Legal + QR)
    bottomBar: {
        borderTop: '1px solid #ddd',
        paddingTop: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end', // Alinha o bloco de texto com a base do QR code
    },
    legalTexts: {
        width: '65%',
        justifyContent: 'flex-end',
    },
    legalDisclaimer: {
        fontSize: 8,
        color: '#777',
        marginBottom: 2,
        lineHeight: 1.2,
    },

    // Bloco do QR Code
    qrCodeBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        padding: 6,
        borderRadius: 4,
        border: '1px solid #eee',
    },
    qrImage: {
        width: 45,
        height: 45,
    },
    qrInfoGroup: {
        marginLeft: 10,
        justifyContent: 'center',
    },
    qrCallToAction: {
        fontSize: 7,
        color: '#b91c1c',
        fontWeight: 700,
    },
    qrUrl: {
        fontSize: 7,
        color: '#555',
        marginBottom: 3,
    },
    uuidLabel: {
        fontSize: 6,
        color: '#999',
    },
    uuidValue: {
        fontSize: 8,
        fontFamily: 'Helvetica',
        fontWeight: 700,
        color: '#000',
        letterSpacing: 0.5,
    },
});

// ==========================================
// 3. O COMPONENTE REACT (CERTIFICADO)
// ==========================================

export const CertificateDocument: React.FC<CertificateData & { qrCodeUrl: string }> =  ({
    course_name,
    issue_date,
    student_name,
    id,
    cpf,
    hours = 4,
    qrCodeUrl
}) => {

    // Formatação de data segura (evita erro "Invalid Date")
    const formattedDate = issue_date 
        ? new Date(issue_date).toLocaleDateString('pt-BR') 
        : new Date().toLocaleDateString('pt-BR');

    // Formatação de CPF para exibição (se já não vier formatado)
    const displayCpf = cpf || "000.000.000-00";

    return (
        <Document>
            <Page size="A4" orientation="landscape" style={styles.page}>

                {/* Container Borda Externa */}
                <View style={styles.borderContainer}>

                    {/* Container Borda Interna (Flex Column que organiza tudo) */}
                    <View style={styles.innerBorder}>

                        {/* === TOPO: CABEÇALHO === */}
                        <View style={styles.header}>
                            {/* LOGO: Substitua LOGO_BASE64 pela sua string real */}
                            <PdfImage src={LOGO_BASE64} style={styles.logoImage} />

                            <View style={styles.titleContainer}>
                                <Text style={styles.subTitle}>PROJETO DE EXTENSÃO</Text>
                                <Text style={styles.mainTitle}>CERTIFICADO DE PARTICIPAÇÃO</Text>
                            </View>
                        </View>

                        {/* === MEIO: CONTEÚDO PRINCIPAL === */}
                        <View style={styles.mainContent}>
                            <Text style={styles.introText}>
                                A Coordenação do Projeto de Extensão <Text style={{ fontWeight: 700 }}>Team Yawara</Text> certifica que
                            </Text>

                            {/* Nome do Aluno (em bloco isolado) */}
                            <View style={styles.studentNameBlock}>
                                <Text style={styles.studentName}>{student_name}</Text>
                                <Text style={styles.cpfText}>Inscrito sob o CPF nº {displayCpf}</Text>
                            </View>

                            <Text style={styles.detailsText}>
                                participou com êxito da atividade <Text style={styles.courseHighlight}>{course_name}</Text>,
                                realizada em {formattedDate}, totalizando uma carga horária de {hours} horas.
                            </Text>

                            <Text style={styles.mottoText}>
                                "Inovação, velocidade e sustentabilidade sobre duas rodas."
                            </Text>
                        </View>

                        {/* === FIM: RODAPÉ GERAL === */}
                        <View style={styles.footer}>

                            {/* --- Assinaturas --- */}
                            <View style={styles.signaturesRow}>

                                {/* Assinatura 1 */}
                                <View style={styles.signatureBlock}>
                                    <View style={styles.signatureLine} />
                                    <Text style={styles.signerName}>{SIGNATURE1_NAME}</Text>
                                    <Text style={styles.signerRole}>{SIGNATURE1_ROLE}</Text>
                                    <Text style={styles.signerRole}>Universidade Federal da Grande Dourados</Text>
                                </View>

                                {/* Assinatura 2 */}
                                <View style={styles.signatureBlock}>
                                    <View style={styles.signatureLine} />
                                    <Text style={styles.signerName}>{SIGNATURE2_NAME}</Text>
                                    <Text style={styles.signerRole}>{SIGNATURE2_ROLE}</Text>
                                    <Text style={styles.signerRole}>Universidade Federal da Grande Dourados</Text>
                                </View>
                            </View>

                            {/* --- Barra Técnica (Legal + QR Code) --- */}
                            <View style={styles.bottomBar}>

                                {/* Textos Legais (Lado Esquerdo) */}
                                <View style={styles.legalTexts}>
                                    <Text style={styles.legalDisclaimer}>
                                        Este documento atesta a participação em atividade de extensão universitária, fomentando o aprendizado prático e a iniciação tecnológica.
                                    </Text>
                                    <Text style={styles.legalDisclaimer}>
                                        Válido para comprovação de carga horária complementar. Não equivale a diploma de graduação.
                                    </Text>
                                </View>

                                {/* Bloco do QR Code (Lado Direito) */}
                                <View style={styles.qrCodeBox}>
                                    {/* Renderiza a imagem do QR Code se ela foi gerada com sucesso */}
                                    {qrCodeUrl ? <PdfImage src={qrCodeUrl} style={styles.qrImage} /> : null}

                                    <View style={styles.qrInfoGroup}>
                                        <Text style={styles.qrCallToAction}>VERIFICAR AUTENTICIDADE</Text>
                                        <Text style={styles.qrUrl}>Escaneie ou acesse yawara.com.br/docs/certificate</Text>
                                        <Text style={styles.uuidLabel}>CÓDIGO ÚNICO:</Text>
                                        <Text style={styles.uuidValue}>{id}</Text>
                                    </View>
                                </View>

                            </View> {/* Fim da Barra Técnica */}

                        </View> {/* Fim do Rodapé Geral */}

                    </View> {/* Fim da Borda Interna */}
                </View> {/* Fim da Borda Externa */}
            </Page>
        </Document>
    );
};