import tensorflow as tf
import numpy as np
import shutil
import random
import json
from collections import defaultdict
import re
import os
from typing import List, Tuple, Dict, Any, Set

# CONFIG IMPORT ----------------------------------
from app.core.config import settings

# UTILS IMPORT -----------------------------------
from app.utils.semanticAugmenter import augmenter, SemanticAugmenterV2
from app.utils.stratifiedBatchGenerator import StratifiedBatchGenerator
from app.services.storage import storage_service

# ARCHITECTURE IMPORT ----------------------------
from app.ml.architectures.canonical_subject_nn import CanonicalSubjectNN

BASE_DATASET_PATH = settings.NN_MODEL_BASE_DATA_PATH
LEARNED_DATA_PATH = settings.NN_MODEL_LEARNED_DATA_PATH

class TrainingYsnaCanonical: 
    def __init__(self):
        self.model = None
        self.training_data = None
        self.base_path : str = None
        self.learned_path : str = None

        self._handle_load_datasets_path()

    def _handle_load_datasets_path(self):
        """
        Loading dataset paths based on project root.
            1. Determine the project root directory.
            2. Construct full paths for base and learned datasets.
            3. Assign these paths to instance variables.

        Returns:
            None
        """
        current_dir = os.path.dirname(os.path.abspath(__file__))
        project_root = os.path.dirname(os.path.dirname(current_dir))
        
        full_base_path = os.path.join(project_root, BASE_DATASET_PATH)
        full_learned_path = os.path.join(project_root, LEARNED_DATA_PATH)

        if not os.path.exists(full_base_path):
            raise FileNotFoundError(f"[CRÍTICO] Dataset base não encontrado: {full_base_path}")

        if not os.path.exists(full_learned_path):
            pass
            # raise FileNotFoundError(f"[CRÍTICO] Dataset aprendido não encontrado: {full_learned_path}")

        self.base_path = full_base_path
        self.learned_path = full_learned_path

    def _handle_load_learned_dataset(self, canonical_map: Dict[str, Set[str]]) -> List[Dict[str, Any]]:
        """
        Loads the learned dataset from its JSON file.
        Returns:
            A list of dictionaries representing the learned dataset.
        """
        updates_count = 0
        new_concepts_count = 0

        if os.path.exists(self.learned_path):
            print(f"[DATASET] Integrando conhecimento incremental de: {os.path.basename(self.learned_path)}")
            
            with open(self.learned_path, 'r', encoding='utf-8') as f:
                
                for line_num, line in enumerate(f, 1):
                    if not line.strip(): continue
                    try:
                        record = json.loads(line)
                        target = record["canonical"].upper().strip()
                        
                        raw_vars = record["vars"]
                        new_vars_list = raw_vars if isinstance(raw_vars, list) else [raw_vars]
                        
                        # Verify and add new canonical if not exists
                        if target not in canonical_map:
                            canonical_map[target] = set()
                            new_concepts_count += 1
                        
                        # Add new variables without duplication (Set)
                        for v in new_vars_list:
                            clean_v = v.upper().strip()
                            if clean_v and clean_v not in canonical_map[target]:
                                canonical_map[target].add(clean_v)
                                updates_count += 1
                                
                    except json.JSONDecodeError:
                        print(f"[WARN] Linha {line_num} ignorada (JSON inválido).")
                    except Exception as e:
                        print(f"[WARN] Erro ao processar linha {line_num}: {e}")

        return canonical_map
    
    def _handle_load_base_dataset(self) -> List[Dict[str, Any]]:
        """
        Loads the base dataset from its JSON file.
        Returns:
            A dictionary mapping canonical names to sets of variables.
        """
        with open(self.base_path, 'r', encoding='utf-8') as f:
            official_data = json.load(f)

        # Using Set to avoid deduplication
        canonical_base_map: Dict[str, Set[str]] = {
            item["canonical"]: set(item.get("vars", [])) 
            for item in official_data
        }

        return canonical_base_map

    def _handle_load_datasets(self) -> Tuple[List[Dict[str, Any]], str, str]:
        """
        Loads the base and learned datasets from their respective JSON files.
        Returns:
            A tuple containing:
                - A list of dictionaries representing the consolidated dataset.
                - The path to the base dataset file.
                - The path to the learned dataset file.
        """

        canonical_base_map = self._handle_load_base_dataset()
        canonical_map = self._handle_load_learned_dataset(canonical_base_map)

        consolidated_data = [
            {"canonical": canon, "vars": sorted(list(vars_set))} 
            for canon, vars_set in sorted(canonical_map.items()) 
        ]

        print(f"[DATASET] Consolidação concluída. Base: {len(consolidated_data)} entidades.")
        return consolidated_data

    @tf.function
    def info_nce_loss(self, query, key, temperature=0.07):
        """
        Calcula a InfoNCE Loss (Information Noise Contrastive Estimation).
        
        Matematicamente:
        - O objetivo é maximizar a similaridade entre pares da diagonal (View1, View2).
        - E minimizar a similaridade com todos os outros pares da matriz (Negatives).
        """

        # Normalização L2 é OBRIGATÓRIA para Cosseno. 
        # Sem isso, a magnitude dos vetores explode e a loss não converge.
        query = tf.math.l2_normalize(query, axis=1)
        key = tf.math.l2_normalize(key, axis=1)
        
        # Similaridade (Batch x Batch)
        # A diagonal principal contém os pares corretos (Positive Pairs)
        logits = tf.matmul(query, key, transpose_b=True)
        logits /= temperature
        
        # Labels: [0, 1, 2, 3...] (A resposta certa é sempre a diagonal)
        labels = tf.range(tf.shape(query)[0])
        
        # CrossEntropy faz o trabalho sujo de maximizar a prob da classe correta
        return tf.reduce_mean(
            tf.keras.losses.sparse_categorical_crossentropy(labels, logits, from_logits=True)
        )

    def train(self):
        BATCH_SIZE = 70      # InfoNCE funciona melhor com batches maiores
        EPOCHS = 160         # Para cada rodada de treino com dadateset maior, mais epocas precisa
        LR = 0.0005          # Learning Rate conservador para refino

        print("="*50)
        print("[INIT] Iniciando Pipeline de Treinamento Neuro-Simbólico")
        print("="*50)

        dataset = self._handle_load_datasets()
        
        if not dataset:
            print("[ERRO] Dataset vazio. Abortando.")
            return

        augmenter = SemanticAugmenterV2()

        print("[INIT] Inicializando Motores de Geração Sintética...")
        
        # Instancia o Gerador
        batch_gen = StratifiedBatchGenerator(
            dataset=dataset,
            augmenter=augmenter,
            p_use_vars=0.90,              # 90% das vezes usa dados reais
            p_force_numeric_siblings=0.75 # 75% das vezes força I vs II vs III
        )

        # 3. Inicializa o Modelo Neural
        print("[INIT] Compilando Modelo TensorFlow...")
        self.model = CanonicalSubjectNN(vocab="ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 ", encoder_dim=128)
        optimizer = tf.keras.optimizers.Adam(learning_rate=LR)
        
        # Checkpoint de melhor loss
        best_loss = float('inf')

        print(f"[TREINO] Iniciando {EPOCHS} épocas...")
        
        for epoch in range(EPOCHS):
            epoch_loss = 0.0

            # Steps arbitrário, já que o gerador é infinito. 
            # ? 15 steps * 70 batch = 1050 exemplos vistos por época.
            steps_per_epoch = 15 
            
            for _ in range(steps_per_epoch):
                # O Batch Gen já devolve View1 e View2 (Augmented)
                view1_txt, view2_txt = batch_gen.get_batch(BATCH_SIZE)
                
                # Forward Pass
                x_view1 = self.model.encode_batch(view1_txt)
                x_view2 = self.model.encode_batch(view2_txt)
                
                with tf.GradientTape() as tape:
                    emb_view1 = self.model.model(x_view1, training=True)
                    emb_view2 = self.model.model(x_view2, training=True)
                    
                    loss = self.info_nce_loss(emb_view1, emb_view2)
                    
                # Backward Pass
                grads = tape.gradient(loss, self.model.model.trainable_variables)
                optimizer.apply_gradients(zip(grads, self.model.model.trainable_variables))
                
                epoch_loss += loss.numpy()
                
            avg_loss = epoch_loss / steps_per_epoch
            
            # Log a cada 10 épocas
            if (epoch + 1) % 10 == 0:
                print(f"   Epoch {epoch+1:03d}/{EPOCHS} | Loss: {avg_loss:.4f}")
                
                # Save Best Model
                if avg_loss < best_loss:
                    best_loss = avg_loss
                    # Salva pesos intermediários (bom pra segurança)
                    self.model.model.save_weights(settings.ML_CANONICAL_WEIGHTS_PATH)

        print("-" * 50)
        print(f"[TREINO] Finalizado. Melhor Loss: {best_loss:.4f}")

        self._save_artifacts(dataset)

        self._upload_artifacts_to_cloud()
        
        self._calibration_ynsa_model_nn()

    def _save_artifacts(self, dataset):
        print("[PERSISTÊNCIA] Iniciando salvamento de artefatos...")
        
        print(f"[PERSISTÊNCIA] Atualizando arquivo oficial: {self.base_path}")
        shutil.copy(self.base_path, self.base_path + ".bak")
        
        with open(self.base_path, 'w', encoding='utf-8') as f:
            json.dump(dataset, f, indent=2, ensure_ascii=False)

        print("[ARTIFACTS] Gerando Índice Vetorial (.npz)...")
        all_canonicals = [item["canonical"] for item in dataset]
        
        x_input = self.model.encode_batch(all_canonicals)
        vectors_tensor = self.model.model(x_input, training=False)
        vectors_np = vectors_tensor.numpy()
        
        os.makedirs(os.path.dirname(settings.NN_MODEL_MEMORY_FILE_PATH), exist_ok=True)
        np.savez_compressed(
            settings.NN_MODEL_MEMORY_FILE_PATH, 
            keys=all_canonicals, 
            vectors=vectors_np
        )
        print(f"[ARTIFACTS] Índice salvo em: {settings.NN_MODEL_MEMORY_FILE_PATH}")
        
        self.model.model.save_weights(settings.ML_CANONICAL_WEIGHTS_PATH)
        print(f"[ARTIFACTS] Pesos salvos em: {settings.ML_CANONICAL_WEIGHTS_PATH}")
 
        print("[PERSISTÊNCIA] Limpando buffer de aprendizado incremental...")
        if os.path.exists(self.learned_path):
            with open(self.learned_path, 'w') as f:
                f.write("")
        
        print("[SUCESSO] Pipeline concluído e dados persistidos.")

    def _upload_artifacts_to_cloud(self):
        """
        Placeholder para upload de artefatos para Cloudinary ou outro serviço.
        """
        storage_service.upload_file(
            local_path=settings.NN_MODEL_MEMORY_FILE_PATH,
            remote_name=settings.NN_MODEL_MEMORY_FILE_ID
        )

        storage_service.upload_file(
            local_path=settings.ML_CANONICAL_WEIGHTS_PATH,
            remote_name=settings.ML_CANONICAL_WEIGHTS_ID
        )

    def _calibration_ynsa_model_nn(self):
        try:
            # Importa localmente para evitar dependência circular

            from app.calibrations.canonical_subject_calibration import find_optimal_threshold
            print("\n[CALIBRAÇÃO] Iniciando recálculo de threshold ideal...")
            find_optimal_threshold()
        except ImportError:
            print("[WARN] Módulo de calibração não encontrado. Pulando.")

training_ysna_canonical = TrainingYsnaCanonical()

if __name__ == "__main__":
    training_ysna_canonical.train()