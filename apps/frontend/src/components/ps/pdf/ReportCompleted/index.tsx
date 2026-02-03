import React from "react";
import { Document, Page, View, Text, StyleSheet, Image } from "@react-pdf/renderer";
import { ReportPayload } from "@yawara/types"

export interface FinalisedCandidateReportProps {
  payload: ReportPayload;
  logoSrc?: string;
}

const PALETTE = {
  ink: "#0B0D12",
  muted: "#5B6472",
  line: "#D6DCE6",
  primary: "#E11B2D",
  techOrange: "#F97316",
  bg: "#FFFFFF",
  bgSoft: "#F9FAFB",
  consolBg: "#FDF2F2",
  terminalBg: "#1A1D23",
  terminalBorder: "#374151",
  terminalHeaderBg: "#333333",
  terminalHeaderText: "#9CA3AF",
  terminalText: "#D1D5DB",
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function formatScore(score: number) {
  const s = clamp(score, 0, 10);
  return s.toFixed(2);
}

function buildMissingSkillsList(missing?: string[]) {
  if (!missing || missing.length === 0) return "—";
  return missing.join(", ");
}

function buildFocusSuggestion(missing?: string[]) {
  if (missing && missing.length > 0) return missing[0];
  return "bases do núcleo alvo";
}

function buildBaseline(payload: ReportPayload) {
  return payload.accepted_nucleus ?? payload.process_name ?? "Baseline";
}

function formatToCampoGrande(dateIso: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'medium',
    timeZone: 'America/Campo_Grande' 
  }).format(new Date(dateIso));
}


