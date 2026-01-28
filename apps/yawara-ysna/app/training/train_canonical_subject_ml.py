import tensorflow as tf
import numpy as np
import shutil
import random
import json
import os
from typing import List, Tuple, Dict, Any

from app.core.config import settings

# ARCHITECTURE IMPORT ----------------------------
from app.ml.architectures.canonical_subject_nn import CanonicalSubjectNN

# ==============================================================================
# NORMALIZEED TRAINING DATASET LOADING
# ==============================================================================

# def load_dataset_from_root(path_from_root: str) -> List[Dict[str, Any]]:
#     """
#     Carrega um arquivo assumindo que o caminho começa na RAIZ do projeto.
#     Exemplo de input: 'app/resources/training/NN/canonical_labels.json'
#     """
    
#     current_dir = os.path.dirname(os.path.abspath(__file__))
#     project_root = os.path.dirname(os.path.dirname(current_dir))
#     full_path = os.path.join(project_root, path_from_root)
    
#     print(f"[DEBUG] Tentando abrir: {full_path}")
    
#     if not os.path.exists(full_path):
#         raise FileNotFoundError(
#             f"Erro fatal: Não achei o arquivo!\n"
#             f"Raiz detectada: {project_root}\n"
#             f"Caminho final tentado: {full_path}"
#         )
        
#     with open(full_path, 'r', encoding='utf-8') as f:
#         data = json.load(f)
        
#     print(f"[DATASET] Sucesso! Carregadas {len(data)} entidades de {path_from_root}")
#     return data

# def load_dataset_merged() -> List[Dict[str, Any]]:
#     """
#     Carrega o Dataset Oficial + O que foi aprendido em produção.
#     """
#     official_data = load_dataset_from_root("app/resources/training/NN/canonical_labels.json")
    
#     canonical_map = {item["canonical"]: item for item in official_data}
    
#     new_entries_count = 0
    
#     current_dir = os.path.dirname(os.path.abspath(__file__))
#     project_root = os.path.dirname(os.path.dirname(current_dir))
#     full_learned_path = os.path.join(project_root, settings.NN_MODEL_LEARNED_DATA_PATH)

#     if os.path.exists(full_learned_path):
#         print(f"[DATASET] Mesclando aprendizado de: {full_learned_path}")
#         with open(full_learned_path, 'r', encoding='utf-8') as f:
#             for line in f:
#                 if not line.strip(): continue
#                 try:
#                     record = json.loads(line)
#                     target = record["canonical"]
#                     new_var = record["vars"]
                    
#                     if target in canonical_map:
#                         if "vars" not in canonical_map[target]:
#                             canonical_map[target]["vars"] = []
                        
#                         if new_var not in canonical_map[target]["vars"]:
#                             canonical_map[target]["vars"].append(new_var)
#                             new_entries_count += 1
#                 except Exception as e:
#                     print(f"[WARN] Linha corrompida no dataset aprendido: {e}")
    
#     print(f"[DATASET] Merge completo! {new_entries_count} novas variações inseridas no treino.")
#     return official_data

# TRAINING_SEEDS: List[Dict[str, Any]] = load_dataset_merged()


# Caminhos (Assumindo que settings tenha os caminhos corretos)
BASE_DATASET_PATH = "app/resources/training/NN/canonical_labels.json"
LEARNED_DATA_PATH = settings.NN_MODEL_LEARNED_DATA_PATH

# ==============================================================================
# 1. SMART DATASET MERGING (A CORREÇÃO)
# ==============================================================================

def load_and_consolidate_datasets() -> List[Dict[str, Any]]:
    """
    Carrega a base oficial E o arquivo incremental.
    Mescla tudo, remove duplicatas e prepara para salvar a nova versão oficial.
    """
    current_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(os.path.dirname(current_dir))
    
    full_base_path = os.path.join(project_root, BASE_DATASET_PATH)
    full_learned_path = os.path.join(project_root, LEARNED_DATA_PATH)
    
    with open(full_base_path, 'r', encoding='utf-8') as f:
        official_data = json.load(f)
    
    canonical_map = {item["canonical"]: set(item.get("vars", [])) for item in official_data}
    
    updates_count = 0
    new_canonicals_count = 0

    if os.path.exists(full_learned_path):
        print(f"[DATASET] Processando arquivo de aprendizado: {full_learned_path}")
        with open(full_learned_path, 'r', encoding='utf-8') as f:
            for line in f:
                if not line.strip(): continue
                try:
                    record = json.loads(line)
                    target = record["canonical"]
                    new_vars = record["vars"] 

                    if target not in canonical_map:
                        canonical_map[target] = set()
                        new_canonicals_count += 1
                    
                    for v in new_vars:
                        if v not in canonical_map[target]:
                            canonical_map[target].add(v)
                            updates_count += 1
                            
                except Exception as e:
                    print(f"[WARN] Linha ignorada no merge: {e}")

    consolidated_data = []
    for canon, vars_set in canonical_map.items():
        consolidated_data.append({
            "canonical": canon,
            "vars": sorted(list(vars_set))
        })

    print(f"[DATASET] Consolidação concluída.")
    print(f"   - Novos sinônimos incorporados: {updates_count}")
    print(f"   - Novas matérias descobertas: {new_canonicals_count}")
    
    return consolidated_data, full_base_path, full_learned_path

