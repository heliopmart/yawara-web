import React from "react";
import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";
import { ReportPayload } from "@yawara/types"

const PALETTE = {
  ink: "#0B0D12",
  muted: "#5B6472",
  line: "#D6DCE6",
  line2: "#BFC7D6",
  primary: "#E11B2D",
  techGreen: "#00FF41",
  bgLight: "#F9FAFB",
  approvedColor: "#2296e4",
  terminalBg: "#1A1D23",
  terminalBorder: "#374151",
  terminalHeaderBg: "#333333",
  terminalHeaderText: "#9CA3AF",
  terminalText: "#D1D5DB",
  gold: "#FBBF24",
  track: "#F3F4F6",
};

function clamp(n: number, min = 0, max = 10) {
  return Math.max(min, Math.min(max, n));
}

function pctFrom10(score: number) {
  return (clamp(score, 0, 10) / 10) * 100;
}

function formatToCampoGrande(dateIso: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'medium',
    timeZone: 'America/Campo_Grande' 
  }).format(new Date(dateIso));
}

export function ApprovedCandidateReport({ payload }: { payload: ReportPayload }) {
  const {
    candidate_name,
    alpha,
    beta,
    candidate_id,
    corridor_score,
    final_score,
    forge_score,
    gamma,
    gate_score,
    last_row_update_datetime,
    process_id,
    process_name,
    score_top1,
    score_top2,
    score_top3,
    sing_hash,
    accepted_nucleus,
    nucleiChosen = [],
    nucleiEligible = [],
    nucleus_capacity,
    nucleus_leader_name,
    nucleus_member_count
  } = payload;

  const wTop1 = pctFrom10(score_top1);
  const wTop2 = pctFrom10(score_top2);
  const wTop3 = pctFrom10(score_top3);
  const wMe = pctFrom10(final_score);

  return (
    <Document>
      <Page size="A4" style={styles.page} wrap>
        {/* Seal */}
        <View style={styles.sealApproved}>
          <Text style={styles.sealApprovedText}>Aprovado</Text>
        </View>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.brandCol}>
            {/* <View style={styles.logoPlaceholder}>
              <Text style={styles.logoPlaceholderText}>YAWARA</Text>
            </View> */}

            <View style={styles.titleBlock}>
              <Text style={styles.h1}>Relatório de Admissão & Desempenho</Text>
              <Text style={styles.sub}>
                Yawara System Neural Architecture // {process_name} (ID: {process_id.slice(0, 10)})
              </Text>
            </View>
          </View>
        </View>

        {/* Identity Grid */}
        <View style={styles.identityGrid}>
          <View style={[styles.gridCell, styles.gridCellBorderRight]}>
            <Text style={styles.label}>Candidato</Text>
            <Text style={styles.value}>{candidate_name}</Text>
          </View>

          <View style={[styles.gridCell, styles.gridCellBorderRight]}>
            <Text style={styles.label}>Identificação (ID)</Text>
            <Text style={[styles.value, styles.mono]}>{candidate_id}</Text>
          </View>

          <View style={styles.gridCell}>
            <Text style={styles.label}>Aprovação </Text>
            <Text style={[styles.value, styles.mono]}>{formatToCampoGrande(last_row_update_datetime)}</Text>
          </View>
        </View>

        {/* 01 Metrics */}
        <View style={styles.section}>
          <View style={styles.sectionTag}>
            <Text style={styles.sectionTagText}>01 // Métricas de Desempenho</Text>
          </View>

          <View style={styles.metricsRow}>
            <MetricBox tag="STAGE 02" title="PORTÃO DE FERRO" score={gate_score} />
            <MetricBox tag="STAGE 03" title="A FORJA" score={forge_score} />
            <MetricBox tag="STAGE 04" title="O CORREDOR" score={corridor_score} />
          </View>
        </View>

        {/* 02 Nuclei */}
        <View style={styles.section}>
          <View style={styles.sectionTag}>
            <Text style={styles.sectionTagText}>
              02 // Logística de Atribuição de Núcleos
            </Text>
          </View>

          <View style={styles.cols2}>
            <View style={styles.nucleusBlock}>
              <Text style={styles.nucleusTitle}>Núcleos Elegíveis</Text>
              <View style={styles.kv}>
                <Text style={styles.k}>1ª Opção</Text>
                <Text style={styles.v}>{nucleiEligible[0] || 'N/A'}</Text>

                <Text style={styles.k}>Opção de Entrada</Text>
                <Text style={styles.v}>{nucleiEligible[1] || 'N/A'}</Text>
              </View>
            </View>

            <View style={styles.nucleusBlock}>
              <Text style={styles.nucleusTitle}>Núcleos Escolhidos</Text>
              <View style={styles.kv}>
                <Text style={styles.k}>1ª Opção</Text>
                <Text style={styles.v}>{nucleiChosen[0] || 'N/A'}</Text>

                <Text style={styles.k}>Opção de Entrada</Text>
                <Text style={styles.v}>{nucleiChosen[1] || 'N/A'}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* 03 Terminal + Chart */}
        <View style={styles.section} wrap={false}>
          <View style={styles.sectionTag}>
            <Text style={styles.sectionTagText}>
              03 // Resultado Final & Registro de Auditoria
            </Text>
          </View>

          {/* Terminal */}
          <View style={styles.terminal}>
            <View style={styles.terminalHeader}>
              <Text style={styles.terminalHeaderText}>academic_math_engine_v2.log</Text>
            </View>
            <View style={styles.terminalBody}>
              <Text style={styles.terminalLine}>
                {">"} Carregando pesos: Alpha({alpha}), Beta({beta}), Gamma({gamma})
              </Text>
              <Text style={styles.terminalLine}>
                {">"} Calculando: Sf = ({forge_score} * {alpha}) + ({corridor_score} * {beta}) + ({gate_score} * {gamma})
              </Text>

              <View style={styles.terminalResultRow}>
                <Text style={styles.terminalLine}>
                  {">"} RESULTADO FINAL:{" "}
                </Text>
                <Text style={styles.terminalResultGreen}>
                  {final_score}
                </Text>
                <Text style={styles.terminalLine}> / 10.0</Text>
              </View>
            </View>
          </View>

          {/* Chart */}
          <View style={styles.chartContainer}>
            <Text style={styles.chartTitle}>
              BENCHMARK: Comparação de Score com Top 3 Aprovados
            </Text>

            <BarRow label="TOP 01" value={score_top1} widthPct={wTop1} variant="top" />
            <BarRow label="TOP 02" value={score_top2} widthPct={wTop2} />
            <BarRow label="TOP 03" value={score_top3} widthPct={wTop3} />

            <View style={styles.barDivider} />
            <BarRow label="VOCÊ" value={final_score} widthPct={wMe} variant="me" />
          </View>
        </View>

        {/* Highlight nucleus */}
        <View style={styles.highlightNucleus} wrap={false}>
          <Text style={styles.highlightTitle}>
            Núcleo de Admissão: {accepted_nucleus}
          </Text>

          <View style={styles.kv}>
            <Text style={styles.k}>Líder da Unidade</Text>
            <Text style={styles.v}>{nucleus_leader_name}</Text>

            <Text style={styles.k}>Efetivo Atual</Text>
            <Text style={[styles.v, styles.mono]}>{nucleus_member_count} membros</Text>

            <Text style={styles.k}>Capacidade Máxima</Text>
            <Text style={[styles.v, styles.mono]}>{nucleus_capacity} membros</Text>
          </View>
        </View>

        {/* 04 Diretivas */}
        <View style={styles.textBox}>
          <View style={styles.sectionTag}>
            <Text style={styles.sectionTagText}>04 // Diretivas Técnicas</Text>
          </View>

          <Text style={styles.p}>
            Meus parabéns, você agora é oficialmente um mebro do{" "}
            <Text style={styles.bold}>YAWARA</Text>.
            {"\n\n"}
            Este relatório foi gerado automaticamente pelo motor de admissão Yawara. O
            processo utiliza inferência baseada em históricos via Y-SNA e a metodologia
            acadêmica de pesos ponderados para assegurar o equilíbrio entre competências
            técnicas e socioemocionais. Todo o processo é auditável e transparente,
            garantindo a integridade dos resultados apresentados.{"\n"}
            Para mais informações técnicas, consulte os documentos vinculados pelo
            projeto ou contate-nos: teamyawaraufgd@gmail.com.
          </Text>

          <Text style={[styles.p, styles.bold, { marginTop: 10 }]}>
            O que vem a seguir:
          </Text>

          <View style={styles.list}>
            <Bullet>
              O sistema já alocou você no núcleo, mas caso isso ainda não tenha
              acontecido, entre em contato com o líder responsável.
            </Bullet>
            <Bullet>
              Uma reunião de Boas Vindas será marcada e aparecerá direto no seu
              calendário. Fique atento.
            </Bullet>
            <Bullet>
              Será passado suas atribuições e você começará o seu trainee, vamos te
              mostrar o que realmente é participar do <Text style={styles.bold}>YAWARA</Text>.
            </Bullet>
            <Bullet>
              Continue focando na sua graduação, e lembre-se, na engenharia criamos
              soluções!
            </Bullet>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            DOCUMENTO CONFIDENCIAL // YAWARA MOTOSTUDENT // {sing_hash}
          </Text>
        </View>
      </Page>
    </Document>
  );
}

