import json
import random
import os
from typing import Dict

# Configuração
OUTPUT_FILE = "app/resources/data/synthetic_dataset_large.json"
NUM_SAMPLES = 3000 # Aumentei para ter bastante dado

SUBJECTS = [
    "CALCULO_1", "CALCULO_2", "CALCULO_3", "FISICA_1", "FISICA_2", 
    "ALGORITMOS", "ESTRUTURA_DADOS", "QUIMICA", "DESENHO_TECNICO", 
    "GEOMETRIA_ANALITICA", "RESISTENCIA_MATERIAIS", "GESTAO_PROJETOS",
    "TERMODINAMICA", "MECANICA_FLUIDOS", "ELETRONICA"
]

NUCLEI = [
    "NÚCLEO DE HIDROGÊNIO", 
    "NÚCLEO DE COMBUSTÃO", 
    "NÚCLEO DE SISTEMAS EMBARCADOS", 
    "NÚCLEO DE AERODINÂMICA"
]

def pick_course_with_outliers(primary_course: str, outlier_chance=0.30) -> str:
    """
    30% de chance de o aluno estar no curso 'errado' mas ter o talento certo.
    """
    if random.random() < outlier_chance:
        other_courses = [
            "ENGENHARIA_COMPUTACAO", "ENGENHARIA_MECANICA", 
            "ENGENHARIA_ENERGIA", "ENGENHARIA_PRODUCAO", "ENGENHARIA_CIVIL"
        ]
        if primary_course in other_courses:
            other_courses.remove(primary_course)
        return random.choice(other_courses)
    return primary_course

def generate_student(archetype: str) -> Dict:
    history = []
    grade_bias = {}
    student_course = ""
    primary_nucleus = ""
    
    # --- ARQUÉTIPOS REBELDES ---
    
    if archetype == "EMBARCADOS_FAN": 
        # Pode ser um Mecânico que ama programar
        student_course = pick_course_with_outliers("ENGENHARIA_COMPUTACAO")
        grade_bias = {
            "ALGORITMOS": (9.0, 10),  # Notas EXCELENTES em lógica
            "ESTRUTURA_DADOS": (8.5, 10), 
            "ELETRONICA": (8, 10),
            "FISICA_2": (7, 9)
        }
        primary_nucleus = "NÚCLEO DE SISTEMAS EMBARCADOS"

    elif archetype == "COMBUSTAO_FAN": 
        student_course = pick_course_with_outliers("ENGENHARIA_MECANICA")
        grade_bias = {
            "TERMODINAMICA": (8.5, 10), 
            "FISICA_1": (7, 9), 
            "QUIMICA": (7, 9),
            "DESENHO_TECNICO": (6, 8)
        }
        primary_nucleus = "NÚCLEO DE COMBUSTÃO"

    elif archetype == "AERO_FAN": 
        student_course = pick_course_with_outliers("ENGENHARIA_MECANICA")
        grade_bias = {
            "MECANICA_FLUIDOS": (9, 10), 
            "FISICA_1": (8, 10), 
            "CALCULO_3": (8, 10),
            "DESENHO_TECNICO": (7, 9)
        }
        primary_nucleus = "NÚCLEO DE AERODINÂMICA"
        
    elif archetype == "HIDROGENIO_FAN": 
        student_course = pick_course_with_outliers("ENGENHARIA_ENERGIA")
        grade_bias = {
            "QUIMICA": (9, 10), 
            "TERMODINAMICA": (8, 10), 
            "FISICA_2": (8, 10)
        }
        primary_nucleus = "NÚCLEO DE HIDROGÊNIO"
        
    else: # RANDOM
        student_course = random.choice(["ENGENHARIA_CIVIL", "ENGENHARIA_PRODUCAO", "ENGENHARIA_ALIMENTOS"])
        grade_bias = {}
        primary_nucleus = random.choice(NUCLEI)

    # Gera histórico
    for subj in SUBJECTS:
        if subj in grade_bias:
            min_g, max_g = grade_bias[subj]
            grade = round(random.uniform(min_g, max_g), 1)
        else:
            grade = round(random.uniform(4.0, 7.5), 1) # Notas baixas no resto para destacar o talento
            
        if random.random() < 0.85: 
            history.append({"name": subj, "grade": grade, "workload": 60})

    outcomes = []
    # 95% de chance de sucesso se tiver as notas certas (a rede TEM que aprender isso)
    if random.random() < 0.95: 
        outcomes.append({
            "nucleus": primary_nucleus,
            "status": 1,
            "tech": {"delivery": 10},
            "social": {"proactivity": 10}
        })
    else:
        wrong = random.choice([n for n in NUCLEI if n != primary_nucleus])
        outcomes.append({"nucleus": wrong, "status": 0, "tech": {"delivery": 2}, "social": {"proactivity": 3}})

    return {
        "course": student_course,
        "semester_at_entry": random.randint(2, 6),
        "academic_history": history,
        "outcomes": outcomes
    }

def build_universe():
    print(f"🌪️ Gerando Universo CAÓTICO (30% Outliers)...")
    data = []
    
    # Gera 25% para cada tribo
    samples_per_arch = int(NUM_SAMPLES / 4)
    
    for arch in ["EMBARCADOS_FAN", "COMBUSTAO_FAN", "AERO_FAN", "HIDROGENIO_FAN"]:
        print(f"   -> Gerando tribo {arch} (com infiltrados)...")
        for _ in range(samples_per_arch):
            data.append(generate_student(arch))
            
    random.shuffle(data)
    
    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        
    print(f"✅ Universo Salvo em {OUTPUT_FILE}")

if __name__ == "__main__":
    build_universe()