TRAINING_DATA, PATH_OFFICIAL, PATH_LEARNED = load_and_consolidate_datasets()
TRAINING_SEEDS = TRAINING_DATA 

# ==============================================================================
# CREATE SYNTHETIC BATCHES WITH NOISE
# ==============================================================================
def apply_noise(text: str) -> str:
    """Gera ruído algorítmico agnóstico ao conteúdo (funciona para qualquer matéria).
    
    Cenários simulados:
    1. Truncamento (Abreviação): "TERMODINAMICA" -> "TERMOD."
    2. Supressão de Vogais: "CALCULO" -> "CLCULO"
    3. Erro de Digitação (Swap): "ALGEBRA" -> "ALEGBRA"
    4. Erro de OCR/Leitura: "O"->"0", "S"->"5"
    5. Remoção de Espaços/Pontuação.
    """
    if not text: return ""
    text = text.upper()
    
    # ---------------------------------------------------------
    # 1. OCR / Leet Speak Estendido (Probabilidade: 30%)
    # ---------------------------------------------------------
    ocr_map = {
        'O': '0', 'Q': '0', 'I': '1', 'L': '1', 'Z': '2', 
        'E': '3', 'A': '4', 'S': '5', 'G': '6', 'T': '7', 
        'B': '8'
    }
    if random.random() < 0.3:
        text = "".join([ocr_map.get(c, c) if random.random() < 0.2 else c for c in text])

    words = text.split()
    new_words = []

    for word in words:
        if len(word) < 3:
            new_words.append(word)
            continue

        dice = random.random()

        # ---------------------------------------------------------
        # 2. Abreviação por Truncamento (Probabilidade: 25%)
        # Ex: "GEOMETRIA" -> "GEOM." ou "GEO"
        # ---------------------------------------------------------
        if dice < 0.25:
            if len(word) <= 3:
                new_words.append(word + ".")
                continue
            cut_point = random.randint(3, len(word) - 1)
            token = word[:cut_point] + ("." if random.random() > 0.5 else "")
            new_words.append(token)

        # ---------------------------------------------------------
        # 3. Supressão de Vogais (Probabilidade: 15%)
        # Ex: "MECANICA" -> "MECNCA"
        # ---------------------------------------------------------

        elif dice < 0.40:
            vogais = "AEIOU"
            token = word[0] + "".join([c for c in word[1:] if c not in vogais or random.random() > 0.5])
            new_words.append(token)

        # ---------------------------------------------------------
        # 4. Typos / Swap de letras vizinhas (Probabilidade: 10%)
        # Ex: "FISICA" -> "FIISCA"
        # ---------------------------------------------------------
        elif dice < 0.50:
            word_list = list(word)
            if len(word_list) > 2:
                idx = random.randint(0, len(word_list) - 2)
                word_list[idx], word_list[idx+1] = word_list[idx+1], word_list[idx]
            new_words.append("".join(word_list))

        # ---------------------------------------------------------
        # 5. Mantém a palavra original (Probabilidade: Restante)
        # ---------------------------------------------------------

        else:
            new_words.append(word)

    result = " ".join(new_words)

    # ---------------------------------------------------------
    # 6. Global Noise: Random character deletion (Noise Drop)
    # Simulates sensor failure or paper smudge
    # ---------------------------------------------------------
    if random.random() < 0.2 and len(result) > 5:
        idx_to_drop = random.randint(0, len(result) - 1)
        result = result[:idx_to_drop] + result[idx_to_drop+1:]

    return result

def generate_contrastive_batch(batch_size: int) -> Tuple[List[str], List[str]]:
    anchors = []
    positives = []
    
    batch_concepts = random.sample(TRAINING_SEEDS, batch_size)
    
    for concept in batch_concepts:
        anchors.append(concept["canonical"])
        
        if concept["vars"]:
            raw = random.choice(concept["vars"])
        else:
            raw = concept["canonical"]
            
        positives.append(apply_noise(raw))
        
    return anchors, positives

