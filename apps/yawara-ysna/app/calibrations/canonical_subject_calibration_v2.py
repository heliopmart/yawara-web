import numpy as np
import random
import sys
import time
import os
from typing import List, Tuple, Dict, Any

# Métricas
from sklearn.metrics import precision_score, recall_score, f1_score

try:
    from app.core.config import settings
    # Importa a arquitetura correta (certifique-se que você atualizou o arquivo nn.py como pedi antes)
    from app.ml.canonical_subject_engine import CanonicalSubjectNN
    # Importa o treinador apenas para usar o carregador de dados
    from app.training.train_canonical_subject_ml_v2 import TrainingYsnaCanonicalV2
    from app.utils.semanticAugmenter import augmenter
except ImportError as e:
    print(f"[ERRO DE IMPORT] Verifique se você está na raiz do projeto: {e}")
    sys.exit(1)

# Cores para o terminal
class Colors:
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'

# ==============================================================================
# 1. GERADOR DE VALIDAÇÃO
# ==============================================================================
def generate_robust_validation_batch(dataset: List[Dict], size: int = 2000) -> Tuple[List[Tuple[str, str]], np.ndarray]:
    """
    Gera um batch projetado para testar o modelo.
    """
    pairs = []
    labels = [] 

    # Mapa de Famílias para Hard Negatives
    family_map = {}
    for item in dataset:
        root = item["canonical"].split("_")[0]
        if len(root) > 3: 
            if root not in family_map: family_map[root] = []
            family_map[root].append(item)

    conflict_families = [k for k, v in family_map.items() if len(v) >= 2]
    
    print(f"{Colors.OKBLUE}[DATASET] Gerando {size} pares de validação robusta...{Colors.ENDC}")

    # --- 1. POSITIVOS (MATCH) ---
    n_pos = size // 2
    for _ in range(n_pos):
        item = random.choice(dataset)
        txt_a = item["canonical"]
        
        # 80% das vezes pega uma variação existente, 20% faz augmentation
        if item["vars"] and random.random() > 0.2:
            txt_b = random.choice(item["vars"])
        else:
            txt_b = augmenter.augment(txt_a, profile="medium") 
            
        pairs.append((txt_a, txt_b))
        labels.append(1)

    # --- 2. NEGATIVOS "MALDOSOS" (HARD NEGATIVES) ---
    n_hard = size // 4
    for _ in range(n_hard):
        fam = random.choice(conflict_families)
        siblings = family_map[fam]
        
        if len(siblings) < 2: continue
        
        item_a, item_b = random.sample(siblings, 2)
        pairs.append((item_a["canonical"], item_b["canonical"]))
        labels.append(0)

    # --- 3. NEGATIVOS ALEATÓRIOS (EASY NEGATIVES) ---
    while len(pairs) < size:
        item_a = random.choice(dataset)
        item_b = random.choice(dataset)
        if item_a["canonical"] != item_b["canonical"]:
            pairs.append((item_a["canonical"], item_b["canonical"]))
            labels.append(0)

    # Embaralha
    combined = list(zip(pairs, labels))
    random.shuffle(combined)
    pairs[:], labels[:] = zip(*combined)

    return pairs, np.array(labels)

# ==============================================================================
# 2. CALIBRAÇÃO DO GATE
# ==============================================================================
def find_gate_threshold(model_wrapper, dataset):
    """
    Encontra o ponto de equilíbrio.
    """
    pairs, y_true = generate_robust_validation_batch(dataset, size=3000)
    
    texts_a = [p[0] for p in pairs]
    texts_b = [p[1] for p in pairs]
    
    print(f"{Colors.OKBLUE}[MODELO] Calculando embeddings...{Colors.ENDC}")
    # Usa o encoder extraído para gerar vetores
    vecs_a = model_wrapper.embed_batch(texts_a)
    vecs_b = model_wrapper.embed_batch(texts_b)
    
    # Similaridade de Cosseno (Já normalizado na saída do modelo, mas reforçamos)
    # A arquitetura V3 já tem L2 Normalize na última camada, então o dot product é cosseno.
    similarities = np.sum(vecs_a * vecs_b, axis=1)
    
    print("\n" + "="*60)
    print(f"{Colors.BOLD}   ANÁLISE DE GATE (Siamese CNN vs LLM) {Colors.ENDC}")
    print("="*60)
    print(f"{'THRESH':<8} | {'PRECISION':<10} | {'RECALL':<10} | {'LLM CALLS %':<12} | {'RISCO (FP)':<10}")
    print("-" * 60)

    best_thresh = 0.5
    target_precision = 0.98 
    
    candidates = []

    for t in np.arange(0.50, 1.00, 0.02):
        y_pred = (similarities >= t).astype(int)
        
        prec = precision_score(y_true, y_pred, zero_division=0)
        rec = recall_score(y_true, y_pred, zero_division=0)
        lost_matches = 1 - rec 
        fp_count = np.sum((y_pred == 1) & (y_true == 0))
        
        marker = ""
        if prec >= target_precision and rec > 0.1:
            marker = f"{Colors.OKGREEN}<-- SEGURO{Colors.ENDC}"
            candidates.append((t, f1_score(y_true, y_pred)))
            best_thresh = t
        
        print(f"{t:.2f}     | {prec:.2%}     | {rec:.2%}     | {lost_matches:.2%}       | {fp_count:<4} {marker}")

    if not candidates:
        print(f"\n{Colors.WARNING}[AVISO] Nenhum threshold atingiu precisão > {target_precision:.0%}. Usando melhor F1.{Colors.ENDC}")
        best_t = 0.0
        best_f1 = 0.0
        for t in np.arange(0.5, 0.99, 0.01):
            yp = (similarities >= t).astype(int)
            f1 = f1_score(y_true, yp)
            if f1 > best_f1:
                best_f1 = f1
                best_t = t
        return best_t
        
    return best_thresh

