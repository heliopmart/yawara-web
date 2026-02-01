import logging
import io
from typing import Any
import base64
import textwrap
import numpy as np
import matplotlib
import matplotlib.pyplot as plt
import threading 
from jinja2 import Template
from weasyprint import HTML, CSS

from app.templates.report_xai import HTML_XAI_TEMPLATE, PDF_XAI_CSS
from app.templates.report_valence import HTML_VALENCE_TEMPLATE, PDF_VALENCE_CSS
from app.schemas.report import CandidateReportBundle

matplotlib.use('Agg')

logger = logging.getLogger("yawara.services.html_generator")

_plt_lock = threading.Lock()

class HTMLReportService:
    """
    Serviço de Geração de Relatórios Visuais.
    
    Responsabilidade:
        1. Gerar Gráficos Radar (Matplotlib) a partir de dados numéricos.
        2. Renderizar HTML (Jinja2) com os dados e gráficos.
        3. Converter HTML para PDF (WeasyPrint).
    
    Thread Safety:
        Utiliza um Lock global para a geração de gráficos, pois o Matplotlib
        não é totalmente thread-safe em ambientes concorrentes.
    """
    
    def generate_html(self, bundle: Any) -> str:
        """Gera HTML interativo (Web View)."""
        template = Template(HTML_XAI_TEMPLATE)
        return template.render(bundle=bundle, pdf_mode=False)

    def generate_xai_pdf_bytes(self, bundle: CandidateReportBundle) -> bytes:
        """
        Gera o binário do PDF final.
        """
        # 1. Gerar imagens dos gráficos (CPU Bound)
        for nucleus in bundle.nuclei_reports:
            # Gera o base64 do gráfico e injeta no objeto
            nucleus.chart_b64 = self._generate_radar_chart_image(
                nucleus.chart_labels, 
                nucleus.chart_values
            )

        # 2. Renderizar HTML em modo PDF
        template = Template(HTML_XAI_TEMPLATE)
        html_content = template.render(bundle=bundle, pdf_mode=True)

        # 3. Converter para PDF (WeasyPrint)
        try:
            pdf_file = HTML(string=html_content).write_pdf(stylesheets=[CSS(string=PDF_XAI_CSS)])
            return pdf_file
        except Exception as e:
            logger.error(f"Erro WeasyPrint: {e}")
            raise e

    def generate_valence_pdf_bytes(self, bundle: Any) -> bytes:
        """
        Gera o binário do PDF final para Relatório Valence.
        """
        template = Template(HTML_VALENCE_TEMPLATE)
        html_content = template.render(bundle=bundle, pdf_mode=True)

        try:
            pdf_file = HTML(string=html_content).write_pdf(stylesheets=[CSS(string=PDF_VALENCE_CSS)])
            return pdf_file
        except Exception as e:
            logger.error(f"Erro WeasyPrint: {e}")
            raise e

    def _generate_radar_chart_image(self, labels, values) -> str:
        """
        Gera gráfico de radar 'Yawara Style' (Dark Red).
        Thread-safe via Lock.
        """
        # Protege a área crítica de desenho
        with _plt_lock:
            try:
                # Cria figura nova (Interface OO evita estado global sujo)
                fig = plt.figure(figsize=(5, 5))
                ax = fig.add_subplot(111, polar=True)
                
                N = len(labels)
                if N < 3: 
                    plt.close(fig)
                    return "" 
                
                # Tratamento de Texto (Quebra de linha para não encavalar)
                wrapped_labels = ["\n".join(textwrap.wrap(l, width=12)) for l in labels]
                
                # Fechar o loop do radar
                angles = np.linspace(0, 2 * np.pi, N, endpoint=False).tolist()
                values_loop = values + values[:1]
                angles_loop = angles + angles[:1]

                # Plot
                ax.plot(angles_loop, values_loop, color='#DC2626', linewidth=2, linestyle='solid')
                ax.fill(angles_loop, values_loop, color='#DC2626', alpha=0.25)

                # Estilo Clean
                ax.set_yticklabels([]) # Sem números radiais
                ax.set_xticks(angles)
                
                # Labels com margem extra (pad=24)
                ax.set_xticklabels(wrapped_labels, size=7, color="#475569", weight="bold") 
                ax.tick_params(axis='x', pad=24) 
                
                ax.grid(color='#E2E8F0', linestyle='--', linewidth=0.5)
                ax.spines['polar'].set_visible(False) 

                # Salvar
                buf = io.BytesIO()
                # Margem generosa para o texto não cortar
                plt.tight_layout(pad=4.0) 
                plt.savefig(buf, format='png', transparent=True, dpi=100, bbox_inches='tight', pad_inches=0.2)
                
                # Cleanup
                plt.close(fig)
                
                buf.seek(0)
                return base64.b64encode(buf.read()).decode('utf-8')

            except Exception as e:
                logger.error(f"Erro ao gerar gráfico: {e}")
                # Sempre fecha a figura em caso de erro para liberar memória
                plt.close('all') 
                return ""

html_report_service = HTMLReportService()