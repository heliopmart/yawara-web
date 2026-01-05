import logging
import io
import base64
import textwrap 
import numpy as np
import matplotlib
import matplotlib.pyplot as plt
from jinja2 import Template
from weasyprint import HTML, CSS
from app.templates.report_xai import HTML_TEMPLATE, PDF_CSS
from app.schemas.report import CandidateReportBundle

# Configura backend não-interativo para servidor
matplotlib.use('Agg')

logger = logging.getLogger("yawara.services.html_generator")

class HTMLReportService:
    
    def generate_html(self, bundle: CandidateReportBundle) -> str:
        """Gera HTML interativo para validação visual (com Chart.js)."""
        template = Template(HTML_TEMPLATE)
        return template.render(bundle=bundle, pdf_mode=False)

    def generate_pdf_bytes(self, bundle: CandidateReportBundle) -> bytes:
        """
        Gera o PDF final 'Print-Ready'.
        Substitui Chart.js por imagens estáticas Matplotlib e injeta CSS nativo.
        """
        # 1. Gerar imagens dos gráficos (Matplotlib) para cada núcleo
        for nucleus in bundle.nuclei_reports:
            nucleus.chart_b64 = self._generate_radar_chart_image(
                nucleus.chart_labels, 
                nucleus.chart_values
            )

        # 2. Renderizar HTML em modo PDF
        template = Template(HTML_TEMPLATE)
        html_content = template.render(bundle=bundle, pdf_mode=True)

        # 3. Converter para PDF com WeasyPrint e CSS customizado
        try:
            pdf_file = HTML(string=html_content).write_pdf(stylesheets=[CSS(string=PDF_CSS)])
            return pdf_file
        except Exception as e:
            logger.error(f"Erro na conversão WeasyPrint: {e}")
            raise e

    def _generate_radar_chart_image(self, labels, values) -> str:
        """
        Cria um gráfico de radar 'Yawara Style' usando Matplotlib.
        Retorna string base64.
        """
        plt.clf() # Limpar plot anterior
        
        # Setup dos dados (Circular)
        N = len(labels)
        if N < 3: return "" 
        
        # --- TRATAMENTO DE TEXTO (A Mágica da Gemini) ---
        # Quebra labels longas em múltiplas linhas (max 15 chars por linha)
        # Ex: "Humanidades e Ciências Sociais" -> "Humanidades e\nCiências\nSociais"
        wrapped_labels = ["\n".join(textwrap.wrap(l, width=15)) for l in labels]
        
        angles = np.linspace(0, 2 * np.pi, N, endpoint=False).tolist()
        values_loop = values + values[:1]
        angles_loop = angles + angles[:1]

        # Design Dark/Red Yawara
        # Aumentei o figsize para 5x5 para caber melhor os textos
        fig, ax = plt.subplots(figsize=(5, 5), subplot_kw=dict(polar=True))
        
        # Desenha linhas e preenchimento
        ax.plot(angles_loop, values_loop, color='#DC2626', linewidth=2, linestyle='solid')
        ax.fill(angles_loop, values_loop, color='#DC2626', alpha=0.25)

        # Estilização dos Eixos
        ax.set_yticklabels([]) # Remove números radiais (0, 2, 4...)
        ax.set_xticks(angles)
        
        # Configuração das Labels (Disciplinas)
        # pad=18 empurra o texto para longe do gráfico para não encavalar
        ax.set_xticklabels(wrapped_labels, size=6, color="#475569", weight="bold") 
        ax.tick_params(axis='x', pad=25) 
        
        # Grid
        ax.grid(color='#E2E8F0', linestyle='--', linewidth=0.5)
        ax.spines['polar'].set_visible(False) 

        # Salvar em Buffer com margem generosa (bbox_inches='tight')
        buf = io.BytesIO()
        plt.tight_layout(pad=4.0) 
        plt.savefig(buf, format='png', transparent=True, dpi=100, bbox_inches='tight', pad_inches=0.2)
        
        buf.seek(0)
        b64_string = base64.b64encode(buf.read()).decode('utf-8')
        plt.close(fig)
        
        return b64_string

html_report_service = HTMLReportService()