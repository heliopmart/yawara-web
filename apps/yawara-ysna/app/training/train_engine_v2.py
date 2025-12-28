import json
import numpy as np
import tensorflow as tf
import os
from typing import List, Dict

from app.utils.db_loader_trainer import fetch_training_dataset
# Importa a arquitetura
from app.ml.architectures.nucleus_recommender_nn import build_deep_set_architecture

# --- CONFIG ---
MAX_SUBJECTS = 100
HASH_BINS_SUBJ = 5000
HASH_BINS_COURSE = 100
MODEL_PATH = "app/resources/models/engine_v2_synthetic.keras"
LABELS_PATH = "app/resources/models/engine_v2_labels.json"

# NÚCLEOS DISPONÍVEIS (Nosso Universo)
ALL_NUCLEI = ["NÚCLEO DE HIDROGÊNIO", "NÚCLEO DE COMBUSTÃO", 'NÚCLEO DE SISTEMAS EMBARCADOS', 'NÚCLEO DE AERODINÂMICA']

def get_synthetic_data():
    """
    Gera dados falsos que simulam o 'Row' complexo do banco de dados.
    Simula: Um aluno que entrou, teve um histórico X e uma performance real Y.
    """
    data = []
    
    # CASO 1: O "Gênio da Computação" (Bom em Software/Eletrônica)
    data.append({
        "course": "ENGENHARIA_COMPUTACAO",
        "semester_at_entry": 4,
        "academic_history": [
            {"name": "ALGORITMOS", "grade": 9.5, "workload": 60},
            {"name": "ESTRUTURA_DADOS", "grade": 9.0, "workload": 60},
            {"name": "CALCULO_1", "grade": 7.0, "workload": 80}
        ],
        # A REALIDADE DELE:
        "outcomes": [
            {
                "nucleus": "NÚCLEO DE SISTEMAS EMBARCADOS", 
                "status": 1, # Ativo
                "tech": {"delivery": 10, "reports": 5}, # Entregou muito
                "social": {"proatividade": 9.0, "participacao": 8.0} # Social Bom
            },
            {
                "nucleus": "NÚCLEO DE AERODINÂMICA",
                "status": 0, # Saiu/Inativo
                "tech": {"delivery": 0}, 
                "social": {"participacao": 4.0} # Foi mal em gestão
            }
        ]
    })

    # CASO 2: O "Mecânico Raiz" (Bom em Baja/Aero)
    data.append({
        "course": "ENGENHARIA_MECANICA",
        "semester_at_entry": 3,
        "academic_history": [
            {"name": "DESENHO_TECNICO", "grade": 9.0, "workload": 60},
            {"name": "FISICA_1", "grade": 8.5, "workload": 60},
            {"name": "CALCULO_1", "grade": 6.0, "workload": 80} # Passou raspando
        ],
        "outcomes": [
            {
                "nucleus": "NÚCLEO DE COMBUSTÃO", 
                "status": 1,
                "tech": {"delivery": 8, "reports": 2},
                "social": {"proatividade": 8.5}
            }
        ]
    })
    
    # CASO 3: O "Desistente" (Notas boas, mas realidade ruim)
    data.append({
        "course": "ENGENHARIA_ENERGIA",
        "semester_at_entry": 1,
        "academic_history": [{"name": "CALCULO_1", "grade": 9.0, "workload": 80}],
        "outcomes": [
            {
                "nucleus": "NÚCLEO DE COMBUSTÃO", 
                "status": 0, # Saiu rápido
                "tech": {"delivery": 0},
                "social": {"participacao": 2.0}
            }
        ]
    })

    return data

def calculate_training_target(outcomes: List[Dict], all_nuclei: List[str]) -> np.ndarray:
    """
    Transforma a REALIDADE COMPLEXA em um vetor de probabilidades (Target).
    
    Lógica:
    - Se status == 0 (Saiu): Target = 0.0
    - Se status == 1 (Ativo): 
        Target = (Norm(Social) + Norm(Tecnico)) / 2
    """
    target_vector = np.zeros(len(all_nuclei), dtype=float)
    
    for outcome in outcomes:
        nuc_name = outcome['nucleus']
        if nuc_name not in all_nuclei: continue
        
        idx = all_nuclei.index(nuc_name)
        
        # Lógica de "Juiz":
        if outcome['status'] == 0:
            score = 0.0 # Reprovado pela realidade
        else:
            # Simplificação da normalização para o exemplo sintético
            # Assumindo notas 0-10 e entregas max 10
            social_avg = np.mean(list(outcome['social'].values())) if outcome['social'] else 0
            tech_vol = sum(outcome['tech'].values())
            
            norm_social = min(social_avg / 10.0, 1.0)
            norm_tech = min(tech_vol / 10.0, 1.0) # Teto de 10 entregas
            
            score = (norm_social * 0.6) + (norm_tech * 0.4)
            
        target_vector[idx] = score

    return target_vector


