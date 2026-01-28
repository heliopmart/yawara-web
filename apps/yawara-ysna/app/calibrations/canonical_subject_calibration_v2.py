import numpy as np
import random
import sys
import time
from typing import List, Tuple, Dict, Any

# Métricas
from sklearn.metrics import precision_score, recall_score, f1_score, confusion_matrix

# Imports do seu projeto (mantendo a estrutura que você já tem)
try:
    from app.core.config import settings
    from app.ml.architectures.canonical_subject_nn import CanonicalSubjectNN
    from app.training.train_canonical_subject_ml_v2 import TrainingYsnaCanonical
    from app.utils.semanticAugmenter import augmenter
except ImportError as e:
    print(f"[ERRO DE IMPORT] Verifique se você está na raiz do projeto: {e}")
    sys.exit(1)

# Cores para o terminal (Frescura necessária para leitura)
class Colors:
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'

# ==============================================================================
# 1. GERADOR DE TORTURA (DATASET)
# ==============================================================================
def generate_robust_validation_batch(dataset: List[Dict], size: int = 2000) -> Tuple[List[Tuple[str, str]], np.ndarray]:
    """
    Gera um batch projetado para falhar.
    - 40% Positivos Fáceis (Mesma string, typos leves)
    - 10% Positivos Difíceis (Sinônimos distantes, Augmentation Pesada)
    - 25% Negativos "Maldosos" (Mesma família: Calc I vs Calc II)
    - 25% Negativos Aleatórios (Física vs Direito)
    """
    pairs = []
    labels = [] 

    # Mapa de Famílias para Hard Negatives
    family_map = {}
    for item in dataset:
        # Tenta agrupar por prefixo (ex: 'CALCULO_')
        root = item["canonical"].split("_")[0]
        if len(root) > 3: # Ignora roots muito curtos
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
            txt_b = augmenter.augment(txt_a, profile="medium") # Augmentation on the fly
            
        pairs.append((txt_a, txt_b))
        labels.append(1)

    # --- 2. NEGATIVOS "MALDOSOS" (HARD NEGATIVES) ---
    n_hard = size // 4
    for _ in range(n_hard):
        # Pega uma família que tem irmãos (ex: Calculo I, II, III)
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

    # Embaralha tudo
    combined = list(zip(pairs, labels))
    random.shuffle(combined)
    pairs[:], labels[:] = zip(*combined)

    return pairs, np.array(labels)

# ==============================================================================
# 2. CALIBRAÇÃO DO GATE
# ==============================================================================
def find_gate_threshold(encoder, dataset):
    """
    Encontra o ponto de equilíbrio financeiro/técnico.
    """
    pairs, y_true = generate_robust_validation_batch(dataset, size=3000)
    
    # Extrai textos
    texts_a = [p[0] for p in pairs]
    texts_b = [p[1] for p in pairs]
    
    print(f"{Colors.OKBLUE}[MODELO] Calculando embeddings...{Colors.ENDC}")
    vecs_a = encoder.embed_batch(texts_a)
    vecs_b = encoder.embed_batch(texts_b)
    
    # Normalização L2 (Segurança extra)
    norms_a = np.linalg.norm(vecs_a, axis=1, keepdims=True)
    norms_b = np.linalg.norm(vecs_b, axis=1, keepdims=True)
    vecs_a = vecs_a / (norms_a + 1e-9)
    vecs_b = vecs_b / (norms_b + 1e-9)
    
    # Similaridade de Cosseno (-1 a 1)
    similarities = np.sum(vecs_a * vecs_b, axis=1)
    
    print("\n" + "="*60)
    print(f"{Colors.BOLD}   ANÁLISE DE GATE (NEURAL NET vs LLM) {Colors.ENDC}")
    print("="*60)
    print(f"{'THRESH':<8} | {'PRECISION':<10} | {'RECALL':<10} | {'LLM CALLS %':<12} | {'RISCO (FP)':<10}")
    print("-" * 60)

    best_thresh = 0.5
    target_precision = 0.98 # Queremos confiar muito para não chamar a LLM errado
    
    candidates = []

    # Varre thresholds de 0.50 até 0.99
    for t in np.arange(0.50, 1.00, 0.02):
        y_pred = (similarities >= t).astype(int)
        
        prec = precision_score(y_true, y_pred, zero_division=0)
        rec = recall_score(y_true, y_pred, zero_division=0)
        
        # LLM Calls: Tudo que for rejeitado (0) no gate, teoricamente passaria por revisão 
        # (se assumirmos que o sistema tenta achar algo).
        # Na prática, 'Recall' baixo significa que a rede diz "Não sei" para coisas que ERAM matches.
        # Esses casos vão para a LLM ou são perdidos.
        lost_matches = 1 - rec 
        
        # Falsos Positivos (Erro Crítico): A rede disse SIM, mas era NÃO.
        # Isso contamina seu banco de dados.
        fp_count = np.sum((y_pred == 1) & (y_true == 0))
        
        # Marcador visual para o melhor candidato
        marker = ""
        if prec >= target_precision and rec > 0.1:
            marker = f"{Colors.OKGREEN}<-- SEGURO{Colors.ENDC}"
            candidates.append((t, f1_score(y_true, y_pred)))
            best_thresh = t
        
        print(f"{t:.2f}     | {prec:.2%}     | {rec:.2%}     | {lost_matches:.2%}       | {fp_count:<4} {marker}")

    # Se não achou nenhum perfeito, pega o com melhor F1
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
def interactive_mode(encoder, threshold):
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
            v1 = encoder.embed_batch([t1])
            v2 = encoder.embed_batch([t2])
            
            # Normalize
            v1 = v1 / np.linalg.norm(v1)
            v2 = v2 / np.linalg.norm(v2)
            
            sim = np.sum(v1 * v2)
            
            # Veredito
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
            
# ==============================================================================
# MAIN
# ==============================================================================
if __name__ == "__main__":
    weights_path = settings.ML_CANONICAL_WEIGHTS_PATH
    
    # 1. Carrega Dados
    print(f"{Colors.OKBLUE}[INIT] Carregando dataset de treino para gerar validação...{Colors.ENDC}")
    trainer = TrainingYsnaCanonical()
    full_dataset = trainer._handle_load_datasets()
    
    # 2. Carrega Modelo
    print(f"{Colors.OKBLUE}[INIT] Carregando modelo...{Colors.ENDC}")
    encoder = CanonicalSubjectNN(vocab="ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 ", encoder_dim=128)
    encoder.model.build((None, 64)) 
    encoder.model.load_weights(weights_path)
    print(f"[INIT] Pesos carregados de {weights_path}")

    # 3. Calibração Automática
    suggested_threshold = find_gate_threshold(encoder, full_dataset)
    
    print(f"\n{Colors.OKGREEN}>>> THRESHOLD RECOMENDADO PARA O GATE: {suggested_threshold:.2f} <<<{Colors.ENDC}")
    print("Este valor tenta garantir que você NÃO aprove lixo automaticamente.")
    
    # 4. Teste Manual
    input(f"\nPressione ENTER para entrar no modo de teste manual...")
    interactive_mode(encoder, suggested_threshold)