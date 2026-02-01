# ==============================================================================
# 1. ESTILO (CSS) 
# ==============================================================================
PDF_VALENCE_CSS = """
@page {
    size: A4;
    margin: 1.5cm;
    @bottom-right {
        content: "YAWARA // Pág. " counter(page);
        font-size: 8pt;
        color: #999;
        font-family: sans-serif;
    }
}

body {
    font-family: 'Helvetica', 'Arial', sans-serif;
    font-size: 10pt;
    line-height: 1.4;
    color: #1a1a1a;
    margin: 0;
}

/* --- HEADER PRINCIPAL (Layout Tabela = Zero Quebra) --- */
table.header-layout {
    width: 100%;
    border-bottom: 4px solid #b71c1c; /* Vermelho Yawara */
    margin-bottom: 30px;
    padding-bottom: 10px;
}

.header-title h1 {
    margin: 0;
    font-size: 24pt;
    text-transform: uppercase;
    color: #000;
    letter-spacing: -1px;
}

.header-subtitle {
    color: #b71c1c;
    font-weight: bold;
    text-transform: uppercase;
    font-size: 10pt;
}

.header-meta {
    text-align: right;
    vertical-align: bottom;
    font-size: 9pt;
    color: #555;
}

.hash-box {
    background: #000;
    color: #fff;
    padding: 2px 6px;
    font-family: monospace;
    font-size: 8pt;
}

/* --- CARD DO TIME --- */
.squad-card {
    border: 1px solid #ccc;
    border-radius: 4px;
    margin-bottom: 25px;
    overflow: hidden;
    page-break-inside: avoid; /* Não quebra o time no meio */
    box-shadow: 0 3px 5px rgba(0,0,0,0.1);
}

/* FAIXA DE TÍTULO */
.squad-header {
    background-color: #1a1a1a;
    color: #fff;
    padding: 10px 15px;
    border-left: 8px solid #b71c1c; /* Detalhe Vermelho */
}

table.squad-header-layout {
    width: 100%;
}

.squad-name {
    font-size: 16pt;
    font-weight: 800;
    text-transform: uppercase;
}

.squad-metrics {
    text-align: right;
}

.metric {
    display: inline-block;
    margin-left: 15px;
    font-size: 9pt;
    font-weight: bold;
    color: #ddd;
}

.metric span {
    color: #fff;
    font-size: 11pt;
}

/* --- TABELA DE MEMBROS --- */
table.roster {
    width: 100%;
    border-collapse: collapse;
}

table.roster th {
    background-color: #f0f0f0;
    text-align: left;
    padding: 8px 15px;
    font-size: 8pt;
    text-transform: uppercase;
    color: #666;
    border-bottom: 1px solid #ddd;
}

table.roster td {
    padding: 10px 15px;
    border-bottom: 1px solid #eee;
    font-size: 10pt;
}

.member-id {
    display: block;
    font-size: 7pt;
    color: #888;
    font-family: monospace;
    margin-top: 2px;
}

/* --- XAI FOOTER --- */
table.xai-layout {
    width: 100%;
    background-color: #fcfcfc;
    border-top: 1px solid #ddd;
}

table.xai-layout td {
    padding: 12px 15px;
    vertical-align: top;
    width: 50%;
}

.xai-title {
    display: block;
    font-size: 8pt;
    font-weight: bold;
    text-transform: uppercase;
    margin-bottom: 6px;
    border-bottom: 2px solid #eee;
    padding-bottom: 2px;
}

.tag {
    display: inline-block;
    padding: 3px 6px;
    margin: 0 4px 4px 0;
    border-radius: 3px;
    font-size: 8pt;
    font-weight: 600;
}

.tag-good { background: #e8f5e9; color: #1b5e20; border: 1px solid #c8e6c9; }
.tag-bad { background: #ffebee; color: #b71c1c; border: 1px solid #ffcdd2; }
.tag-ok { background: #eee; color: #555; }
"""

# ==============================================================================
# 2. TEMPLATE HTML
# ==============================================================================
HTML_VALENCE_TEMPLATE = """
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
</head>
<body>

    <table class="header-layout">
        <tr>
            <td class="header-title">
                <h1>Relatório Valence</h1>
                <div class="header-subtitle">{{ bundle.title }}</div>
            </td>
            <td class="header-meta">
                <div>Emissão: {{ bundle.date }}</div>
                <div style="margin-top:4px;">Ref: <span class="hash-box">{{ bundle.hash }}</span></div>
            </td>
        </tr>
    </table>

    {% for squad in bundle.squads %}
    <div class="squad-card">
        
        <div class="squad-header">
            <table class="squad-header-layout">
                <tr>
                    <td class="squad-name">{{ squad.squad_name }}</td>
                    <td class="squad-metrics">
                        <span class="metric">POWER: <span>{{ squad.metrics.power_score }}</span></span>
                        <span class="metric">DIV: <span>{{ squad.metrics.diversity_score }}</span></span>
                        <span class="metric">IG: <span>{{ squad.metrics.iron_gate_mean }}</span></span>
                    </td>
                </tr>
            </table>
        </div>

        <table class="roster">
            <thead>
                <tr>
                    <th width="50%">Candidato</th>
                    <th width="20%">Semestre</th>
                    <th width="30%">Role Sugerida</th>
                </tr>
            </thead>
            <tbody>
                {% for member in squad.members %}
                <tr>
                    <td>
                        <strong>{{ member.name }}</strong>
                        <span class="member-id">{{ member.id }}</span>
                    </td>
                    <td>{{ member.role_focus.split(' ')[1] if 'Semestre' in member.role_focus else member.role_focus }}</td>
                    <td>{{ member.role_focus }}</td>
                </tr>
                {% endfor %}
            </tbody>
        </table>

        <table class="xai-layout">
            <tr>
                <td>
                    <span class="xai-title" style="color:#1b5e20; border-color:#c8e6c9;">Fortalezas</span>
                    {% for skill in squad.metrics.top_competencies %}
                        <span class="tag tag-good">{{ skill }}</span>
                    {% endfor %}
                </td>
                <td>
                    <span class="xai-title" style="color:#b71c1c; border-color:#ffcdd2;">Pontos de Atenção</span>
                    {% if squad.metrics.critical_gaps %}
                        {% for gap in squad.metrics.critical_gaps %}
                            <span class="tag tag-bad">{{ gap }}</span>
                        {% endfor %}
                    {% else %}
                        <span class="tag tag-ok">Time Balanceado</span>
                    {% endif %}
                </td>
            </tr>
        </table>

    </div>
    {% endfor %}

    <div style="text-align:center; font-size:8pt; color:#aaa; margin-top:40px;">
        Gerado pelo Yawara-YSNA (Valence Engine). Documento Confidencial.
    </div>

</body>
</html>
"""