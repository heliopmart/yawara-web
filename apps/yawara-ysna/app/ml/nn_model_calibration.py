import numpy as np
import tensorflow as tf
import random
from sklearn.metrics import precision_score, recall_score, f1_score
from app.ml.canonical_subject_nn import CanonicalSubjectNN
from app.training.train_encoder_ml import TRAINING_SEEDS, apply_noise


def generate_validation_batch(size=500):
    """
    Gera um conjunto de validação balanceado (50% pares iguais, 50% pares diferentes).
    Diferente do treino, aqui precisamos explicitamente dos pares NEGATIVOS para testar o 'NÃO'.
    """
    pairs = []
    labels = [] # 1 = Igual (Match), 0 = Diferente (No Match)

    # 1. Gerar Pares Positivos (A rede DEVE juntar)
    # Ex: "Cálculo 1" e "Calc. Dif. Integral I"
    for _ in range(size // 2):
        concept = random.choice(TRAINING_SEEDS)
        anchor = concept["canonical"]
        # Pega uma variação e aplica ruído pesado
        positive = apply_noise(random.choice(concept["vars"]))
        
        pairs.append((anchor, positive))
        labels.append(1)

    # 2. Gerar Pares Negativos (A rede DEVE separar)
    # O desafio: Pegar conceitos diferentes que parecem iguais textualmente.
    # Ex: "Cálculo 1" e "Cálculo 2"
    for _ in range(size // 2):
        concept_a = random.choice(TRAINING_SEEDS)
        concept_b = random.choice(TRAINING_SEEDS)
        
        # Garante que são conceitos diferentes
        while concept_a["canonical"] == concept_b["canonical"]:
            concept_b = random.choice(TRAINING_SEEDS)
            
        anchor = concept_a["canonical"]
        # Pega uma variação do OUTRO conceito
        negative = apply_noise(random.choice(concept_b["vars"]))
        
        pairs.append((anchor, negative))
        labels.append(0)

    return pairs, np.array(labels)

def find_optimal_threshold(weights_path="app/resources/models/yawara_encoder_v1.weights.h5"):
    print("[CALIBRATION] Carregando modelo...")
    encoder = CanonicalSubjectNN(vocab="ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 ", encoder_dim=128)
    encoder.model.build((None, 64))
    encoder.model.load_weights(weights_path)

    print("[CALIBRATION] Gerando Dataset de Validação Sintético...")
    pairs, y_true = generate_validation_batch(size=1000)
    
    # Extrai vetores
    texts_a = [p[0] for p in pairs]
    texts_b = [p[1] for p in pairs]
    
    vecs_a = encoder.embed_batch(texts_a)
    vecs_b = encoder.embed_batch(texts_b)
    
    # Calcula Similaridade de Cosseno (Produto Escalar de vetores normalizados)
    # shape: (N,)
    similarities = np.sum(vecs_a * vecs_b, axis=1)

    print(f"[CALIBRATION] Avaliando thresholds (Varredura)...")
    
    best_thresh = 0.5
    best_f1 = 0.0
    results = []

    # Varre de 0.50 até 0.99
    thresholds = np.arange(0.5, 1.0, 0.01)
    
    for thresh in thresholds:
        # Se sim > thresh, prediz 1 (Match), senão 0
        y_pred = (similarities >= thresh).astype(int)
        
        prec = precision_score(y_true, y_pred, zero_division=0)
        rec = recall_score(y_true, y_pred, zero_division=0)
        f1 = f1_score(y_true, y_pred, zero_division=0)
        
        if f1 > best_f1:
            best_f1 = f1
            best_thresh = thresh
            
        results.append((thresh, prec, rec, f1))

    print("\n--- RESULTADO DA CALIBRAÇÃO ---")
    print(f"Melhor Threshold Matemático: {best_thresh:.2f}")
    print(f"F1-Score: {best_f1:.4f}")
    
    # Mostra detalhes do vencedor
    y_final = (similarities >= best_thresh).astype(int)
    final_prec = precision_score(y_true, y_final)
    final_rec = recall_score(y_true, y_final)
    
    print(f"Precisão: {final_prec:.2%} (Se a IA diz que é igual, é mesmo?)")
    print(f"Recall:   {final_rec:.2%} (De todos os iguais, quantos a IA pegou?)")
    
    print("\n[DICA DE ENGENHARIA]")
    if final_prec < 0.95:
        print("⚠ A precisão está baixa. Suba o threshold manualmente para evitar Falsos Positivos.")
    elif final_rec < 0.80:
        print("⚠ O recall está baixo. A IA está 'tímida' demais, vai chamar muito a LLM.")
    else:
        print("✅ Equilíbrio excelente. O sistema está robusto.")

    return best_thresh

if __name__ == "__main__":
    find_optimal_threshold()