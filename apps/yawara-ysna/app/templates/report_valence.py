# ==============================================================================
# 1. ESTILO (CSS) - TEMA YAWARA (Red & Black)
# ==============================================================================
PDF_VALENCE_CSS = """
@page {
    size: A4;
    margin: 1.5cm;
    @bottom-right {
        content: "Yawara MotoStudent | Pág. " counter(page);
        font-size: 8pt;
        color: #999;
        font-family: Helvetica, sans-serif;
    }
}

body {
    font-family: 'Helvetica', 'Arial', sans-serif;
    font-size: 10pt;
    line-height: 1.3;
    color: #111;
    margin: 0;
    padding: 0;
}

/* --- CABEÇALHO GERAL --- */
.header-container {
    /* Linha grossa vermelha em baixo para marcar o território */
    border-bottom: 4px solid #b71c1c; 
    padding-bottom: 15px;
    margin-bottom: 30px;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
}

.header-left h1 {
    margin: 0;
    font-size: 22pt;
    color: #1a1a1a; /* Preto quase absoluto */
    text-transform: uppercase;
    letter-spacing: -1px;
}

.header-left .subtitle {
    margin: 5px 0 0 0;
    font-size: 10pt;
    color: #b71c1c; /* Vermelho Yawara */
    font-weight: bold;
    text-transform: uppercase;
}

.header-right {
    text-align: right;
    font-size: 9pt;
    color: #555;
}

.hash-badge {
    background: #1a1a1a;
    color: #fff;
    padding: 3px 8px;
    border-radius: 2px;
    font-family: monospace;
    font-size: 8pt;
    border: 1px solid #000;
}

/* --- CARD DO TIME --- */
.squad-card {
    border: 1px solid #ddd;
    border-top: 0; /* O header já faz a borda superior */
    border-radius: 4px;
    margin-bottom: 30px;
    overflow: hidden;
    page-break-inside: avoid;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}

/* FAIXA DE TÍTULO (Onde brilha o Preto e Vermelho) */
.squad-header {
    background-color: #1a1a1a; /* Fundo Preto */
    color: white;
    padding: 12px 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    /* Detalhe estético: Borda esquerda vermelha grossa */
    border-left: 8px solid #d32f2f; 
}

.squad-title {
    font-size: 16pt;
    font-weight: 800; /* Extra Bold */
    text-transform: uppercase;
    letter-spacing: 1px;
    margin: 0;
}

/* Badges de Métricas no Header */
.metrics-row {
    display: flex;
    gap: 12px;
}

.metric-pill {
    background: rgba(255,255,255,0.1); /* Translucido no preto */
    padding: 5px 12px;
    border-radius: 2px;
    font-size: 9pt;
    font-weight: bold;
    border: 1px solid rgba(255,255,255,0.2);
}

/* Destaque para o Score Total em Vermelho */
.metric-pill.score {
    color: #ffcdd2; /* Vermelho claro para leitura no preto */
    border-color: #ef5350;
}

/* --- TABELA DE MEMBROS --- */
table.roster-table {
    width: 100%;
    border-collapse: collapse;
    margin: 0;
}

table.roster-table th {
    background-color: #f2f2f2;
    color: #444;
    font-size: 8pt;
    text-transform: uppercase;
    text-align: left;
    padding: 10px 20px;
    border-bottom: 2px solid #b71c1c; /* Linha vermelha separando header da tabela */
}

table.roster-table td {
    padding: 12px 20px;
    border-bottom: 1px solid #eee;
    font-size: 10pt;
    vertical-align: middle;
}

table.roster-table tr:nth-child(even) {
    background-color: #fafafa;
}

.member-id {
    display: block;
    font-size: 7.5pt;
    color: #888;
    margin-top: 2px;
    font-family: monospace;
}

/* --- RODAPÉ XAI (Análise) --- */
.xai-footer {
    background-color: #fff;
    border-top: 3px solid #eee;
    padding: 15px 20px;
    display: flex;
    gap: 30px;
}

.xai-column {
    flex: 1;
}

.xai-label {
    display: block;
    font-size: 9pt;
    font-weight: bold;
    text-transform: uppercase;
    margin-bottom: 8px;
    padding-bottom: 4px;
    border-bottom: 1px solid #ddd;
}

/* Tags de Competência - Ajustadas para sobriedade */
.tag {
    display: inline-block;
    padding: 3px 8px;
    border-radius: 2px;
    font-size: 8pt;
    margin-right: 5px;
    margin-bottom: 5px;
    font-weight: 600;
}

/* Verde mais escuro e sério */
.tag-strength { 
    background: #e8f5e9; 
    color: #1b5e20; 
    border: 1px solid #c8e6c9; 
}

/* Vermelho Yawara para Gaps */
.tag-gap { 
    background: #ffebee; 
    color: #b71c1c; 
    border: 1px solid #ffcdd2; 
}

.tag-neutral { 
    background: #f5f5f5; 
    color: #666; 
    border: 1px solid #e0e0e0; 
    font-style: italic; 
}
"""

