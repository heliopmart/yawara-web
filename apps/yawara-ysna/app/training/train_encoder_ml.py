# app/training/train_encoder_ml.py

import tensorflow as tf
import numpy as np
import random
import os
from app.ml.canonical_subject_nn import CanonicalSubjectNN

# ==============================================================================
# 1. CORPUS DE NORMALIZAÇÃO (Sinônimos Estritos)
# ==============================================================================
TRAINING_SEEDS = [
    {
        "canonical": "CALCULO_DIFERENCIAL_INTEGRAL_1",
        "vars": [
            "CALCULO DIFERENCIAL E INTEGRAL I", "CALCULO 1", "CALCULO I", 
            "CALC. DIF. E INT. I", "MATEMATICA A", "C.D.I. 1", "CALCULO A"
        ]
    },
    {
        "canonical": "CALCULO_DIFERENCIAL_INTEGRAL_2",
        "vars": [
            "CALCULO DIFERENCIAL E INTEGRAL II", "CALCULO 2", "CALCULO II", 
            "CALC. DIF. E INT. II", "MATEMATICA B", "C.D.I. 2"
        ]
    },
    {
        "canonical": "FISICA_MECANICA",
        "vars": [
            "FISICA I", "FISICA 1", "FISICA GERAL I", "FISICA GERAL 1", 
            "MECANICA CLASSICA", "FISICA TEORICA A", "MECANICA NEWTONIANA"
        ]
    },
    {
        "canonical": "ALGORITMOS_PROGRAMACAO",
        "vars": [
            "ALGORITMOS E PROGRAMACAO", "INTRODUCAO A COMPUTACAO", "LOGICA DE PROGRAMACAO",
            "ALGORITMOS 1", "PROGRAMACAO DE COMPUTADORES", "FUNDAMENTOS DE PROGRAMACAO"
        ]
    },
    {
        "canonical": "DESENHO_TECNICO",
        "vars": [
            "DESENHO TECNICO", "EXPRESSAO GRAFICA", "DESENHO MECANICO", 
            "GEOMETRIA DESCRITIVA", "DESENHO ARQUITETONICO"
        ]
    }
]

# ==============================================================================
# 2. GERADOR DE DADOS SINTÉTICOS (Data Augmentation)
# ==============================================================================
def apply_noise(text: str) -> str:
    """Simula o caos do mundo real (OCR ruim, abreviações, erros)."""
    text = text.upper()
    
    # Ruídos comuns
    replacements = {
        "CALCULO": "CALC", "DIREITO": "DIR", "ENGENHARIA": "ENG", 
        "SISTEMAS": "SIS", "COMPUTACAO": "COMP", "INTRODUCAO": "INTRO"
    }
    ocr_errors = {'O': '0', 'I': '1', 'S': '5', 'A': '4'}
    
    # 1. Abreviação
    words = text.split()
    new_words = [replacements.get(w, w) if random.random() > 0.5 else w for w in words]
    text = " ".join(new_words)

    # 2. Erro de Caractere (OCR)
    if random.random() < 0.3:
        chars = list(text)
        if chars:
            idx = random.randint(0, len(chars)-1)
            if chars[idx] in ocr_errors:
                chars[idx] = ocr_errors[chars[idx]]
        text = "".join(chars)
        
    return text

def generate_contrastive_batch(batch_size: int):
    """
    Gera pares (Âncora, Positivo).
    Âncora = O nome canônico (ex: CALCULO_DIFERENCIAL_INTEGRAL_1)
    Positivo = Uma variação suja (ex: Calc. 1)
    """
    anchors = []
    positives = []
    
    for _ in range(batch_size):
        concept = random.choice(TRAINING_SEEDS)
        
        # Âncora é o alvo perfeito (o vetor que queremos estabilizar)
        anchors.append(concept["canonical"])
        
        # Positivo é uma das variações (sinônimos)
        if concept["vars"]:
            raw = random.choice(concept["vars"])
        else:
            raw = concept["canonical"]
            
        # Aplica ruído adicional (OCR, abreviação extra)
        positives.append(apply_noise(raw))
        
    return anchors, positives

# ==============================================================================
# 3. FUNÇÃO DE PERDA (InfoNCE)
# ==============================================================================
@tf.function
def info_nce_loss(query, key, temperature=0.07):
    # Normaliza (Cosseno exige vetores unitários)
    query = tf.math.l2_normalize(query, axis=1)
    key = tf.math.l2_normalize(key, axis=1)
    
    # Similaridade (Batch x Batch)
    logits = tf.matmul(query, key, transpose_b=True)
    logits /= temperature
    
    # Labels: A diagonal é o par correto
    labels = tf.range(tf.shape(query)[0])
    
    return tf.reduce_mean(
        tf.keras.losses.sparse_categorical_crossentropy(labels, logits, from_logits=True)
    )

# ==============================================================================
# 4. LOOP DE TREINAMENTO
# ==============================================================================
def train():
    # Configurações
    BATCH_SIZE = 64
    EPOCHS = 15
    LR = 0.001

    print("[TREINO] Inicializando Normalizador de Entidades...")
    # Instancia a classe definida em app/ml/canonical_subject_nn.py
    encoder = CanonicalSubjectNN(vocab="ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 ", encoder_dim=128)
    
    optimizer = tf.keras.optimizers.Adam(learning_rate=LR)
    
    for epoch in range(EPOCHS):
        # Gera dados frescos (multiplicador aumenta o tamanho do "época virtual")
        anchors_txt, positives_txt = generate_contrastive_batch(BATCH_SIZE * 10)
        
        steps = len(anchors_txt) // BATCH_SIZE
        epoch_loss = 0.0
        
        for i in range(steps):
            batch_anchors = anchors_txt[i*BATCH_SIZE : (i+1)*BATCH_SIZE]
            batch_positives = positives_txt[i*BATCH_SIZE : (i+1)*BATCH_SIZE]
            
            # Prepara tensores
            x_anchors = encoder.encode_batch(batch_anchors)
            x_positives = encoder.encode_batch(batch_positives)
            
            with tf.GradientTape() as tape:
                emb_anchors = encoder.model(x_anchors, training=True)
                emb_positives = encoder.model(x_positives, training=True)
                loss = info_nce_loss(emb_anchors, emb_positives)
                
            grads = tape.gradient(loss, encoder.model.trainable_variables)
            optimizer.apply_gradients(zip(grads, encoder.model.trainable_variables))
            
            epoch_loss += loss.numpy()
            
        print(f"Epoch {epoch+1}/{EPOCHS} - Loss: {epoch_loss/steps:.4f}")

    # Salva
    os.makedirs("app/resources/models", exist_ok=True)
    save_path = "app/resources/models/yawara_encoder_v1.weights.h5"
    encoder.model.save_weights(save_path)
    print(f"[TREINO] Pesos salvos em: {save_path}")

if __name__ == "__main__":
    train()