import io
import logging
from typing import List
from datetime import datetime

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm, mm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, Flowable
from reportlab.graphics.shapes import Drawing, Rect, String, Line
from reportlab.graphics.charts.spider import SpiderChart
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT, TA_RIGHT

from app.schemas.report import CandidateReportBundle, NucleusReportContext

logger = logging.getLogger("yawara.services.pdf_generator")

# --- CORES YAWARA (Brand Identity) ---
YAWARA_BLACK = colors.HexColor("#0F172A")   # Slate 900
YAWARA_RED   = colors.HexColor("#DC2626")   # Red 600
YAWARA_GRAY  = colors.HexColor("#64748B")   # Slate 500
YAWARA_LIGHT = colors.HexColor("#F8FAFC")   # Slate 50

class TelemetryBar(Flowable):
    """Barra de progresso customizada para desenhar dentro da tabela."""
    def __init__(self, value, max_value=10, width=80, height=8, color=YAWARA_BLACK):
        self.value = value
        self.max_value = max_value
        self.width = width
        self.height = height
        self.color = color

    def draw(self):
        # Fundo (Trilho)
        self.canv.setFillColor(colors.HexColor("#E2E8F0"))
        self.canv.rect(0, 0, self.width, self.height, fill=1, stroke=0)
        
        # Frente (Progresso)
        pct = min(max(self.value / self.max_value, 0), 1)
        bar_w = self.width * pct
        self.canv.setFillColor(self.color)
        self.canv.rect(0, 0, bar_w, self.height, fill=1, stroke=0)