# ==============================================================================
# 3. LOSS FUNCTION (InfoNCE Loss)
# ==============================================================================
@tf.function
def info_nce_loss(query, key, temperature=0.05):
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
    # Normalize ( Cosine requires unit vectors )
    query = tf.math.l2_normalize(query, axis=1)
    key = tf.math.l2_normalize(key, axis=1)
    
    # Similarity (Batch x Batch)
    # The main diagonal contains the correct pairs (Positive Pairs)
    # All other elements in the matrix are incorrect pairs (Negative Pairs)
    logits = tf.matmul(query, key, transpose_b=True)
    logits /= temperature
    
    # Labels: The diagonal [0, 1, 2...] is the correct answer
    labels = tf.range(tf.shape(query)[0])
    
    # Use CrossEntropy to force the probability of the diagonal to be 1
    return tf.reduce_mean(
        tf.keras.losses.sparse_categorical_crossentropy(labels, logits, from_logits=True)
    )

# ==============================================================================
# 4. MAIN TRAINING LOOP
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
    
    BATCH_SIZE = 70
    EPOCHS = 120
    LR = 0.001

    print("[TREINO] Inicializando Normalizador de Entidades (CanonicalSubjectNN)...")
    
    if not TRAINING_SEEDS:
        print("[ERRO] Abortando treino: Dataset vazio.")
        return

    encoder = CanonicalSubjectNN(vocab="ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 ", encoder_dim=128)
    
    optimizer = tf.keras.optimizers.Adam(learning_rate=LR)
    
    for epoch in range(EPOCHS):
        epoch_loss = 0.0
        steps_per_epoch = 10
        
        for _ in range(steps_per_epoch):
            anchors_txt, positives_txt = generate_contrastive_batch(BATCH_SIZE)
            
            x_anchors = encoder.encode_batch(anchors_txt)
            x_positives = encoder.encode_batch(positives_txt)
            
            with tf.GradientTape() as tape:
                emb_anchors = encoder.model(x_anchors, training=True)
                emb_positives = encoder.model(x_positives, training=True)
                loss = info_nce_loss(emb_anchors, emb_positives)
                
            grads = tape.gradient(loss, encoder.model.trainable_variables)
            optimizer.apply_gradients(zip(grads, encoder.model.trainable_variables))
            
            epoch_loss += loss.numpy()
            
        if (epoch + 1) % 10 == 0:
            print(f"Epoch {epoch+1}/{EPOCHS} - Loss: {epoch_loss/steps_per_epoch:.4f}")

    os.makedirs("app/resources/models", exist_ok=True)
    encoder.model.save_weights(settings.ML_CANONICAL_WEIGHTS_PATH)

    print("[ARTIFACTS] Gerando Memória Vetorial Sincronizada (.npz)...")
    
    # Get canonical names from training seeds
    canonical_names = [item["canonical"] for item in TRAINING_SEEDS]
    
    # 2. Create vectors for all canonical names
    # Note: training=False is crucial to ensure determinism (disables Dropout if any)
    x_input = encoder.encode_batch(canonical_names)
    vectors_tensor = encoder.model(x_input, training=False)
    vectors_np = vectors_tensor.numpy()
    
    np.savez_compressed(settings.NN_MODEL_MEMORY_FILE_PATH, keys=canonical_names, vectors=vectors_np)
    
    print(f"[ARTIFACTS] Memória vetorial salva em: {settings.NN_MODEL_MEMORY_FILE_PATH}")
    print(f"[TREINO] Sucesso! Pesos salvos em: {settings.ML_CANONICAL_WEIGHTS_PATH}")

    _save_consolidated_dataset()
    _calibration_ynsa_model_nn()

def _save_consolidated_dataset():
    print("[PERSISTÊNCIA] Atualizando base de conhecimento permanente...")
    
    shutil.copy(PATH_OFFICIAL, PATH_OFFICIAL + ".bak")
    
    with open(PATH_OFFICIAL, 'w', encoding='utf-8') as f:
        json.dump(TRAINING_DATA, f, indent=2, ensure_ascii=False)
    
    print(f"[PERSISTÊNCIA] Base oficial atualizada em: {PATH_OFFICIAL}")

    if os.path.exists(PATH_LEARNED):
        open(PATH_LEARNED, 'w').close() 
        print(f"[PERSISTÊNCIA] Buffer de aprendizado ({PATH_LEARNED}) foi limpo.")

    print("[SUCESSO] Ciclo de Active Learning completo.")
    
def _calibration_ynsa_model_nn():
    # Avoid circular import
    from app.calibrations.canonical_subject_calibration import find_optimal_threshold

    print("\n[CALIBRAÇÃO] Iniciando busca pelo threshold ideal...")
    find_optimal_threshold()

if __name__ == "__main__":
    train()