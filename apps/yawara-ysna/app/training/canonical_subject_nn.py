import tensorflow as tf
import numpy as np
import random
from app.ml.canonical_subject_nn import CanonicalSubjectNN

# ==========================================
# 1. CONFIGURAÇÃO E DADOS SINTÉTICOS
# ==========================================

# Simulação da ontologia (No real, viria do banco ou arquivo config)
CANONICAL_TARGETS = [
    "CALCULO_DIFERENCIAL_INTEGRAL_1",
    "FISICA_MECANICA",
    "ALGEBRA_LINEAR",
    "ALGORITMOS_PROGRAMACAO"
]

def generate_triplets(batch_size=32):
    """
    Gera (Anchor, Positive, Negative) para treino.
    Anchor: Nome Canônico
    Positive: Variação (simulada)
    Negative: Outra matéria aleatória
    """
    anchors, positives, negatives = [], [], []
    
    for _ in range(batch_size):
        # Seleciona alvo positivo
        target = random.choice(CANONICAL_TARGETS)
        anchors.append(target)
        
        # Simula variação (Positive)
        # Ex: "CALCULO_..." -> "Calc 1" (Lógica simplificada aqui)
        positives.append(target[:4] + " " + str(random.randint(1,9))) 
        
        # Seleciona negativo (qualquer um que não seja o target)
        neg = random.choice([t for t in CANONICAL_TARGETS if t != target])
        negatives.append(neg) # Poderia aplicar ruído aqui também
        
    return anchors, positives, negatives

# ==========================================
# 2. LOOP DE TREINAMENTO (TRIPLET LOSS)
# ==========================================
def train_local():
    # Instancia a arquitetura existente
    encoder = CanonicalSubjectNN(vocab="ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 ", encoder_dim=128)
    
    optimizer = tf.keras.optimizers.Adam(learning_rate=0.001)
    loss_fn = tf.keras.losses.CosineSimilarity() # Simplificação para demo

    print("Iniciando treino local simulado...")
    
    # Loop simples (na prática, usaria TripletLoss real customizada)
    for epoch in range(5):
        anch_txt, pos_txt, neg_txt = generate_triplets(64)
        
        # Prepara inputs usando o método da classe original
        # Nota: Estamos passando código vazio "000" para focar no nome
        dummy_codes = ["000"] * 64
        
        with tf.GradientTape() as tape:
            # Forward Pass
            # Precisamos extrair os tensores do dicionário retornado por encode_batch
            inputs_anchor = encoder.encode_batch(dummy_codes, anch_txt)
            inputs_pos = encoder.encode_batch(dummy_codes, pos_txt)
            inputs_neg = encoder.encode_batch(dummy_codes, neg_txt)

            # Passa pelo modelo Keras
            emb_anchor = encoder.model([inputs_anchor['code_input'], inputs_anchor['name_input']])
            emb_pos = encoder.model([inputs_pos['code_input'], inputs_pos['name_input']])
            emb_neg = encoder.model([inputs_neg['code_input'], inputs_neg['name_input']])

            # Loss: Queremos Positivo perto (Loss baixa) e Negativo longe
            # Triplet Loss simplificada: dist(a, p) - dist(a, n) + margin
            pos_dist = tf.reduce_sum(tf.square(emb_anchor - emb_pos), axis=1)
            neg_dist = tf.reduce_sum(tf.square(emb_anchor - emb_neg), axis=1)
            loss = tf.reduce_mean(tf.maximum(pos_dist - neg_dist + 0.5, 0.0))

        grads = tape.gradient(loss, encoder.model.trainable_variables)
        optimizer.apply_gradients(zip(grads, encoder.model.trainable_variables))
        
        print(f"Epoch {epoch+1}, Loss: {loss.numpy():.4f}")

    # Salva os pesos para uso no serviço
    print("Salvando pesos...")
    encoder.model.save_weights("app/resources/yawara_encoder_weights_v1.h5")

if __name__ == "__main__":
    train_local()