class PDFReportService:
    def __init__(self):
        self.styles = getSampleStyleSheet()
        self._create_styles()

    def _create_styles(self):
        # Título Principal
        self.styles.add(ParagraphStyle(
            name='YawaraHeader', parent=self.styles['Heading1'],
            fontSize=26, textColor=YAWARA_BLACK, fontName='Helvetica-Bold',
            spaceAfter=20, leading=30
        ))
        # Subtítulo (Nome do Candidato)
        self.styles.add(ParagraphStyle(
            name='YawaraSubHeader', parent=self.styles['Heading2'],
            fontSize=14, textColor=YAWARA_GRAY, fontName='Helvetica',
            spaceAfter=20
        ))
        # Títulos de Seção (NÚCLEO DE ...)
        self.styles.add(ParagraphStyle(
            name='NucleusTitle', parent=self.styles['Heading2'],
            fontSize=18, textColor=YAWARA_BLACK, fontName='Helvetica-Bold',
            spaceAfter=5
        ))
        # Labels pequenas (DIAGNÓSTICO DO SISTEMA)
        self.styles.add(ParagraphStyle(
            name='SectionLabel', parent=self.styles['Normal'],
            fontSize=9, textColor=YAWARA_RED, fontName='Helvetica-Bold',
            textTransform='uppercase', spaceAfter=2
        ))
        # Texto Pequeno para Tabelas
        self.styles.add(ParagraphStyle(
            name='BodySmall', parent=self.styles['Normal'],
            fontSize=9, textColor=YAWARA_BLACK, leading=12
        ))
        
        # --- CORREÇÃO: ADICIONADO BodyTextJustify ---
        self.styles.add(ParagraphStyle(
            name='BodyTextJustify', 
            parent=self.styles['Normal'],
            fontSize=10, 
            textColor=colors.HexColor("#334155"), # Slate 700
            leading=14,
            alignment=TA_JUSTIFY,
            spaceAfter=6
        ))

    def generate_pdf(self, bundle: CandidateReportBundle) -> bytes:
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer, pagesize=A4,
            topMargin=2*cm, bottomMargin=2*cm, leftMargin=2*cm, rightMargin=2*cm
        )
        story = []

        # 1. CAPA / CABEÇALHO GERAL
        story.append(self._draw_brand_header(bundle))
        story.append(Spacer(1, 1.5*cm))

        # 2. OVERVIEW (Personas)
        story.append(Paragraph("DIAGNÓSTICO DO SISTEMA", self.styles['SectionLabel']))
        story.append(Paragraph(bundle.overall_observation, self.styles['BodyTextJustify'])) # <--- Agora vai funcionar
        story.append(Spacer(1, 1*cm))
        story.append(PageBreak())

        # 3. NÚCLEOS (Iteração)
        for nucleus in bundle.nuclei_reports:
            # Título e Status
            story.append(self._draw_nucleus_header(nucleus))
            story.append(Spacer(1, 1*cm))

            # Layout: Gráfico Esquerda | Destaques Direita
            story.append(self._draw_charts_and_highlights(nucleus))
            story.append(Spacer(1, 1*cm))

            # Tabela Completa (A "Telemetria")
            story.append(Paragraph("TELEMETRIA COMPLETA DE DISCIPLINAS", self.styles['SectionLabel']))
            story.append(Spacer(1, 0.2*cm))
            story.append(self._draw_full_telemetry_table(nucleus))
            
            story.append(PageBreak())

        doc.build(story, onFirstPage=self._bg_template, onLaterPages=self._bg_template)
        return buffer.getvalue()

    def _bg_template(self, canvas, doc):
        """Marca d'água técnica e rodapé."""
        canvas.saveState()
        # Tarja Lateral Vermelha Fina (Tech Style)
        canvas.setFillColor(YAWARA_RED)
        canvas.rect(0, 0, 0.2*cm, A4[1], fill=1, stroke=0)
        
        # Rodapé
        canvas.setFont('Helvetica', 7)
        canvas.setFillColor(colors.HexColor("#94A3B8"))
        canvas.drawRightString(20*cm, 1*cm, f"Y-SNA GENERATED REPORT | ID: {datetime.now().strftime('%Y%m%d-%H%M')}")
        canvas.restoreState()

    def _draw_brand_header(self, bundle):
        # Título Grande
        title = Paragraph("RELATÓRIO TÉCNICO<br/>DE PERFORMANCE", self.styles['YawaraHeader'])
        subtitle = Paragraph(f"CANDIDATO: <b>{bundle.candidate_name}</b><br/>ID: {bundle.candidate_id}", self.styles['YawaraSubHeader'])
        return Table([[title], [subtitle]], colWidths=[17*cm], style=[('LEFTPADDING', (0,0), (-1,-1), 0)])

    def _draw_nucleus_header(self, nucleus):
        # Caixa de Status
        color = colors.HexColor(nucleus.status_color)
        status_text = Paragraph(f"<font color='white'><b>{nucleus.status_label}</b></font>", 
                                ParagraphStyle('s', alignment=TA_CENTER, fontSize=10))
        
        tbl_status = Table([[status_text]], colWidths=[3.5*cm])
        tbl_status.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), color),
            ('ROUNDEDCORNERS', (0,0), (-1,-1), [4,4,4,4]),
            ('TOPPADDING', (0,0), (-1,-1), 4),
            ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ]))

        title = Paragraph(nucleus.nucleus_name, self.styles['NucleusTitle'])
        
        # Correção aqui também para usar o novo estilo
        desc = Paragraph(nucleus.main_observation, self.styles['BodyTextJustify']) 

        # Layout Título | Status
        return Table([
            [title, tbl_status],
            [desc, '']
        ], colWidths=[13*cm, 4*cm])

    def _draw_charts_and_highlights(self, nucleus):
        # Radar Chart
        drawing = Drawing(200, 200)
        sp = SpiderChart()
        sp.x = 100; sp.y = 100; sp.width = 90; sp.height = 90
        
        sp.data = [nucleus.chart_values] if len(nucleus.chart_values) >= 3 else [[0,0,0]]
        sp.labels = nucleus.chart_labels if len(nucleus.chart_labels) >= 3 else ["","",""]
        sp.strands.strokeColor = colors.HexColor("#E2E8F0")
        sp.strands.fillColor = colors.HexColor("#F8FAFC")
        sp.spokes.strokeColor = colors.HexColor("#E2E8F0")
        sp.strands[0].strokeColor = YAWARA_RED
        sp.strands[0].strokeWidth = 2
        sp.strands[0].fillColor = colors.Color(220/255, 38/255, 38/255, 0.1)
        drawing.add(sp)

        # Destaques (Roadmap)
        rows = []
        if nucleus.study_roadmap:
            for item in nucleus.study_roadmap:
                icon_char = "!" if item.type == 'WEAKNESS' else "✓"
                icon_color = YAWARA_RED if item.type == 'WEAKNESS' else colors.HexColor("#166534")
                
                # Formatação Tech: Título em Bold, msg normal
                txt = Paragraph(f"<b>{item.subject}</b><br/><font size=9 color='#64748B'>{item.message}</font>", self.styles['BodySmall'])
                
                # Ícone estilizado
                p_icon = Paragraph(f"<font size=14 color='{icon_color.hexval()}'><b>{icon_char}</b></font>", self.styles['Normal'])
                
                rows.append([p_icon, txt])
        
        # --- CORREÇÃO: Evita crash se a lista estiver vazia ---
        if not rows:
            rows.append([
                Paragraph("<b>-</b>", self.styles['Normal']),
                Paragraph("Nenhum ponto crítico de atenção identificado para este núcleo.", self.styles['BodySmall'])
            ])

        tbl_highlights = Table(rows, colWidths=[1*cm, 7*cm])
        tbl_highlights.setStyle(TableStyle([
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('LEFTPADDING', (0,0), (0,-1), 0),
            ('BOTTOMPADDING', (0,0), (-1,-1), 10),
        ]))

        # Container Principal
        return Table([[drawing, tbl_highlights]], colWidths=[9*cm, 8*cm], style=[
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('ALIGN', (0,0), (0,0), 'CENTER')
        ])

    def _draw_full_telemetry_table(self, nucleus):
        """
        Gera a tabela completa com todas as matérias e barras de progresso.
        """
        features = getattr(nucleus, 'full_telemetry', [])
        
        if not features:
            return Paragraph("Dados de telemetria indisponíveis.", self.styles['Normal'])

        # Cabeçalho da Tabela
        header = ["DISCIPLINA", "NOTA", "IMPACTO", "STATUS"]
        data = [header]

        for feat in features:
            name = feat['feature_name'].replace('_', ' ').title()
            grade = feat['input_value'] # 0-10
            impact_val = feat['importance_score']
            status = "ATENÇÃO" if feat['status'] == 'WEAKNESS' else "NORMAL"
            
            # Cor da barra baseada no status
            bar_color = YAWARA_RED if feat['status'] == 'WEAKNESS' else YAWARA_BLACK
            
            # Monta linha
            row = [
                Paragraph(name, self.styles['BodySmall']),
                f"{grade:.1f}",
                # Multiplicamos o impacto por 10 ou 100 para visualizar melhor na barra
                # Como importance_score costuma ser baixo (ex: 0.1), vamos escalar
                TelemetryBar(abs(impact_val)*20, max_value=10, width=60, color=bar_color), 
                Paragraph(f"<font size=8 color='{bar_color.hexval()}'>{status}</font>", self.styles['Normal'])
            ]
            data.append(row)

        t = Table(data, colWidths=[8*cm, 1.5*cm, 3*cm, 4.5*cm], repeatRows=1)
        
        # Estilo "Zebra" Tech
        t.setStyle(TableStyle([
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'), # Header Bold
            ('FONTSIZE', (0,0), (-1,0), 8),
            ('TEXTCOLOR', (0,0), (-1,0), YAWARA_GRAY),
            ('BOTTOMPADDING', (0,0), (-1,0), 6),
            ('LINEBELOW', (0,0), (-1,0), 1, colors.HexColor("#E2E8F0")),
            
            ('FONTNAME', (0,1), (-1,-1), 'Helvetica'),
            ('FONTSIZE', (0,1), (-1,-1), 9),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor("#F8FAFC")]), # Zebra
            ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor("#E2E8F0")), # Borda fina externa
        ]))
        
        return t

pdf_report_service = PDFReportService()