export function FinalisedCandidateReport({ payload }: { payload: ReportPayload }) {
  const missingList = buildMissingSkillsList(payload.missing_skills);
  const focusSuggestion = buildFocusSuggestion(payload.missing_skills);
  const baseline = buildBaseline(payload);

  return (
    <Document>
      <Page size="A4" style={styles.page} wrap>
        {/* Seal */}
        <View style={styles.sealFinalised}>
          <Text style={styles.sealFinalisedText}>FINALIZADO</Text>
        </View>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.brandRow}>
            <View style={styles.titleBlock}>
              <Text style={styles.h1}>Performance & Feedback</Text>
              <Text style={styles.sub}>
                Yawara System Neural Architecture // {payload.process_name} // {payload.process_id.slice(0, 10)}
              </Text>
            </View>
          </View>
        </View>

        {/* Consolation */}
        <View style={styles.consolationBox}>
          <Text style={styles.consolationTitle}>Prezado(a) {payload.candidate_name},</Text>
          <Text style={styles.consolationText}>
            Agradecemos imensamente o seu interesse e esforço durante este processo seletivo. Identificamos grande
            potencial em seu perfil, contudo, devido à alta competitividade e ao limite de vagas por núcleo, informamos
            que você não foi selecionado(a) para esta edição. Na engenharia, cada falha é uma oportunidade de iteração.
            Este relatório serve como diagnóstico para o seu desenvolvimento contínuo.
          </Text>
        </View>

        {/* Identity Grid (3 cols) */}
        <View style={styles.identityGrid}>
          <View style={[styles.gridCell, styles.gridRight]}>
            <Text style={styles.label}>Candidato</Text>
            <Text style={styles.val}>{payload.candidate_name}</Text>
          </View>

          <View style={[styles.gridCell, styles.gridRight]}>
            <Text style={styles.label}>ID (SNA)</Text>
            <Text style={[styles.val, styles.mono]}>{payload.candidate_id}</Text>
          </View>

          <View style={styles.gridCell}>
            <Text style={styles.label}>Score Final</Text>
            <Text style={[styles.val, styles.mono, styles.scoreFinal]}>
              {formatScore(payload.final_score)}
            </Text>
            <Text style={[styles.miniMuted, styles.mono]}>
              {clamp(payload.final_score_percent, 0, 100).toFixed(1)}%
            </Text>
          </View>
        </View>

        {/* 01 Gap Analysis */}
        <View style={styles.section}>
          <View style={styles.sectionTag}>
            <Text style={styles.sectionTagText}>01 // Análise de Lacunas (SNA Diagnostics)</Text>
          </View>

          <View style={styles.terminal}>
            <View style={styles.terminalHeader}>
              <Text style={styles.terminalHeaderText}>gap_detection_engine.log</Text>
            </View>

            <View style={styles.terminalBody}>
              <Text style={styles.terminalLine}>
                {">"} EXECUTANDO DIAGNÓSTICOS NO SCORE: {formatScore(payload.final_score)}
              </Text>
              <Text style={styles.terminalLine}>
                {">"} COMPARANDO COM O NÚCLEO BASELINE ({baseline})
              </Text>
              <Text style={[styles.terminalLine, styles.tOrange]}>
                {">"} [ALERTA] REQUISITOS AUSENTES EM: {missingList}
              </Text>
              <Text style={styles.terminalLine}>
                {">"} ITERAÇÃO SUGERIDA: Foco em {focusSuggestion}
              </Text>
            </View>
          </View>
        </View>

        {/* 02 Next steps */}
        <View style={styles.section}>
          <View style={styles.sectionTag}>
            <Text style={styles.sectionTagText}>02 // Próximos Passos & Desenvolvimento</Text>
          </View>

          <Text style={styles.p}>
            <Text style={styles.bold}>Não pare por aqui.</Text>{" "}
            Sugerimos os seguintes passos para fortalecer sua candidatura em ciclos futuros:
          </Text>

          <View style={styles.list}>
            <Bullet>
              <Text style={styles.bold}>Reforço em {focusSuggestion}:</Text> Busque projetos práticos ou disciplinas que
              aprofundem este tema.
            </Bullet>
            <Bullet>
              <Text style={styles.bold}>Engajamento:</Text> Continue acompanhando as inovações e transparência do Yawara
              através do nosso portal.
            </Bullet>
            <Bullet>
              <Text style={styles.bold}>Próxima Edição:</Text> Sua conta SNA permanece ativa. Seus dados de desempenho
              serão considerados como histórico evolutivo na próxima PS.
            </Bullet>
          </View>

          {payload.missing_skills && payload.missing_skills.length > 0 && (
            <View style={styles.missingBox}>
              <Text style={styles.missingTitle}>Competências ausentes detectadas</Text>
              {payload.missing_skills.slice(0, 12).map((s, i) => (
                <Text key={i} style={styles.missingItem}>
                  • {s}
                </Text>
              ))}
              {payload.missing_skills.length > 12 && (
                <Text style={styles.miniMuted}>
                  +{payload.missing_skills.length - 12} itens (resumo no terminal acima)
                </Text>
              )}
            </View>
          )}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            DOCUMENTO DE FEEDBACK // EQUIPE YAWARA // {payload.sing_hash}
          </Text>
          <Text style={styles.footerSub}>
            {formatToCampoGrande(payload.last_row_update_datetime)}
          </Text>
        </View>
      </Page>
    </Document>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.bulletRow}>
      <Text style={styles.bulletDot}>•</Text>
      <Text style={styles.bulletText}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    paddingTop: 28,
    paddingBottom: 26,
    paddingHorizontal: 28,
    fontFamily: "Helvetica",
    backgroundColor: PALETTE.bg,
    color: PALETTE.ink,
  },

  sealFinalised: {
    position: "absolute",
    top: 25,
    right: 36,
    borderWidth: 5,
    borderColor: PALETTE.muted,
    paddingVertical: 8,
    paddingHorizontal: 16,
    transform: "rotate(-5deg)",
    opacity: 0.6,
  },
  sealFinalisedText: {
    fontSize: 22,
    fontWeight: 900 as any,
    color: PALETTE.muted,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },

  // Header
  header: {
    borderBottomWidth: 3,
    borderBottomColor: PALETTE.muted,
    paddingBottom: 16,
    marginBottom: 18,
  },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  logo: { width: 90, height: 40, objectFit: "contain" as any },
  logoPlaceholder: {
    width: 90,
    height: 40,
    borderWidth: 1,
    borderColor: PALETTE.line,
    backgroundColor: PALETTE.bgSoft,
    justifyContent: "center",
    alignItems: "center",
  },
  logoPlaceholderText: {
    fontSize: 10,
    fontFamily: "Courier",
    color: PALETTE.muted,
  },
  titleBlock: { flexGrow: 1 },
  h1: { fontSize: 15, fontWeight: 900 as any, textTransform: "uppercase" },
  sub: { marginTop: 4, fontSize: 7, fontFamily: "Courier", color: PALETTE.muted },

  // Consolation box
  consolationBox: {
    backgroundColor: PALETTE.consolBg,
    borderLeftWidth: 4,
    borderLeftColor: PALETTE.primary,
    padding: 14,
    marginBottom: 16,
  },
  consolationTitle: { fontSize: 12, fontWeight: 800 as any, color: PALETTE.primary, marginBottom: 6 },
  consolationText: { fontSize: 9.8, lineHeight: 1.45, color: "#4B5563" },

  // Identity grid
  identityGrid: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: PALETTE.line,
    marginBottom: 18,
  },
  gridCell: { padding: 10, flexGrow: 1 },
  gridRight: { borderRightWidth: 1, borderRightColor: PALETTE.line },
  label: {
    fontSize: 7,
    fontWeight: 700 as any,
    color: PALETTE.muted,
    textTransform: "uppercase",
    marginBottom: 4,
    letterSpacing: 0.4,
  },
  val: { fontSize: 11, fontWeight: 600 as any },
  mono: { fontFamily: "Courier", textTransform: "uppercase" },
  scoreFinal: { color: PALETTE.primary, fontWeight: 800 as any, fontSize: 12 },

  miniMuted: { fontSize: 7.5, color: PALETTE.muted, marginTop: 2 },

  // Section tag
  section: { marginTop: 12 },
  sectionTag: {
    backgroundColor: PALETTE.muted,
    alignSelf: "flex-start",
    paddingVertical: 3,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  sectionTagText: { fontSize: 8, color: "#FFFFFF", fontFamily: "Courier" },

  // Terminal
  terminal: {
    borderWidth: 1,
    borderColor: PALETTE.terminalBorder,
    borderRadius: 6,
    overflow: "hidden",
  },
  terminalHeader: { backgroundColor: PALETTE.terminalHeaderBg, paddingVertical: 6, paddingHorizontal: 10 },
  terminalHeaderText: { fontFamily: "Courier", fontSize: 7, color: PALETTE.terminalHeaderText },
  terminalBody: { backgroundColor: PALETTE.terminalBg, paddingVertical: 10, paddingHorizontal: 10 },
  terminalLine: { fontFamily: "Courier", fontSize: 8.5, color: PALETTE.terminalText, lineHeight: 1.55 },
  tOrange: { color: PALETTE.techOrange },

  // Body text + list
  p: { fontSize: 9.8, lineHeight: 1.45, marginBottom: 8 },
  bold: { fontWeight: 700 as any },
  list: { marginTop: 4 },

  bulletRow: { flexDirection: "row", gap: 6, marginBottom: 6 },
  bulletDot: { width: 10, fontSize: 10 },
  bulletText: { flexGrow: 1, fontSize: 9.6, lineHeight: 1.45 },

  // Missing skills box
  missingBox: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: PALETTE.line,
    backgroundColor: PALETTE.bgSoft,
    padding: 10,
  },
  missingTitle: { fontSize: 9.5, fontWeight: 800 as any, color: PALETTE.ink, marginBottom: 6 },
  missingItem: { fontSize: 9.2, lineHeight: 1.35, marginBottom: 2 },

  // Footer
  footer: {
    marginTop: 18,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: PALETTE.line,
    alignItems: "center",
  },
  footerText: { fontFamily: "Courier", fontSize: 7, color: PALETTE.muted },
  footerSub: { marginTop: 4, fontFamily: "Courier", fontSize: 7, color: PALETTE.muted },
});