# ==============================================================================
# 2. TEMPLATE HTML (Estrutura Mantida, Classes Ajustadas)
# ==============================================================================
HTML_VALENCE_TEMPLATE = """
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <title>Relatório de Forja - Yawara</title>
</head>
<body>

    <div class="header-container">
        <div class="header-left">
            <h1>Relatório da Forja</h1>
            <p class="subtitle">{{ bundle.title }}</p>
        </div>
        <div class="header-right">
            <div><strong>Emissão:</strong> {{ bundle.date }}</div>
            <div style="margin-top:5px;">
                <span class="hash-badge">HASH: {{ bundle.hash }}</span>
            </div>
        </div>
    </div>

    {% for squad in bundle.squads %}
    <div class="squad-card">
        
        <div class="squad-header">
            <div class="squad-title">{{ squad.squad_name }}</div>
            <div class="metrics-row">
                <span class="metric-pill score">⚡ POWER: {{ squad.metrics.power_score }}</span>
                <span class="metric-pill">🧩 DIV: {{ squad.metrics.diversity_score }}</span>
                <span class="metric-pill">🧠 IG: {{ squad.metrics.iron_gate_mean }}</span>
            </div>
        </div>

        <table class="roster-table">
            <thead>
                <tr>
                    <th width="45%">Candidato</th>
                    <th width="20%">Semestre</th>
                    <th width="35%">Role Sugerida</th>
                </tr>
            </thead>
            <tbody>
                {% for member in squad.members %}
                <tr>
                    <td>
                        <strong>{{ member.name }}</strong>
                        <span class="member-id">{{ member.id }}</span>
                    </td>
                    <td>
                        {% if 'Semestre' in member.role_focus %}
                            {{ member.role_focus.split(' ')[1] }}º Período
                        {% else %}
                            {{ member.role_focus }}
                        {% endif %}
                    </td>
                    <td>
                        {{ member.role_focus }}
                    </td>
                </tr>
                {% endfor %}
            </tbody>
        </table>

        <div class="xai-footer">
            <div class="xai-column">
                <span class="xai-label" style="color:#1b5e20; border-color:#c8e6c9;">
                    Competências Chave
                </span>
                {% for skill in squad.metrics.top_competencies %}
                    <span class="tag tag-strength">{{ skill }}</span>
                {% endfor %}
            </div>

            <div class="xai-column">
                <span class="xai-label" style="color:#b71c1c; border-color:#ffcdd2;">
                    Pontos de Atenção
                </span>
                {% if squad.metrics.critical_gaps|length > 0 %}
                    {% for gap in squad.metrics.critical_gaps %}
                        <span class="tag tag-gap">{{ gap }}</span>
                    {% endfor %}
                {% else %}
                    <span class="tag tag-neutral">Time Balanceado (Sem Gaps Críticos)</span>
                {% endif %}
            </div>
        </div>

    </div>
    {% endfor %}

    <div style="text-align:center; font-size:8pt; color:#aaa; margin-top:50px; font-family: monospace;">
        YAWARA-YSNA // VALENCE ENGINE V5.1 // CONFIDENCIAL
    </div>

</body>
</html>
"""