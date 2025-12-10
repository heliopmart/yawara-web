import tensorflow as tf
import numpy as np
import random
import os
from typing import List, Tuple, Dict, Any

# ARCHITECTURE IMPORT ----------------------------
from app.ml.architectures.canonical_subject_nn import CanonicalSubjectNN

# ==============================================================================
# 1. CORPUS DE NORMALIZAÇÃO (Dataset "Gold Standard")
# ==============================================================================
# Este dicionário define a "Verdade Absoluta" do sistema.
# O modelo aprenderá que todas as strings em 'vars' devem ser atraídas
# para o mesmo ponto vetorial que 'canonical'.

TRAINING_SEEDS: List[Dict[str, Any]] = [
    # --- MATEMÁTICA PURA ---
    {
        "canonical": "CALCULO_DIFERENCIAL_INTEGRAL_1",
        "vars": [
            "CALCULO DIFERENCIAL E INTEGRAL I", "CALCULO 1", "CALCULO I", 
            "CALC. DIF. E INT. I", "MATEMATICA A", "C.D.I. 1", 
            "CALCULO DIFERENCIAL E INTEGRAL" 
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
        "canonical": "CALCULO_DIFERENCIAL_INTEGRAL_3",
        "vars": [
            "CALCULO DIFERENCIAL E INTEGRAL III", "CALCULO 3", "CALCULO III", 
            "CALC. DIF. E INT. III", "MATEMATICA C"
        ]
    },
    {
        "canonical": "GEOMETRIA_ANALITICA",
        "vars": [
            "GEOMETRIA ANALITICA", "G.A.", "ALGEBRA VETORIAL E GEOMETRIA ANALITICA",
            "VETORES E GEOMETRIA", "GEOMETRIA ANALITICA E ALGEBRA LINEAR"
        ]
    },
    {
        "canonical": "ALGEBRA_LINEAR",
        "vars": [
            "ALGEBRA LINEAR", "ALGEBRA LINEAR I", "INTRODUCAO A ALGEBRA LINEAR",
            "MATRIZES E VETORES"
        ]
    },
    {
        "canonical": "PROBABILIDADE_ESTATISTICA",
        "vars": [
            "PROBABILIDADE E ESTATISTICA", "ESTATISTICA BASICA", "ESTATISTICA",
            "INTRODUCAO A PROBABILIDADE", "METODOS ESTATISTICOS"
        ]
    },

    # --- FÍSICA ---
    {
        "canonical": "FISICA_I", # Física 1
        "vars": [
            "FISICA I", "FISICA 1", "FISICA GERAL I", "FISICA GERAL 1", 
            "MECANICA CLASSICA", "MECANICA NEWTONIANA", "FISICA A"
        ]
    },
    {
        "canonical": "FISICA_III", # Física 3 (Geralmente)
        "vars": [
            "FISICA III", "FISICA 3", "FISICA GERAL III", "ELETROMAGNETISMO",
            "ELETRICIDADE E MAGNETISMO", "FISICA C"
        ]
    },
    {
        "canonical": "FISICA_II", # Física 2
        "vars": [
            "FISICA II", "FISICA 2", "FISICA GERAL II", "TERMODINAMICA E ONDAS",
            "FISICA B", "OSCILACOES E ONDAS"
        ]
    },
    {
        "canonical": "LABORATORIO_FISICA_I",
        "vars": [
            "LABORATORIO DE FISICA I", "LAB DE FISICA II", 
            "FISICA EXPERIMENTAL II", "LAB FISICA II"
        ]
    },
    {
        "canonical": "LABORATORIO_FISICA_II",
        "vars": [
            "LABORATORIO DE FISICA II", "LAB FISICA II", 
            "FISICA EXPERIMENTAL II", "LAB FISICA II"
        ]
    },

    # --- COMPUTAÇÃO ---
    {
        "canonical": "ALGORITMOS_PROGRAMACAO",
        "vars": [
            "ALGORITMOS E PROGRAMACAO", "INTRODUCAO A COMPUTACAO", "LOGICA DE PROGRAMACAO",
            "ALGORITMOS 1", "PROGRAMACAO DE COMPUTADORES", "PROGRAMACAO APLICADA A ENGENHARIA"
        ]
    },
    {
        "canonical": "METODOS_NUMERICOS",
        "vars": [
            "METODOS NUMERICOS PARA ENGENHARIA", "CALCULO NUMERICO", 
            "ANALISE NUMERICA", "COMPUTACAO NUMERICA"
        ]
    },

    # --- ENGENHARIA GERAL ---
    {
        "canonical": "DESENHO_TECNICO",
        "vars": [
            "DESENHO TECNICO", "EXPRESSAO GRAFICA", "DESENHO MECANICO", 
            "GEOMETRIA DESCRITIVA", "DESENHO ARQUITETONICO", 
            "DESENHO TECNICO DE MAQUINAS E MECANISMOS"
        ]
    },
    {
        "canonical": "INTRODUCAO_ENGENHARIA",
        "vars": [
            "INTRODUCAO A ENGENHARIA", "INTRODUCAO A ENGENHARIA DE COMPUTACAO",
            "INTRODUCAO A TECNOLOGIA"
        ]
    },
    {
        "canonical": "CIRCUITOS_ELETRICOS",
        "vars": [
            "CIRCUITOS ELETRICOS", "CIRCUITOS ELETRICOS I", "TEORIA DE CIRCUITOS",
            "ANALISE DE CIRCUITOS", "CIRCUITOS DIGITAIS", "ELETROTECNICA"
        ]
    },
    {
        "canonical": "QUIMICA_GERAL",
        "vars": [
            "QUIMICA GERAL", "QUIMICA GERAL I", "QUIMICA TECNOLOGICA",
            "PRINCIPIOS DE QUIMICA"
        ]
    },
    
    # --- HUMANAS / OBRIGATÓRIAS GERAIS ---
    {
        "canonical": "HUMANIDADES_SOCIAIS",
        "vars": [
            "EDUCACAO SOCIEDADE E CIDADANIA", "SOCIOLOGIA", "FILOSOFIA",
            "ETICA E CIDADANIA", "ANTROPOLOGIA CULTURAL"
        ]
    }
]

# ==============================================================================
# 2. GERADOR DE DADOS SINTÉTICOS (Data Augmentation)
# ==============================================================================
def apply_noise(text: str) -> str:
    """Aplica ruído sintético para simular erros reais de OCR e digitação.
    
    Técnicas utilizadas:
    1. Abreviação Aleatória: "CALCULO" -> "CALC", "ENGENHARIA" -> "ENG".
    2. Substituição de Caracteres (Leet Speak/OCR Error): "O" -> "0", "I" -> "1".
    
    Args:
        text (str): O texto original limpo.
        
    Returns:
        str: O texto modificado com ruído.
    """
    text = text.upper()
    
    # Dicionário de abreviações comuns em históricos escolares
    replacements = {
        "CALCULO": "CALC", "DIREITO": "DIR", "ENGENHARIA": "ENG", 
        "SISTEMAS": "SIS", "COMPUTACAO": "COMP", "INTRODUCAO": "INTRO"
    }
    # Erros comuns de OCR (Optical Character Recognition)
    ocr_errors = {'O': '0', 'I': '1', 'S': '5', 'A': '4'}
    
    # 1. Tenta abreviar palavras
    words = text.split()
    new_words = [replacements.get(w, w) if random.random() > 0.5 else w for w in words]
    text = " ".join(new_words)

    # 2. Insere erro de caractere (30% de chance)
    if random.random() < 0.3:
        chars = list(text)
        if chars:
            idx = random.randint(0, len(chars)-1)
            if chars[idx] in ocr_errors:
                chars[idx] = ocr_errors[chars[idx]]
        text = "".join(chars)
        
    return text

def generate_contrastive_batch(batch_size: int) -> Tuple[List[str], List[str]]:
    """Gera um lote de pares (Âncora, Positivo) para treinamento contrastivo.
    
    O objetivo é treinar a rede para que a distância entre 'Âncora' e 'Positivo'
    seja zero.
    
    - Âncora: O nome canônico oficial (ex: "CALCULO_1").
    - Positivo: Uma variação suja/ruidosa (ex: "Calc. I").
    
    Args:
        batch_size (int): Quantidade de pares a gerar.
        
    Returns:
        Tuple[List[str], List[str]]: Duas listas de strings (âncoras e positivos).
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
            
        # Aplica ruído adicional (OCR, abreviação extra) para robustez
        positives.append(apply_noise(raw))
        
    return anchors, positives

# ==============================================================================
# 3. FUNÇÃO DE PERDA (InfoNCE Loss)
# ==============================================================================
@tf.function
def info_nce_loss(query, key, temperature=0.07):
    """Calcula a InfoNCE Loss (Information Noise Contrastive Estimation).
    
    Matematicamente, ela maximiza a similaridade entre pares positivos (query, key)
    enquanto minimiza a similaridade com todos os outros exemplos do batch (negativos).
    
    Args:
        query (Tensor): Embeddings das âncoras (Batch, Dim).
        key (Tensor): Embeddings dos positivos (Batch, Dim).
        temperature (float): Fator de escala da softmax.
        
    Returns:
        Tensor: Valor escalar da perda (loss).
    """
    # Normaliza (Cosseno exige vetores unitários)
    query = tf.math.l2_normalize(query, axis=1)
    key = tf.math.l2_normalize(key, axis=1)
    
    # Similaridade (Batch x Batch)
    # A diagonal principal contém os pares corretos (Positive Pairs)
    # Todos os outros elementos da matriz são pares errados (Negative Pairs)
    logits = tf.matmul(query, key, transpose_b=True)
    logits /= temperature
    
    # Labels: A diagonal [0, 1, 2...] é a resposta correta
    labels = tf.range(tf.shape(query)[0])
    
    # Usa CrossEntropy para forçar a probabilidade da diagonal ser 1
    return tf.reduce_mean(
        tf.keras.losses.sparse_categorical_crossentropy(labels, logits, from_logits=True)
    )

# ==============================================================================
# 4. LOOP DE TREINAMENTO PRINCIPAL
# ==============================================================================
def train():
    """Executa o pipeline de treinamento do modelo CanonicalSubjectNN.
    
    Fluxo:
    1. Instancia o modelo.
    2. Loop de Épocas:
       a. Gera dados sintéticos on-the-fly.
       b. Forward Pass (Embeddings).
       c. Calcula InfoNCE Loss.
       d. Backpropagation (Atualiza Pesos).
    3. Salva os pesos finais em disco.
    """
    # Hiperparâmetros
    BATCH_SIZE = 64
    EPOCHS = 30
    LR = 0.001

    print("[TREINO] Inicializando Normalizador de Entidades (CanonicalSubjectNN)...")
    
    # Instancia a arquitetura
    encoder = CanonicalSubjectNN(vocab="ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 ", encoder_dim=128)
    
    optimizer = tf.keras.optimizers.Adam(learning_rate=LR)
    
    for epoch in range(EPOCHS):
        # Gera dados frescos a cada época (aumenta a variabilidade vista pela rede)
        anchors_txt, positives_txt = generate_contrastive_batch(BATCH_SIZE * 10)
        
        steps = len(anchors_txt) // BATCH_SIZE
        epoch_loss = 0.0
        
        for i in range(steps):
            batch_anchors = anchors_txt[i*BATCH_SIZE : (i+1)*BATCH_SIZE]
            batch_positives = positives_txt[i*BATCH_SIZE : (i+1)*BATCH_SIZE]
            
            # Prepara tensores (String -> Inteiros)
            x_anchors = encoder.encode_batch(batch_anchors)
            x_positives = encoder.encode_batch(batch_positives)
            
            # Passo de Gradiente
            with tf.GradientTape() as tape:
                emb_anchors = encoder.model(x_anchors, training=True)
                emb_positives = encoder.model(x_positives, training=True)
                loss = info_nce_loss(emb_anchors, emb_positives)
                
            grads = tape.gradient(loss, encoder.model.trainable_variables)
            optimizer.apply_gradients(zip(grads, encoder.model.trainable_variables))
            
            epoch_loss += loss.numpy()
            
        print(f"Epoch {epoch+1}/{EPOCHS} - Loss: {epoch_loss/steps:.4f}")

    # Salva os pesos para uso em produção (Inference)
    os.makedirs("app/resources/models", exist_ok=True)
    save_path = "app/resources/models/yawara_canonical_subject_model_v1.weights.h5"
    encoder.model.save_weights(save_path)
    print(f"[TREINO] Sucesso! Pesos salvos em: {save_path}")

if __name__ == "__main__":
    train()