# ==============================================================================
# 3. INTERACTIVE DEBUGGER
# ==============================================================================
def interactive_mode(model_wrapper, threshold):
    print("\n" + "="*60)
    print(f"{Colors.HEADER}   MODO INTERATIVO (Digite 'sair' para encerrar)   {Colors.ENDC}")
    print(f"   Threshold Atual do Gate: {Colors.BOLD}{threshold:.2f}{Colors.ENDC}")
    print("="*60)
    
    while True:
        try:
            print("\n---------------------------------------------------")
            t1 = input(f"{Colors.BOLD}Frase A (Input Usuário): {Colors.ENDC}").strip()
            if t1.lower() in ['sair', 'exit']: break
            if not t1: continue
            
            t2 = input(f"{Colors.BOLD}Frase B (Candidato Banco): {Colors.ENDC}").strip()
            if not t2: continue

            # Embed
            v1 = model_wrapper.embed_single(t1)
            v2 = model_wrapper.embed_single(t2)
            
            sim = np.dot(v1, v2)
            
            status = ""
            color = ""
            if sim >= threshold:
                status = "AUTO-APPROVE (Rede Neural Garante)"
                color = Colors.OKGREEN
            else:
                status = "FALLBACK LLM (Dúvida / Rejeição)"
                color = Colors.WARNING
                
            print(f"\nSimilaridade: {Colors.BOLD}{sim:.4f}{Colors.ENDC}")
            print(f"Decisão:      {color}{status}{Colors.ENDC}")
            
        except KeyboardInterrupt:
            break
        except Exception as e:
            print(f"Erro: {e}")

# ==============================================================================
# MAIN
# ==============================================================================
if __name__ == "__main__":
    weights_path = settings.ML_CANONICAL_WEIGHTS_PATH
    
    print(f"{Colors.OKBLUE}[INIT] Carregando dados...{Colors.ENDC}")
    # Usa o próprio treinador para carregar os dados consolidados de forma segura
    trainer = TrainingYsnaCanonicalV2()
    full_dataset = trainer._load_and_consolidate_data()
    
    print(f"{Colors.OKBLUE}[INIT] Carregando modelo Siamese CNN...{Colors.ENDC}")
    # Instancia a arquitetura (já constrói o modelo no __init__)
    # REMOVIDO: vocab=..., pois a nova classe ignora e usa CHARS interno
    nn_wrapper = CanonicalSubjectNN(encoder_dim=128)
    
    # REMOVIDO: nn_wrapper.model.build((None, 64)) -> ISSO CAUSAVA O ERRO!
    
    print(f"[INIT] Carregando pesos de {weights_path}")
    try:
        # Carrega os pesos no modelo Siames (que contem o encoder dentro)
        nn_wrapper.model.load_weights(weights_path)
        print(f"{Colors.OKGREEN}[SUCESSO] Pesos carregados!{Colors.ENDC}")
    except Exception as e:
        print(f"{Colors.FAIL}[FATAL] Falha ao carregar pesos: {e}{Colors.ENDC}")
        sys.exit(1)

    # 3. Calibração
    suggested_threshold = find_gate_threshold(nn_wrapper, full_dataset)
    
    print(f"\n{Colors.OKGREEN}>>> THRESHOLD RECOMENDADO: {suggested_threshold:.2f} <<<{Colors.ENDC}")
    
    # 4. Teste Manual
    input(f"\nPressione ENTER para entrar no modo interativo...")
    interactive_mode(nn_wrapper, suggested_threshold)