/** ---------- Small Components ---------- */

function MetricBox(props: { tag: string; title: string; score: number }) {
  const score = clamp(props.score, 0, 10);
  return (
    <View style={styles.metricBox}>
      <Text style={styles.metricTag}>{props.tag}</Text>
      <Text style={styles.metricTitle}>{props.title}</Text>
      <View style={styles.metricScoreRow}>
        <Text style={styles.metricScore}>{score}</Text>
        <Text style={styles.metricOutOf}>/10</Text>
      </View>
    </View>
  );
}

function BarRow(props: {
  label: string;
  value: number;
  widthPct: number;
  variant?: "me" | "top";
}) {
  const widthPct = Math.max(0, Math.min(100, props.widthPct));
  const fillStyle =
    props.variant === "me"
      ? styles.barFillMe
      : props.variant === "top"
        ? styles.barFillTop
        : styles.barFill;

  const labelStyle =
    props.variant === "me" ? [styles.barLabel, styles.barLabelMe] : styles.barLabel;
  const valStyle =
    props.variant === "me" ? [styles.barVal, styles.barValMe] : styles.barVal;

  return (
    <View style={styles.barRow}>
      <Text style={labelStyle}>{props.label}</Text>
      <View style={styles.barTrack}>
        <View style={[fillStyle, { width: `${widthPct}%` }]} />
      </View>
      <Text style={valStyle}>{clamp(props.value, 0, 10).toFixed(2)}</Text>
    </View>
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

/** ---------- Styles ---------- */

const styles = StyleSheet.create({
  page: {
    paddingTop: 28,
    paddingBottom: 26,
    paddingHorizontal: 28,
    fontFamily: "Helvetica",
    color: PALETTE.ink,
    backgroundColor: "#FFFFFF",
  },

  // Seal
  sealApproved: {
    position: "absolute",
    top: 30,
    right: 34,
    borderWidth: 4,
    borderColor: PALETTE.approvedColor,
    paddingVertical: 6,
    paddingHorizontal: 18,
    transform: "rotate(12deg)",
    opacity: 0.85,
  },
  sealApprovedText: {
    fontSize: 22,
    fontWeight: 800 as any,
    color: PALETTE.approvedColor,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },

  // Header
  header: {
    borderBottomWidth: 3,
    borderBottomColor: PALETTE.primary,
    paddingBottom: 16,
    marginBottom: 18,
  },
  brandCol: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  logo: { display: 'none', width: 90, height: 36, objectFit: "contain" as any },
  logoPlaceholder: {
    width: 90,
    height: 36,
    borderWidth: 1,
    borderColor: PALETTE.line,
    backgroundColor: PALETTE.bgLight,
    justifyContent: "center",
    alignItems: "center",
  },
  logoPlaceholderText: {
    fontSize: 10,
    fontFamily: "Courier",
    color: PALETTE.muted,
  },
  titleBlock: { flexGrow: 1 },
  h1: {
    fontSize: 14,
    fontWeight: 900 as any,
    letterSpacing: -0.2,
    textTransform: "uppercase",
  },
  sub: {
    marginTop: 4,
    fontSize: 7,
    color: PALETTE.muted,
    fontFamily: "Courier",
  },

  // Identity grid (3 columns)
  identityGrid: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: PALETTE.line,
    marginTop: 10,
    width: "100%",
  },
  gridCell: {
    flex: 1,
    padding: 8,
    minHeight: 40,
  },
  gridCellBorderRight: {
    borderRightWidth: 1,
    borderRightColor: PALETTE.line,
  },
  label: {
    fontSize: 7,
    color: PALETTE.muted,
    marginBottom: 2,
    textTransform: "uppercase",
  },
  value: {
    fontSize: 9,
    color: PALETTE.ink,
    fontWeight: "bold",
    flexWrap: "wrap",
    overflow: "hidden",
  },
  mono: {
    fontFamily: "Courier",
    fontSize: 7,
    letterSpacing: -0.2,
  },

  // Sections
  section: { marginTop: 14 },
  sectionTag: {
    backgroundColor: PALETTE.primary,
    alignSelf: "flex-start",
    paddingVertical: 3,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  sectionTagText: {
    fontSize: 8,
    color: "#FFFFFF",
    fontFamily: "Courier",
  },

  // Metrics
  metricsRow: { flexDirection: "row", gap: 10 },
  metricBox: {
    flexGrow: 1,
    borderWidth: 1,
    borderColor: PALETTE.line,
    padding: 10,
    textAlign: "center",
    backgroundColor: PALETTE.bgLight,
  },
  metricTag: { fontFamily: "Courier", fontSize: 7, color: PALETTE.muted },
  metricTitle: { marginTop: 6, fontSize: 10, fontWeight: 800 as any },
  metricScoreRow: {
    marginTop: 6,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "flex-end",
    gap: 4,
  },
  metricScore: { fontSize: 20, fontWeight: 900 as any },
  metricOutOf: { fontSize: 10, color: PALETTE.muted, marginBottom: 2 },

  // 2 cols
  cols2: { flexDirection: "row", gap: 14 },
  nucleusBlock: {
    flexGrow: 1,
    borderLeftWidth: 4,
    borderLeftColor: PALETTE.primary,
    paddingLeft: 10,
  },
  nucleusTitle: {
    fontSize: 9.5,
    fontWeight: 800 as any,
    marginBottom: 8,
    color: PALETTE.primary,
  },
  kv: {
    display: "flex",
    flexDirection: "row",
    flexWrap: "wrap",
  },
  k: {
    width: 140,
    fontSize: 9,
    color: PALETTE.muted,
    marginBottom: 6,
  },
  v: {
    width: "auto",
    flexGrow: 1,
    fontSize: 9,
    fontWeight: 600 as any,
    marginBottom: 6,
  },

  // Terminal
  terminal: {
    borderWidth: 1,
    borderColor: PALETTE.terminalBorder,
    borderRadius: 6,
    overflow: "hidden",
    marginBottom: 12,
  },
  terminalHeader: {
    backgroundColor: PALETTE.terminalHeaderBg,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  terminalHeaderText: {
    fontFamily: "Courier",
    fontSize: 7,
    color: PALETTE.terminalHeaderText,
  },
  terminalBody: {
    backgroundColor: PALETTE.terminalBg,
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  terminalLine: {
    fontFamily: "Courier",
    fontSize: 8.5,
    color: PALETTE.terminalText,
    lineHeight: 1.5,
  },
  terminalResultRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#4B5563",
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
  },
  terminalResultGreen: {
    fontFamily: "Courier",
    fontSize: 10.5,
    color: PALETTE.techGreen,
    fontWeight: 700 as any,
  },

  // Chart
  chartContainer: {
    borderWidth: 1,
    borderColor: PALETTE.line,
    padding: 10,
  },
  chartTitle: {
    fontSize: 7.5,
    fontFamily: "Courier",
    color: PALETTE.muted,
    marginBottom: 10,
  },
  barRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },
  barLabel: { width: 70, fontSize: 8, fontWeight: 700 as any, color: PALETTE.muted },
  barLabelMe: { color: PALETTE.primary },
  barTrack: {
    flexGrow: 1,
    height: 8,
    backgroundColor: PALETTE.track,
    borderRadius: 2,
    overflow: "hidden",
  },
  barFill: { height: "100%", backgroundColor: PALETTE.line2 },
  barFillMe: { height: "100%", backgroundColor: PALETTE.primary },
  barFillTop: { height: "100%", backgroundColor: PALETTE.gold },
  barVal: {
    width: 42,
    textAlign: "right",
    fontFamily: "Courier",
    fontSize: 8,
    fontWeight: 700 as any,
  },
  barValMe: { color: PALETTE.primary },
  barDivider: {
    marginTop: 4,
    marginBottom: 8,
    borderTopWidth: 1,
    borderTopColor: PALETTE.line,
    borderStyle: "dashed",
  },

  // Highlight nucleus
  highlightNucleus: {
    backgroundColor: PALETTE.bgLight,
    borderWidth: 1,
    borderColor: PALETTE.line,
    padding: 12,
    marginTop: 14,
  },
  highlightTitle: {
    fontSize: 14,
    color: PALETTE.primary,
    fontWeight: 800 as any,
    marginBottom: 8,
  },

  // Text box + list
  textBox: { marginTop: 14 },
  p: { fontSize: 9.5, lineHeight: 1.45, marginBottom: 8 },
  bold: { fontWeight: 700 as any },
  list: { marginTop: 6 },
  bulletRow: { flexDirection: "row", gap: 6, marginBottom: 5 },
  bulletDot: { width: 10, fontSize: 10 },
  bulletText: { flexGrow: 1, fontSize: 9.2, lineHeight: 1.4 },

  // Footer
  footer: {
    marginTop: 18,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: PALETTE.line,
    alignItems: "center",
  },
  footerText: { fontFamily: "Courier", fontSize: 7, color: PALETTE.muted },
});