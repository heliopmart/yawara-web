import logging
from typing import List, Dict

from app.schemas.xai import XAIAnalysisResult, FeatureImpact
from app.schemas.report import CandidateReportBundle, NucleusReportContext, FeedbackItem

logger = logging.getLogger("yawara.services.report_analyst")

class ReportAnalyst:
    """
    V3: Analista Pedagógico Avançado.
    Gera arquétipos de aluno e prepara telemetria completa.
    """

    def generate_report_bundle(self, candidate_data: Dict, xai_results: List[Dict]) -> CandidateReportBundle:
        # 1. Ordena resultados por score
        sorted_results = sorted(xai_results, key=lambda x: x.get('final_score', 0), reverse=True)
        
        reports = []
        total_affinity = 0
        approved_nuclei = 0

        # Processa cada núcleo
        for res in sorted_results:
            nucleus_ctx = self._analyze_nucleus(res)
            reports.append(nucleus_ctx)
            total_affinity += nucleus_ctx.affinity_percentage
            if nucleus_ctx.status_label == "ELEGÍVEL":
                approved_nuclei += 1

        # 2. Definição do ARQUÉTIPO (Persona do Aluno)
        avg_affinity = total_affinity / len(reports) if reports else 0
        archetype_title, archetype_desc = self._define_archetype(approved_nuclei, avg_affinity, reports)

        overall_text = (
            f"O candidato apresenta um perfil classificado como <b>{archetype_title.upper()}</b>. "
            f"{archetype_desc} "
            f"A média global de afinidade técnica é de {avg_affinity:.1f}%, indicando "
            f"{'uma forte base multidisciplinar' if avg_affinity > 60 else 'oportunidades claras de especialização'}."
        )

        return CandidateReportBundle(
            candidate_name=candidate_data.get("name", "Candidato").upper(),
            candidate_id=candidate_data.get("id", "").split('-')[0].upper(), # ID curto
            overall_observation=overall_text,
            nuclei_reports=reports
        )

    def _define_archetype(self, approved_count: int, avg_affinity: float, reports: List) -> tuple:
        """Define a 'Classe' do aluno baseada nos dados."""
        if approved_count >= 2:
            return ("Polímata Técnico", "Demonstra versatilidade excepcional, com aptidão para atuar em múltiplos subsistemas críticos. Um ativo estratégico para integração.")
        elif approved_count == 1:
            best = next(r for r in reports if r.status_label == "ELEGÍVEL")
            return ("Especialista Focado", f"Apresenta vocação clara e profundidade técnica direcionada ao {best.nucleus_name}. Perfil ideal para liderança técnica vertical.")
        elif avg_affinity > 50:
            return ("Analista em Potencial", "Possui base teórica sólida, mas requer direcionamento específico para atingir os critérios de corte dos núcleos de alta performance.")
        else:
            return ("Estudante em Formação", "Ainda em fase inicial de construção de competências. O foco deve ser o fortalecimento das disciplinas de ciclo básico.")

    def _analyze_nucleus(self, xai_data: Dict) -> NucleusReportContext:
        name = xai_data['target_nucleus']
        score = xai_data['final_score']
        threshold = xai_data['threshold']
        all_features = xai_data['features_analysis'] 

        # A. Status & Cores (Paleta Yawara Clean)
        # Verde Suave para Aprovação, Vermelho Yawara para Reprovação
        is_approved = score >= threshold
        affinity = min(int(score * 100), 100)
        
        if is_approved:
            label = "APROVADO"
            color = "#166534" 
            main_obs = "Aderência técnica satisfatória aos requisitos do subsistema."
        else:
            label = "NÃO ELEGÍVEL"
            color = "#DC2626"
            dist = threshold - score
            if dist < 0.1:
                main_obs = "Reprovação marginal. O perfil é promissor, mas faltou consistência em pontos chave."
            else:
                main_obs = "Déficit técnico significativo identificado. Requer plano de recuperação."

        # B. Roteiro de Estudos (Top Insights)
        study_roadmap = []
        # Filtra apenas os críticos para o texto de destaque
        critical_weaknesses = [f for f in all_features if f['status'] == 'WEAKNESS']
        top_strengths = [f for f in all_features if f['status'] == 'STRENGTH']

        # Adiciona até 3 fraquezas críticas
        for w in critical_weaknesses[:3]:
            gain_pct = w['potential_gain'] * 10 # Escala para 0-10 visual
            msg = f"Gargalo de Performance. Impacto negativo projetado de {gain_pct:.1f}pts no score final."
            study_roadmap.append(FeedbackItem(subject=w['feature_name'], message=msg, type='WEAKNESS', icon='alert'))

        # Adiciona 1 força para balancear
        if top_strengths:
            s = top_strengths[0]
            study_roadmap.append(FeedbackItem(subject=s['feature_name'], message="Pilar de sustentação do score.", type='STRENGTH', icon='check'))

        # C. Dados Completos para Tabela e Gráfico
        # Para o Gráfico (Radar), pegamos Top 4 Mais Impactantes (Positivos ou Negativos) para dar a forma do perfil
        sorted_by_impact = sorted(all_features, key=lambda x: abs(x['importance_score']), reverse=True)
        chart_features = sorted_by_impact[:4]
        
        # Para a Tabela, mandamos TUDO, mas ordenado por Relevância
        full_list_features = sorted_by_impact 

        # Prepara labels limpas
        chart_labels = [f['feature_name'][:15].replace('_', ' ').title() for f in chart_features]
        chart_values = [f['input_value'] for f in chart_features] # Nota 0-10
        
        # Mapeia cores do gráfico (Cinza para normal, Vermelho para gap)
        chart_colors = ["#DC2626" if f['status'] == 'WEAKNESS' else "#475569" for f in chart_features]

        return NucleusReportContext(
            nucleus_name=name.upper(),
            status_label=label,
            status_color=color,
            affinity_percentage=affinity,
            main_observation=main_obs,
            study_roadmap=study_roadmap, # Destaques
            chart_labels=chart_labels,   # Dados Radar
            chart_values=chart_values,
            chart_colors=chart_colors,
            full_telemetry=full_list_features 
        )

report_analyst = ReportAnalyst()