def train_engine(): # Renomeei de train_synthetic para train_engine
    print("--- INICIANDO TREINAMENTO REAL DA ENGINE 2 ---")
    
    try:
        # 1. Carregar Dados via Interface do Banco
        raw_data = fetch_training_dataset() 
    except NotImplementedError:
        print("Conexão com Banco não implementada. Usando dados sintéticos de fallback...")
        from app.training.train_engine_v2 import get_synthetic_data # Fallback local
        raw_data = get_synthetic_data()

    print(f"Dados carregados: {len(raw_data)} exemplos.")

    # 2. Preparar Tensores (X e Y)
    X_names = np.full((len(raw_data), MAX_SUBJECTS), "", dtype=object)
    X_meta = np.zeros((len(raw_data), MAX_SUBJECTS, 2), dtype=float)
    X_sem = np.zeros((len(raw_data), 1), dtype=float)
    X_course = np.full((len(raw_data), 1), "", dtype=object)
    
    Y = np.zeros((len(raw_data), len(ALL_NUCLEI)), dtype=float)

    for i, row in enumerate(raw_data):
        # Prepara X (Input)
        hist = row['academic_history']
        for j, subj in enumerate(hist):
            if j >= MAX_SUBJECTS: break
            X_names[i, j] = subj['name']
            X_meta[i, j, 0] = subj['grade'] / 10.0      # Norm Nota
            X_meta[i, j, 1] = subj['workload'] / 100.0  # Norm Carga
            
        X_sem[i, 0] = row['semester_at_entry'] / 10.0
        X_course[i, 0] = row['course']

        # Prepara Y (Target - Transformando realidade em número)
        Y[i] = calculate_training_target(row['outcomes'], ALL_NUCLEI)

    print("Tensores montados. Exemplo de Target:", Y[0])

    # 3. Construir e Treinar
    model = build_deep_set_architecture(
        max_subjects=MAX_SUBJECTS,
        hashing_bins_subjects=HASH_BINS_SUBJ,
        hashing_bins_courses=HASH_BINS_COURSE,
        embedding_dim=64,
        nuclei_labels=ALL_NUCLEI
    )

    X_names_tensor = tf.constant(X_names, dtype=tf.string)
    X_course_tensor = tf.constant(X_course, dtype=tf.string)

    model.fit(
        x=[X_names_tensor, X_meta, X_sem, X_course_tensor],
        y=Y,
        epochs=10,
        verbose=1
    )

    # 4. Salvar Artefatos
    os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
    model.save(MODEL_PATH)
    
    with open(LABELS_PATH, "w") as f:
        json.dump(ALL_NUCLEI, f)
        
    print(f"Modelo salvo em {MODEL_PATH}")
    print(f"Labels salvos em {LABELS_PATH}")
    

def train_synthetic():
    print("--- INICIANDO TREINAMENTO SINTÉTICO DA ENGINE 2 ---")
    
    # 1. Carregar Dados
    raw_data = get_synthetic_data()
    print(f"Dados carregados: {len(raw_data)} exemplos.")

    # 2. Preparar Tensores (X e Y)
    X_names = np.full((len(raw_data), MAX_SUBJECTS), "", dtype=object)
    X_meta = np.zeros((len(raw_data), MAX_SUBJECTS, 2), dtype=float)
    X_sem = np.zeros((len(raw_data), 1), dtype=float)
    X_course = np.full((len(raw_data), 1), "", dtype=object)
    
    Y = np.zeros((len(raw_data), len(ALL_NUCLEI)), dtype=float)

    for i, row in enumerate(raw_data):
        # Prepara X (Input)
        hist = row['academic_history']
        for j, subj in enumerate(hist):
            if j >= MAX_SUBJECTS: break
            X_names[i, j] = subj['name']
            X_meta[i, j, 0] = subj['grade'] / 10.0      # Norm Nota
            X_meta[i, j, 1] = subj['workload'] / 100.0  # Norm Carga
            
        X_sem[i, 0] = row['semester_at_entry'] / 10.0
        X_course[i, 0] = row['course']

        # Prepara Y (Target - Transformando realidade em número)
        Y[i] = calculate_training_target(row['outcomes'], ALL_NUCLEI)

    print("Tensores montados. Exemplo de Target:", Y[0])

    # 3. Construir e Treinar
    model = build_deep_set_architecture(
        max_subjects=MAX_SUBJECTS,
        hashing_bins_subjects=HASH_BINS_SUBJ,
        hashing_bins_courses=HASH_BINS_COURSE,
        embedding_dim=64,
        nuclei_labels=ALL_NUCLEI
    )

    X_names_tensor = tf.constant(X_names, dtype=tf.string)
    X_course_tensor = tf.constant(X_course, dtype=tf.string)

    model.fit(
        x=[X_names_tensor, X_meta, X_sem, X_course_tensor],
        y=Y,
        epochs=10,
        verbose=1
    )

    # 4. Salvar Artefatos
    os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
    model.save(MODEL_PATH)
    
    with open(LABELS_PATH, "w") as f:
        json.dump(ALL_NUCLEI, f)
        
    print(f"Modelo salvo em {MODEL_PATH}")
    print(f"Labels salvos em {LABELS_PATH}")

if __name__ == "__main__":
    train_engine()