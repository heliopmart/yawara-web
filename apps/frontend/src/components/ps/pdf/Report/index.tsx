import React from "react";
import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import { EditionFinalResultPayload } from "@yawara/types";

const PALETTE = {
  ink: "#0B0D12",
  muted: "#5B6472",
  line: "#D6DCE6",
  primary: "#E11B2D",
  bgLight: "#F8FAFC",
};

const styles = StyleSheet.create({
  page: {
    padding: 40,
    backgroundColor: "#FFFFFF",
    fontFamily: "Helvetica",
  },
  // Header
  header: {
    borderBottomWidth: 2,
    borderBottomColor: PALETTE.ink,
    paddingBottom: 15,
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  subtitleGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  subText: {
    fontSize: 8,
    color: PALETTE.muted,
    textTransform: "uppercase",
  },
  mono: {
    fontFamily: "Courier",
  },
  // Dispositions
  sectionLabel: {
    fontSize: 10,
    fontWeight: "bold",
    borderLeftWidth: 3,
    borderLeftColor: PALETTE.primary,
    paddingLeft: 8,
    marginTop: 15,
    marginBottom: 10,
    textTransform: "uppercase",
  },
  p: {
    fontSize: 9,
    color: PALETTE.muted,
    textAlign: "justify",
    lineHeight: 1.4,
    marginBottom: 5,
  },
  // Table
  table: {
    marginTop: 15,
    width: "100%",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: PALETTE.bgLight,
    borderBottomWidth: 1,
    borderBottomColor: PALETTE.ink,
    padding: 8,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: PALETTE.line,
    padding: 8,
    alignItems: "center",
  },
  colRank: { width: "10%" },
  colName: { width: "35%" },
  colId: { width: "25%" },
  colScore: { width: "10%" },
  colNucleus: { width: "20%" },

  cellHeader: { fontSize: 8, fontWeight: "bold", textTransform: "uppercase" },
  cellText: { fontSize: 9, color: PALETTE.ink },
  rankText: { fontSize: 9, fontWeight: "bold", color: PALETTE.primary },

  // Footer
  footer: {
    position: "absolute",
    bottom: 40,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: PALETTE.line,
    paddingTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  auditBox: {
    width: "70%",
  },
  auditLabel: {
    fontSize: 7,
    fontWeight: "bold",
    color: PALETTE.muted,
    marginBottom: 2,
  },
  hashText: {
    fontSize: 7,
    color: PALETTE.muted,
    fontFamily: "Courier",
  },
  brand: {
    fontSize: 14,
    fontWeight: "bold",
  },
});

export const FinalResultsReport: React.FC<{ data: EditionFinalResultPayload }> = ({ data }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Edital de Homologação de Resultados</Text>
        <View style={styles.subtitleGrid}>
          <Text style={styles.subText}>PROCESSO: {data.edition_name}</Text>
          <Text style={[styles.subText, styles.mono]}>ID: {data.edition_id}</Text>
          <Text style={styles.subText}>ENGINE: {data.engine_version} ({data.engine_mode})</Text>
        </View>
      </View>

      {/* Dispositions */}
      <View>
        <Text style={styles.sectionLabel}>01 // Transparência e Critérios</Text>
        <Text style={styles.p}>
          O presente documento oficializa o encerramento e a homologação dos resultados do {data.edition_name}.
          A seleção utilizou o motor Y-SNA {data.engine_version}, garantindo uma análise imparcial baseada em
          competências técnicas e comportamentais.
        </Text>
        <Text style={styles.sectionLabel}>02 // Disposições Gerais</Text>
        <Text style={styles.p}>
          A Lista de Classificação e Admissão anexa consolida os resultados do {data.edition_name},
          refletindo a avaliação técnica e estrutural dos candidatos, organizada por ordem de desempenho.
          A alocação dos candidatos aprovados foi realizada de forma criteriosa, considerando as competências
          identificadas, as preferências informadas e a disponibilidade de vagas em cada núcleo, em conformidade
          com os parâmetros definidos pelo sistema de seleção.

          Eventuais solicitações de esclarecimento, questionamentos ou pedidos de informação adicional deverão
          ser encaminhados exclusivamente ao endereço eletrônico equipeyawaraufgd@gmail.com, para análise pela
          equipe responsável.

          A Equipe Yawara UFGD agradece a participação de todos os candidatos e reafirma seu compromisso com a
          transparência, a integridade dos dados e a busca contínua pela excelência em seus processos seletivos
          e formativos.
        </Text>

        <Text style={styles.sectionLabel}>02 // Lista de Classificação e Admissão</Text>
      </View>

      {/* Results Table */}
      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={[styles.cellHeader, styles.colRank]}>Posição</Text>
          <Text style={[styles.cellHeader, styles.colName]}>Candidato</Text>
          <Text style={[styles.cellHeader, styles.colId]}>ID</Text>
          <Text style={[styles.cellHeader, styles.colScore]}>Score</Text>
          <Text style={[styles.cellHeader, styles.colNucleus]}>Núcleo</Text>
        </View>

        {data.approved_candidates.map((c) => (
          <View key={c.candidate_id} style={styles.tableRow}>
            <View style={styles.colRank}><Text style={styles.rankText}>#{String(c.rank).padStart(2, '0')}</Text></View>
            <View style={styles.colName}><Text style={styles.cellText}>{c.candidate_name}</Text></View>
            <View style={styles.colId}><Text style={[styles.cellText, styles.mono, { fontSize: 7 }]}>{c.candidate_id.split('-')[0]}...</Text></View>
            <View style={styles.colScore}><Text style={styles.cellText}>{c.score.toFixed(2)}</Text></View>
            <View style={styles.colNucleus}><Text style={styles.cellText}>{c.allocated_nucleus}</Text></View>
          </View>
        ))}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.auditBox}>
          <Text style={styles.auditLabel}>ASSINATURA DIGITAL DE AUDITORIA (HASH):</Text>
          <Text style={styles.hashText}>{data.sing_hash}</Text>
          <Text style={[styles.subText, { marginTop: 4 }]}>GERADO EM: {data.generation_timestamp}</Text>
        </View>
        <Text style={styles.brand}>YAWARA.</Text>
      </View>
    </Page>
  </Document>
);