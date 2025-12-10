import numpy as np
import random
import os
from typing import List, Tuple, Any
from sklearn.metrics import precision_score, recall_score, f1_score

# ARCHITECTURE IMPORTS --------------------------------------------
from app.ml.architectures.canonical_subject_nn import CanonicalSubjectNN

# TRAINING IMPORTS ------------------------------------------------
from app.training.train_canonical_subject_ml import TRAINING_SEEDS, apply_noise

def generate_validation_batch(size: int = 500) -> Tuple[List[Tuple[str, str]], np.ndarray]:
    """Gera um conjunto de dados sintético balanceado para validação do threshold.

    Diferente do treino (que usa apenas pares positivos para InfoNCE), a calibração
    precisa de **Pares Negativos** explícitos para testar a capacidade do modelo de
    dizer "NÃO" (rejeitar similaridade entre matérias diferentes).

    O Dataset é dividido 50/50:
    1. **Pares Positivos (Labels=1):** Mesmo conceito, variações diferentes.
       Ex: "Cálculo 1" vs "Calc. Dif. Int. I".
    2. **Pares Negativos (Labels=0):** Conceitos distintos que parecem iguais.
       Ex: "Cálculo 1" vs "Cálculo 2" (Difíceis de separar!).

    Args:
        size (int): Tamanho total do dataset a ser gerado. Defaults to 500.

    Returns:
        Tuple[List[Tuple[str, str]], np.ndarray]: 
            - Lista de pares de strings (Texto A, Texto B).
            - Array numpy com as labels verdadeiras (1 ou 0).
    """
    pairs = []
    labels = [] # 1 = Match, 0 = No Match

    # 1. Gerar Pares Positivos
    for _ in range(size // 2):
        concept = random.choice(TRAINING_SEEDS)
        anchor = concept["canonical"]

        # Pega uma variação e aplica ruído pesado
        # Se vars estiver vazio, usa o próprio canonical com ruído
        var_text = random.choice(concept["vars"]) if concept["vars"] else anchor
        positive = apply_noise(var_text)
        
        pairs.append((anchor, positive))
        labels.append(1)

    # 2. Gerar Pares Negativos
    # O desafio: Pegar conceitos diferentes que parecem iguais textualmente.
    for _ in range(size // 2):
        concept_a = random.choice(TRAINING_SEEDS)
        concept_b = random.choice(TRAINING_SEEDS)
        
        # Garante que são conceitos semanticamente diferentes
        # Loop de segurança para não selecionar o mesmo conceito por azar
        while concept_a["canonical"] == concept_b["canonical"]:
            concept_b = random.choice(TRAINING_SEEDS)
            
        anchor = concept_a["canonical"]
        
        # Pega uma variação do OUTRO conceito para confundir a rede
        var_text_b = random.choice(concept_b["vars"]) if concept_b["vars"] else concept_b["canonical"]
        negative = apply_noise(var_text_b)
        
        pairs.append((anchor, negative))
        labels.append(0)

    return pairs, np.array(labels)

def find_optimal_threshold(weights_path: str = "app/resources/models/yawara_canonical_subject_model_v1.weights.h5") -> float:
    """Encontra o limiar (threshold) ideal de similaridade de cosseno.

    Executa uma varredura (grid search) entre 0.50 e 0.99 para encontrar o valor
    que maximiza o **F1-Score**. O F1-Score é a média harmônica entre Precisão
    (não errar quando diz que é igual) e Recall (encontrar todos os iguais).

    Args:
        weights_path (str): Caminho para o arquivo de pesos treinado.

    Returns:
        float: O valor de threshold recomendado (ex: 0.72).
    """
    print("[CALIBRATION] Carregando arquitetura do modelo...")

    # Instancia a arquitetura pura para teste
    encoder = CanonicalSubjectNN(vocab="ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 ", encoder_dim=128)
    
    # Build dummy para inicializar pesos
    encoder.model.build((None, 64))
    
    try:
        encoder.model.load_weights(weights_path)
        print(f"[CALIBRATION] Pesos carregados de: {weights_path}")
    except Exception as e:
        print(f"[FATAL] Não foi possível carregar os pesos: {e}")
        return 0.70 # Retorno padrão seguro

    print("[CALIBRATION] Gerando Dataset de Validação Sintético (1000 amostras)...")
    pairs, y_true = generate_validation_batch(size=1000)
    
    # Separação para inferência em batch
    texts_a = [p[0] for p in pairs]
    texts_b = [p[1] for p in pairs]
    
    print("[CALIBRATION] Calculando vetores (Forward Pass)...")
    vecs_a = encoder.embed_batch(texts_a)
    vecs_b = encoder.embed_batch(texts_b)
    
    # Calcula Similaridade de Cosseno (Produto Escalar de vetores normalizados)
    # A similaridade é vetorizada: (N, 128) * (N, 128) -> sum -> (N,)
    similarities = np.sum(vecs_a * vecs_b, axis=1)

    print(f"[CALIBRATION] Iniciando varredura de thresholds...")
    
    best_thresh = 0.5
    best_f1 = 0.0
    
    # Varre de 0.50 até 0.99 em passos de 0.01
    thresholds = np.arange(0.5, 1.0, 0.01)
    
    for thresh in thresholds:
        # Se sim > thresh, prediz 1 (Match), senão 0
        y_pred = (similarities >= thresh).astype(int)
        
        # zero_division=0 evita erros se o modelo não predizer nenhum positivo
        f1 = f1_score(y_true, y_pred, zero_division=0)
        
        if f1 > best_f1:
            best_f1 = f1
            best_thresh = thresh

    print("\n" + "="*40)
    print("   RELATÓRIO DE CALIBRAÇÃO (YSNA)")
    print("="*40)
    print(f"Melhor Threshold Matemático: {best_thresh:.2f}")
    print(f"Melhor F1-Score Atingido:    {best_f1:.4f}")
    
    # Métricas detalhadas do vencedor
    y_final = (similarities >= best_thresh).astype(int)
    final_prec = precision_score(y_true, y_final, zero_division=0)
    final_rec = recall_score(y_true, y_final, zero_division=0)
    
    print(f"Precisão: {final_prec:.2%} (Confiança nos positivos)")
    print(f"Recall:   {final_rec:.2%} (Capacidade de encontrar positivos)")
    
    print("\n[DIAGNÓSTICO DE ENGENHARIA]")
    if final_prec < 0.90:
        print("⚠ ALERTA: A precisão está baixa (<90%).")
        print("  Sugestão: O modelo está confundindo matérias parecidas (ex: Calc 1 e 2).")
        print("  Ação: Aumente o número de épocas de treino ou adicione mais 'Hard Negatives' nas Seeds.")
    elif final_rec < 0.80:
        print("⚠ ALERTA: O recall está baixo (<80%).")
        print("  Sugestão: O modelo está muito 'tímido'. Vai chamar a LLM muitas vezes desnecessariamente.")
        print("  Ação: Verifique se o data augmentation não está destruindo demais as palavras.")
    else:
        print("✅ SUCESSO: O modelo está equilibrado e pronto para produção.")

    return float(best_thresh)

if __name__ == "__main__":
    find_optimal_threshold()