import tensorflow as tf
import numpy as np
import shutil
import random
import json
import os
from collections import defaultdict
from typing import List, Tuple, Dict, Any, Set

# CONFIG & SERVICES
from app.core.config import settings
from app.services.storage import storage_service
from app.utils.semanticAugmenter import augmenter

# ARCHITECTURE ----------------------------------------------
from app.ml.canonical_subject_engine import CanonicalSubjectNN

BASE_DATASET_PATH = settings.NN_MODEL_BASE_DATA_PATH
LEARNED_DATA_PATH = settings.NN_MODEL_LEARNED_DATA_PATH

# Importa constantes para assinatura do Tensor
from app.ml.canonical_subject_engine import MAX_LEN

class TrainingYsnaCanonicalV2:
    """
    Treinador V3: Abordagem Siamese Network (Character-Level).
    Foco: Maximizar distinção entre 'I', 'II', 'III' usando Hard Negative Mining.
    """

    def __init__(self):
        self.model_wrapper = None 
        self.base_path : str = None
        self.learned_path : str = None
        
        self._setup_paths()

    def _setup_paths(self):
        """Resolve caminhos absolutos baseado na raiz do projeto."""
        current_dir = os.path.dirname(os.path.abspath(__file__))
        project_root = os.path.dirname(os.path.dirname(current_dir))
        
        self.base_path = os.path.join(project_root, BASE_DATASET_PATH)
        self.learned_path = os.path.join(project_root, LEARNED_DATA_PATH)

        if not os.path.exists(self.base_path):
            raise FileNotFoundError(f"[CRITICO] Dataset base não encontrado: {self.base_path}")

    # ==========================================================================
    # 1. DATA LOADING
    # ==========================================================================
    def _load_and_consolidate_data(self) -> List[Dict[str, Any]]:
        with open(self.base_path, 'r', encoding='utf-8') as f:
            base_data = json.load(f)
        
        canonical_map = {item["canonical"]: set(item.get("vars", [])) for item in base_data}

        if os.path.exists(self.learned_path):
            print(f"[DATASET] Integrando incremental: {os.path.basename(self.learned_path)}")
            with open(self.learned_path, 'r', encoding='utf-8') as f:
                for line in f:
                    if not line.strip(): continue
                    try:
                        rec = json.loads(line)
                        canon = rec["canonical"].upper().strip()
                        vars_in = rec["vars"] if isinstance(rec["vars"], list) else [rec["vars"]]
                        
                        if canon not in canonical_map: canonical_map[canon] = set()
                        for v in vars_in: canonical_map[canon].add(v.upper().strip())
                    except: pass

        dataset = [
            {"canonical": c, "vars": sorted(list(v))} 
            for c, v in sorted(canonical_map.items())
        ]
        print(f"[DATASET] Total de Entidades: {len(dataset)}")
        return dataset

    # ==========================================================================
    # 2. SIAMESE PAIR GENERATOR
    # ==========================================================================
    def _siamese_generator(self, dataset, batch_size=64):
        """
        Gera batches infinitos de pares (A, B) e Labels (0 ou 1).
        """
        family_map = defaultdict(list)
        for item in dataset:
            root = item['canonical'].split('_')[0]
            if len(root) > 3: family_map[root].append(item)

        while True:
            batch_a = []
            batch_b = []
            labels = []

            # --- 50% PARES POSITIVOS (Label 1) ---
            for _ in range(batch_size // 2):
                item = random.choice(dataset)
                canon = item['canonical']
                
                if item['vars'] and random.random() > 0.3:
                    match = random.choice(item['vars'])
                    match = augmenter.augment(match, profile="light")
                else:
                    match = augmenter.augment(canon, profile="medium")
                
                batch_a.append(canon)
                batch_b.append(match)
                labels.append(1.0)

            # --- 50% PARES NEGATIVOS (Label 0) ---
            for _ in range(batch_size // 2):
                item_a = random.choice(dataset)
                root = item_a['canonical'].split('_')[0]
                siblings = family_map.get(root, [])
                
                candidates = [x for x in siblings if x['canonical'] != item_a['canonical']]
                
                if candidates and random.random() > 0.4:
                    item_b = random.choice(candidates)
                else:
                    item_b = random.choice(dataset)
                    while item_b['canonical'] == item_a['canonical']:
                        item_b = random.choice(dataset)

                txt_a = item_a['canonical']
                
                if item_b['vars'] and random.random() > 0.5:
                    txt_b = random.choice(item_b['vars'])
                else:
                    txt_b = item_b['canonical']
                
                txt_b = augmenter.augment(txt_b, profile="light")

                batch_a.append(txt_a)
                batch_b.append(txt_b)
                labels.append(0.0)

            zipped = list(zip(batch_a, batch_b, labels))
            random.shuffle(zipped)
            b_a, b_b, lbls = zip(*zipped)

            # yield cru (Strings), o preprocessamento acontece fora
            yield (np.array(b_a), np.array(b_b), np.array(lbls))

    # ==========================================================================
    # 3. TRAINING LOOP (CORRIGIDO)
    # ==========================================================================
    def train(self):
        BATCH_SIZE = 64
        EPOCHS = 100 
        LR = 0.001

        print("="*50)
        print("[V3] Iniciando Treino SIAMESE (Character-Level)")
        print("="*50)

        dataset = self._load_and_consolidate_data()
        
        print("[INIT] Construindo Rede Siamese CNN...")
        self.model_wrapper = CanonicalSubjectNN(encoder_dim=128)
        siamese_model = self.model_wrapper.model
        
        siamese_model.compile(
            loss='binary_crossentropy',
            optimizer=tf.keras.optimizers.Adam(learning_rate=LR),
            metrics=['accuracy']
        )

        # -------------------------------------------------------------
        # FIX DO GERADOR (USANDO TF.DATA.DATASET)
        # -------------------------------------------------------------
        
        # 1. Definimos o gerador Python simples que já preprocessa
        def final_gen():
            raw_gen = self._siamese_generator(dataset, BATCH_SIZE)
            for raw_a, raw_b, lbls in raw_gen:
                X_a = self.model_wrapper.preprocess(raw_a)
                X_b = self.model_wrapper.preprocess(raw_b)
                # Dicionário é mais seguro para o Keras mapear Inputs por nome
                yield ({"input_a": X_a, "input_b": X_b}, lbls)

        # 2. Definimos a assinatura (Tipos e Shapes)
        # Input: Dict com chaves 'input_a' e 'input_b', ambos (None, MAX_LEN) int32
        # Output: Tensor (None,) float32
        output_signature = (
            {
                "input_a": tf.TensorSpec(shape=(None, MAX_LEN), dtype=tf.int32),
                "input_b": tf.TensorSpec(shape=(None, MAX_LEN), dtype=tf.int32)
            },
            tf.TensorSpec(shape=(None,), dtype=tf.float32)
        )

        # 3. Criamos o objeto Dataset oficial
        tf_dataset = tf.data.Dataset.from_generator(
            final_gen, 
            output_signature=output_signature
        )

        steps_per_epoch = max(20, len(dataset) // (BATCH_SIZE // 4))
        print(f"[TREINO] Iniciando {EPOCHS} épocas com {steps_per_epoch} steps/epoch...")
        
        siamese_model.fit(
            tf_dataset,
            steps_per_epoch=steps_per_epoch,
            epochs=EPOCHS,
            verbose=1
        )

        print("-" * 50)
        print("[TREINO] Concluído.")
        self._save_artifacts(dataset)
        self._upload_artifacts_to_cloud()
        
        try:
            from app.calibrations.canonical_subject_calibration_v2 import find_gate_threshold
            print("\n[CALIBRAÇÃO] Verificando threshold ideal...")
            find_gate_threshold(self.model_wrapper, dataset)
        except Exception as e:
            print(f"[WARN] Calibração falhou ou não encontrada: {e}")

    # ==========================================================================
    # 4. PERSISTENCE
    # ==========================================================================
    def _save_artifacts(self, dataset):
        print("[PERSISTÊNCIA] Salvando...")

        shutil.copy(self.base_path, self.base_path + ".bak")
        with open(self.base_path, 'w', encoding='utf-8') as f:
            json.dump(dataset, f, indent=2, ensure_ascii=False)

        self.model_wrapper.model.save_weights(settings.ML_CANONICAL_WEIGHTS_PATH)
        print(f"[ARTIFACTS] Pesos salvos em: {settings.ML_CANONICAL_WEIGHTS_PATH}")

        print("[ARTIFACTS] Gerando memória vetorial (.npz)...")
        all_canonicals = [item["canonical"] for item in dataset]
        
        vectors = self.model_wrapper.embed_batch(all_canonicals)
        
        os.makedirs(os.path.dirname(settings.NN_MODEL_MEMORY_FILE_PATH), exist_ok=True)
        np.savez_compressed(
            settings.NN_MODEL_MEMORY_FILE_PATH, 
            keys=all_canonicals, 
            vectors=vectors
        )
        print(f"[ARTIFACTS] Memória salva com {len(vectors)} vetores.")

        with open(self.learned_path, 'w') as f: f.write("")

    def _upload_artifacts_to_cloud(self):
        try:
            storage_service.upload_file(settings.NN_MODEL_MEMORY_FILE_PATH, settings.NN_MODEL_MEMORY_FILE_ID)
            storage_service.upload_file(settings.ML_CANONICAL_WEIGHTS_PATH, settings.ML_CANONICAL_WEIGHTS_ID)
            print("[CLOUD] Upload concluído.")
        except Exception as e:
            print(f"[CLOUD] Erro no upload: {e}")

if __name__ == "__main__":
    trainer = TrainingYsnaCanonicalV2()
    trainer.train()