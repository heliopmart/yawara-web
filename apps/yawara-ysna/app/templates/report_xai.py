PDF_XAI_CSS = """
@page { size: A4; margin: 0; }
body { font-family: 'Helvetica', sans-serif; margin: 0; padding: 0; box-sizing: border-box; background-color: #fff; color: #0F172A; }

/* Cores Yawara */
.bg-yawara-black { background-color: #0F172A; color: white; }
.bg-yawara-red { background-color: #DC2626; color: white; }
.text-yawara-red { color: #DC2626; }
.text-yawara-gray { color: #64748B; }
.bg-gray-50 { background-color: #F8FAFC; }
.border-b { border-bottom: 1px solid #E2E8F0; }

/* Layout Utilities */
.p-12 { padding: 3rem; }
.p-8 { padding: 2rem; }
.mb-4 { margin-bottom: 1rem; }
.mb-8 { margin-bottom: 2rem; }
.flex { display: flex; }
.justify-between { justify-content: space-between; }
.items-center { align-items: center; }
.grid { display: grid; }
.grid-cols-12 { grid-template-columns: repeat(12, 1fr); }
.col-span-5 { grid-column: span 5; }
.col-span-7 { grid-column: span 7; }
.gap-8 { gap: 2rem; }

/* Content Table */
.content-table { margin-top: 30px; width: 100%; }

/* Typography */
.text-4xl { font-size: 2.25rem; font-weight: 700; }
.text-2xl { font-size: 1.5rem; font-weight: 700; }
.text-xl { font-size: 1.25rem; font-weight: 700; }
.text-sm { font-size: 0.875rem; }
.text-xs { font-size: 0.75rem; }
.font-bold { font-weight: 700; }
.uppercase { text-transform: uppercase; }
.tracking-widest { letter-spacing: 0.1em; }
.leading-relaxed { line-height: 1.625; }

/* Components */
.badge { padding: 4px 8px; border-radius: 4px; font-weight: bold; font-size: 0.7rem; color: white; }
.page-break { page-break-before: always; }

/* --- TABLE FIXES (IMPORTANTE PARA PDF) --- */
table { width: 100%; border-collapse: collapse; font-size: 0.8rem; margin-bottom: 20px; }

/* Garante que o cabeçalho se repita se a tabela quebrar de página */
thead { display: table-header-group; } 

/* Evita que uma linha seja cortada ao meio na quebra de página */
tr { page-break-inside: avoid; } 

th { text-align: left; padding: 10px 8px; background-color: #F1F5F9; color: #475569; text-transform: uppercase; font-size: 0.65rem; font-weight: bold; border-bottom: 2px solid #E2E8F0; }
td { padding: 12px 8px; border-bottom: 1px solid #F1F5F9; vertical-align: middle; }

.progress-track { background-color: #E2E8F0; height: 6px; border-radius: 3px; width: 100%; overflow: hidden; }
.progress-fill { height: 100%; }

/* Footer */
footer { font-size: 0.7rem; color: #94A3B8; width: 100%; text-align: center; padding: 20px; position: absolute; bottom: 0; }
"""

