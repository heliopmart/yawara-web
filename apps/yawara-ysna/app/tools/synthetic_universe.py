import json
import random
import os
from typing import Dict

# Configuração
OUTPUT_FILE = "app/resources/data/synthetic_dataset_large.json"
NUM_SAMPLES = 2000 

# Matérias do Curso
SUBJECTS = [
    "CALCULO_1", "CALCULO_2", "CALCULO_3", "FISICA_1", "FISICA_2", 
    "ALGORITMOS", "ESTRUTURA_DADOS", "QUIMICA", "DESENHO_TECNICO", 
    "GEOMETRIA_ANALITICA", "RESISTENCIA_MATERIAIS", "GESTAO_PROJETOS",
    "TERMODINAMICA", "MECANICA_FLUIDOS", "ELETRONICA"
]

# NÚCLEOS (Apenas os 4 Solicitados)
NUCLEI = [
    "NÚCLEO DE HIDROGÊNIO", 
    "NÚCLEO DE COMBUSTÃO", 
    "NÚCLEO DE SISTEMAS EMBARCADOS", 
    "NÚCLEO DE AERODINÂMICA"
]

def generate_student(archetype: str) -> Dict:
    history = []
    grade_bias = {}
    student_course = "ENGENHARIA_GERAL"
    primary_nucleus = ""
    
    # --- DEFINIÇÃO DE ARQUÉTIPOS ---
    
    if archetype == "EMBARCADOS_FAN": 
        # Computação: Lógica + Eletrônica + Física 2 (Eletromag)
        student_course = "ENGENHARIA_COMPUTACAO"
        grade_bias = {
            "ALGORITMOS": (8.5, 10), 
            "ESTRUTURA_DADOS": (8, 10), 
            "ELETRONICA": (8, 10),
            "FISICA_2": (7, 9)
        }
        primary_nucleus = "NÚCLEO DE SISTEMAS EMBARCADOS"

    elif archetype == "COMBUSTAO_FAN": 
        # Mecânica "Quente": Termodinâmica + Química + Motores
        student_course = "ENGENHARIA_MECANICA"
        grade_bias = {
            "TERMODINAMICA": (8.5, 10), 
            "FISICA_1": (7, 9), 
            "QUIMICA": (7, 9), 
            "DESENHO_TECNICO": (6, 8)
        }
        primary_nucleus = "NÚCLEO DE COMBUSTÃO"

    elif archetype == "AERO_FAN": 
        # Mecânica "Fluida": Fluidos + Cálculo 3 + Física 1
        student_course = "ENGENHARIA_MECANICA"
        grade_bias = {
            "MECANICA_FLUIDOS": (9, 10), 
            "FISICA_1": (8, 10), 
            "CALCULO_3": (8, 10), 
            "DESENHO_TECNICO": (7, 9)
        }
        primary_nucleus = "NÚCLEO DE AERODINÂMICA"
        
    elif archetype == "HIDROGENIO_FAN": 
        # Energia/Química: Química Pesada + Termodinâmica
        student_course = "ENGENHARIA_ENERGIA"
        grade_bias = {
            "QUIMICA": (9, 10), 
            "TERMODINAMICA": (8, 10), 
            "FISICA_2": (8, 10)
        }
        primary_nucleus = "NÚCLEO DE HIDROGÊNIO"
        
    else: # RANDOM
        # Alunos perdidos (Civil, Produção, Alimentos)
        student_course = random.choice(["ENGENHARIA_CIVIL", "ENGENHARIA_PRODUCAO", "ENGENHARIA_ALIMENTOS"])
        grade_bias = {}
        primary_nucleus = random.choice(NUCLEI)

    # Gera histórico escolar
    for subj in SUBJECTS:
        if subj in grade_bias:
            min_g, max_g = grade_bias[subj]
            grade = round(random.uniform(min_g, max_g), 1)
        else:
            grade = round(random.uniform(5.0, 8.0), 1) # Notas medianas no resto
            
        # 85% de chance de ter feito a matéria
        if random.random() < 0.85: 
            history.append({
                "name": subj,
                "grade": grade,
                "workload": 60
            })

    # Gera o Outcome (Target)
    outcomes = []
    
    # Sucesso no núcleo definido (90% de coerência)
    if random.random() < 0.90: 
        outcomes.append({
            "nucleus": primary_nucleus,
            "status": 1,
            "tech": {"delivery": random.randint(7, 10), "reports": random.randint(7, 10)},
            "social": {"proactivity": random.randint(7, 10)}
        })
    else:
        # Ruído (entrou no núcleo errado)
        wrong = random.choice([n for n in NUCLEI if n != primary_nucleus])
        outcomes.append({
            "nucleus": wrong,
            "status": 0,
            "tech": {"delivery": 2},
            "social": {"proactivity": 3}
        })

    return {
        "course": student_course,
        "semester_at_entry": random.randint(2, 6),
        "academic_history": history,
        "outcomes": outcomes
    }

def build_universe():
    print(f"🌌 Criando Universo Sintético (4 NÚCLEOS) com {NUM_SAMPLES} alunos...")
    data = []
    
    archetypes = [
        "EMBARCADOS_FAN", 
        "COMBUSTAO_FAN", 
        "AERO_FAN", 
        "HIDROGENIO_FAN"
    ]
    
    # Matemática do Balanceamento:
    # 20% Random (Ruído)
    # 80% Dividido igualmente entre os 4 Arquétipos (20% cada)
    
    samples_random = int(NUM_SAMPLES * 0.20)
    samples_per_arch = int((NUM_SAMPLES - samples_random) / 4)
    
    for arch in archetypes:
        print(f"   -> Gerando {samples_per_arch} alunos para {arch}...")
        for _ in range(samples_per_arch):
            data.append(generate_student(arch))
            
    print(f"   -> Gerando {samples_random} alunos aleatórios...")
    for _ in range(samples_random):
        data.append(generate_student("RANDOM"))
        
    # Embaralha
    random.shuffle(data)
        
    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        
    print(f"✅ Universo salvo em: {OUTPUT_FILE}")

if __name__ == "__main__":
    build_universe()