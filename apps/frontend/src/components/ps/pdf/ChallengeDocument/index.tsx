import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { downloadChanllengeData } from '@yawara/types'

const renderContent = (rawText: string) => {
    if (!rawText) return null;
    const lines = rawText.split(/\\n|\n/);

    return lines.map((line, index) => {
        const trimmedLine = line.trim();

        if (!trimmedLine) return null;

        const isHeader = trimmedLine.length < 50 && trimmedLine.endsWith(':');

        if (isHeader) {
            return (
                <Text key={index} style={styles.textHeader}>
                    {trimmedLine}
                </Text>
            );
        }

        return (
            <Text key={index} style={styles.textParagraph}>
                {trimmedLine}
            </Text>
        );
    });
};

const styles = StyleSheet.create({
    page: { 
        padding: 0, 
        fontFamily: 'Helvetica', 
        fontSize: 12, 
        lineHeight: 1.5 
    },
    
    bodyContainer: {
        padding: 40,
        height: '100%',
        display: 'flex',
        flexDirection: 'column'
    },

    header: { marginBottom: 20, borderBottom: '2px solid #8a1212', paddingBottom: 10 },
    brand: { fontSize: 24, color: '#8a1212', fontWeight: 'bold' },
    subHeader: { fontSize: 10, color: '#666', marginTop: 15 },
    title: { fontSize: 18, marginBottom: 15, marginTop: 20, fontWeight: 'bold' },
    content: { marginBottom: 10, textAlign: 'justify' },
    footer: { position: 'absolute', bottom: 30, left: 40, right: 40, fontSize: 9, textAlign: 'center', color: '#999' },

    textParagraph: {
        fontSize: 11,
        marginBottom: 8, 
        lineHeight: 1.5,
        color: '#333',
        textAlign: 'justify'
    },
    textHeader: {
        fontSize: 12,
        fontWeight: 'bold',
        marginBottom: 4,
        marginTop: 10,
        color: '#000'
    },

    // --- ESTILOS DA PÁGINA DE SEGURANÇA ---
    
    watermarkLayer: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: -1 
    },
    watermarkText: {
        fontSize: 55,
        color: '#f0f0f0', 
        transform: 'rotate(-45deg)',
        fontWeight: 'bold',
        opacity: 0.5
    },

    
    contentLayer: {
        padding: 40, 
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between' 
    },

    securityHeader: { borderBottom: '4px solid #000', paddingBottom: 10, marginBottom: 40 },
    securityTitle: { fontSize: 24, fontWeight: 'heavy', color: '#000', textTransform: 'uppercase' },
    securitySubtitle: { fontSize: 10, color: '#666', marginTop: 15, letterSpacing: 2 },

    alertBox: { backgroundColor: '#8a1212', padding: 20, marginBottom: 30, borderRadius: 2 },
    alertTitle: { color: '#fff', fontSize: 14, fontWeight: 'bold', marginBottom: 5, textTransform: 'uppercase', textAlign: 'center' },
    alertText: { color: '#fff', fontSize: 10, textAlign: 'center' },

    instructionSection: { marginBottom: 30, padding: 20, border: '1px solid #ccc' },
    instructionTitle: { fontSize: 12, fontWeight: 'bold', marginBottom: 10, textTransform: 'uppercase' },
    instructionText: { fontSize: 10, color: '#333', marginBottom: 5 },

    tokenContainer: { marginTop: 'auto' },
    tokenLabel: { fontSize: 8, color: '#666', marginBottom: 5, textTransform: 'uppercase', letterSpacing: 1 },
    tokenBox: { backgroundColor: '#e6e6e6', padding: 10, border: '1px solid #999', fontFamily: 'Courier' },
    tokenText: { fontSize: 8, color: '#000', lineHeight: 1.2, wordBreak: 'break-all' },
    
    securityFooter: { borderTop: '1px solid #ccc', paddingTop: 10, marginTop: 20, display: 'flex', flexDirection: 'row', justifyContent: 'space-between' },
    securityFooterText: { fontSize: 7, color: '#999' }
});

interface Props {
    data: downloadChanllengeData;
    securityToken: string;
}

export const ChallengeDocument = ({ data, securityToken }: Props) => (
    <Document>
        <Page size="A4" style={styles.page}>
            <View style={styles.bodyContainer}>
                <View style={styles.header}>
                    <Text style={styles.brand}>YAWARA - Processo Seletivo - Portão de Ferro</Text>
                    <Text style={styles.subHeader}>Edição: {data.edition_name} | Participante: {data.student_name}</Text>
                </View>

                <View>
                    <Text style={styles.title}>{data.title}</Text>
                </View>

                <View>
                    {renderContent(data.content_text)}
                </View>

                {data.rules && (
                    <View style={{ marginTop: 20, padding: 10, backgroundColor: '#f4f4f7' }}>
                        <Text style={{ fontWeight: 'bold', marginBottom: 5 }}>Regras Específicas:</Text>
                        {data?.rules?.map((rule, index) => (
                            <Text key={index} style={{ fontSize: 10 }}>{index + 1}. {rule}</Text>
                        ))}
                    </View>
                )}

                <View style={styles.footer}>
                    <Text>Documento gerado automaticamente pelo Sistema Yawara.</Text>
                </View>
            </View>
        </Page>

        <Page size="A4" style={styles.page}>
            
            <View style={styles.watermarkLayer} fixed>
                <Text style={styles.watermarkText}>DO NOT REMOVE</Text>
            </View>

            <View style={styles.contentLayer} wrap={false}>
                
                <View>
                    <View style={styles.securityHeader}>
                        <Text style={styles.securityTitle}>Protocolo de Validação</Text>
                        <Text style={styles.securitySubtitle}>YAWARA INTEGRITY VERIFICATION SYSTEM // REF: {data.student_name?.toUpperCase()}</Text>
                    </View>

                    <View style={styles.alertBox}>
                        <Text style={styles.alertTitle}>AÇÃO OBRIGATÓRIA</Text>
                        <Text style={styles.alertText}>
                            Esta página contém metadados criptográficos essenciais para a validação dessa etapa.
                            A remoção desta página resultará na invalidação automática da sua submissão pelo nosso sistema.
                        </Text>
                    </View>

                    <View style={styles.instructionSection}>
                        <Text style={styles.instructionTitle}>Instruções de Merge:</Text>
                        <Text style={styles.instructionText}>1. Realize o desafio proposto.</Text>
                        <Text style={styles.instructionText}>2. Gere o PDF da sua solução / documentação.</Text>
                        <Text style={styles.instructionText}>3. Utilize uma ferramenta de merge de PDF.</Text>
                        <Text style={styles.instructionText}>4. Anexe seu arquivo ANTES desta página.</Text>
                        <Text style={styles.instructionText}>5. Certifique-se que esta continua sendo a ÚLTIMA página do arquivo final.</Text>
                    </View>
                </View>

                <View style={styles.tokenContainer}>
                    <Text style={styles.tokenLabel}>CRYPTOGRAPHIC HASH TOKEN:</Text>
                    <View style={styles.tokenBox}>
                        <Text style={styles.tokenText}>{securityToken}</Text>
                    </View>

                    <View style={styles.securityFooter}>
                        <Text style={styles.securityFooterText}>YAWARA AUTOMATED SYSTEM VALIDATION</Text>
                        <Text style={styles.securityFooterText}>SECURE ID: {securityToken.slice(-12).toUpperCase()}</Text>
                    </View>
                </View>

            </View>
        </Page>
    </Document>
);