HTML_XAI_TEMPLATE = """
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <title>Relatório Yawara</title>
    {% if not pdf_mode %}
    <script src="https://cdn.tailwindcss.com"></script>
    {% endif %}
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap');
        body { font-family: 'Inter', sans-serif; }
    </style>
</head>
<body class="{% if not pdf_mode %}bg-gray-100 py-10{% endif %}">

    <div class="max-w-4xl mx-auto bg-white shadow-xl overflow-hidden print:shadow-none">
        
        <header class="bg-yawara-black p-12 flex justify-between items-end">
            <div>
                <h1 class="text-4xl font-bold mb-2">RELATÓRIO TÉCNICO</h1>
                <p class="text-yawara-500 text-sm uppercase tracking-widest font-bold opacity-70">Yawara System Neural Architecture</p>
            </div>
            <div class="text-right" style="text-align: right;">
                <p class="text-xs mb-1 opacity-50 uppercase">Candidato</p>
                <h2 class="text-xl font-bold">{{ bundle.candidate_name }}</h2>
                <p class="text-sm font-mono opacity-50">{{ bundle.candidate_id }}</p>
            </div>
        </header>

        <section class="p-12 border-b">
            <h3 class="text-xs font-bold text-yawara-red uppercase tracking-widest mb-4">Diagnóstico do Sistema</h3>
            <div class="bg-gray-50 p-6 border-l-4" style="border-left-color: #DC2626;">
                <p class="text-gray-700 leading-relaxed text-justify text-sm">
                    {{ bundle.overall_observation }}
                </p>
            </div>
        </section>

        {% for nucleus in bundle.nuclei_reports %}
        <section class="p-12 {% if not loop.first %}page-break{% endif %}">
            
            <div class="flex justify-between items-center mb-8 border-b" style="padding-bottom: 1rem; border-bottom: 2px solid #F1F5F9;">
                <h2 class="text-2xl font-bold text-yawara-black uppercase">{{ nucleus.nucleus_name }}</h2>
                <span class="badge" style="background-color: {{ nucleus.status_color }};">
                    {{ nucleus.status_label }}
                </span>
            </div>

            <div class="grid grid-cols-12 gap-8 mb-8">
                
                <div class="col-span-5" style="text-align: center; display: flex; justify-content: center; align-items: start;">
                    {% if pdf_mode and nucleus.chart_b64 %}
                        <img src="data:image/png;base64,{{ nucleus.chart_b64 }}" style="width: 100%; max-width: 320px;">
                    {% else %}
                        <canvas id="chart-{{ loop.index }}" width="280" height="280"></canvas>
                        <p class="text-xs text-center text-gray-400 mt-2">Visualização Interativa</p>
                    {% endif %}
                </div>

                <div class="col-span-7">
                    <h4 class="text-xs font-bold text-yawara-black uppercase mb-4">Análise de Gaps</h4>
                    
                    <div class="space-y-4">
                        {% for item in nucleus.study_roadmap %}
                        <div class="flex items-start mb-4">
                            <div style="min-width: 25px; margin-right: 10px;">
                                {% if item.type == 'WEAKNESS' %}
                                    <span style="color: #DC2626; font-weight: bold; font-size: 1.2rem;">!</span>
                                {% else %}
                                    <span style="color: #166534; font-weight: bold; font-size: 1.2rem;">✓</span>
                                {% endif %}
                            </div>
                            <div>
                                <h5 class="text-sm font-bold text-gray-900">{{ item.subject }}</h5>
                                <p class="text-xs text-yawara-gray leading-relaxed">{{ item.message }}</p>
                            </div>
                        </div>
                        {% endfor %}
                    </div>
                </div>
            </div>

            <div class="content-table">
                <h4 class="text-xs font-bold text-yawara-black uppercase tracking-widest mb-4">Telemetria Completa</h4>
                <table>
                    <thead>
                        <tr>
                            <th width="40%">Disciplina</th>
                            <th width="15%" style="text-align: center;">Nota</th>
                            <th width="30%">Impacto no Score</th>
                            <th width="15%" style="text-align: right;">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {% for feat in nucleus.full_telemetry %}
                        <tr>
                            <td class="font-bold text-gray-700">
                                {{ feat.feature_name | replace('_', ' ') | title }}
                            </td>
                            
                            <td style="text-align: center; font-weight: 600; color: #334155;">
                                {{ "%.1f"|format(feat.input_value) }}
                            </td>
                            
                            <td>
                                <div class="progress-track">
                                    {% set bar_width = (feat.importance_score | abs) * 100 %}
                                    {% set bar_color = '#DC2626' if feat.status == 'WEAKNESS' else '#0F172A' %}
                                    <div class="progress-fill" style="width: {{ [bar_width, 100] | min }}%; background-color: {{ bar_color }};"></div>
                                </div>
                            </td>
                            <td style="text-align: right;">
                                {% if feat.status == 'WEAKNESS' %}
                                    <span class="text-xs font-bold text-yawara-red bg-red-50 px-2 py-1 rounded">ATENÇÃO</span>
                                {% else %}
                                    <span class="text-xs text-gray-400">NORMAL</span>
                                {% endif %}
                            </td>
                        </tr>
                        {% endfor %}
                    </tbody>
                </table>
            </div>

        </section>
        {% endfor %}

        <footer class="p-8 text-center border-t text-xs text-gray-400 bg-gray-50">
            Gerado via Y-SNA (Yawara System Neural Architecture).<br>
            Universidade Federal da Grande Dourados.
        </footer>

    </div>

    {% if not pdf_mode %}
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script>
        {% for nucleus in bundle.nuclei_reports %}
        new Chart(document.getElementById('chart-{{ loop.index }}'), {
            type: 'radar',
            data: {
                labels: {{ nucleus.chart_labels | tojson }},
                datasets: [{
                    label: 'Perfil',
                    data: {{ nucleus.chart_values | tojson }},
                    backgroundColor: 'rgba(220, 38, 38, 0.2)',
                    borderColor: '#DC2626',
                    pointBackgroundColor: '#DC2626',
                    borderWidth: 2
                }]
            },
            options: {
                scales: { r: { suggestedMin: 0, suggestedMax: 10, ticks: { display: false } } },
                plugins: { legend: { display: false } }
            }
        });
        {% endfor %}
    </script>
    {% endif %}
</body>
</html>
"""