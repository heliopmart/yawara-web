import tensorflow as tf
from typing import List

def build_deep_set_architecture(
    max_subjects: int,
    hashing_bins_subjects: int,
    hashing_bins_courses: int, 
    embedding_dim: int,
    nuclei_labels: List[str],
    learning_rate: float = 0.001
) -> tf.keras.Model:
    """
    Arquitetura Deep Set v2.
    Inputs: 
      1. Matérias (Nomes)
      2. Matérias (Notas/Carga)
      3. Contexto (Semestre)
      4. Contexto (Curso - Novo!)
    """
    
    # --- INPUTS ---
    input_subj_names = tf.keras.Input(shape=(max_subjects,), dtype=tf.string, name="subject_names")
    input_subj_meta = tf.keras.Input(shape=(max_subjects, 2), dtype=tf.float32, name="subject_meta") # [Nota, Carga]
    
    input_semester = tf.keras.Input(shape=(1,), dtype=tf.float32, name="semester")
    input_course = tf.keras.Input(shape=(1,), dtype=tf.string, name="course_name") # Ex: "ENGENHARIA_MECANICA"

    # --- RAMO A: PROCESSAMENTO DE MATÉRIAS (Deep Set) ---
    
    # Hashing & Embedding das Matérias
    x_subj = tf.keras.layers.Hashing(num_bins=hashing_bins_subjects, output_mode="int")(input_subj_names)
    x_subj = tf.keras.layers.Embedding(input_dim=hashing_bins_subjects, output_dim=embedding_dim, mask_zero=True)(x_subj)
    
    # Concatena Embedding da Matéria + Nota + Carga
    x_combined = tf.keras.layers.Concatenate(axis=-1)([x_subj, input_subj_meta])

    # Phi Network (Processa cada matéria individualmente)
    x = tf.keras.layers.Dense(64, activation="relu")(x_combined)
    x = tf.keras.layers.Dropout(0.2)(x)
    
    # Pooling (Média Global - Ignora zeros/padding)
    student_academic_vector = tf.keras.layers.GlobalAveragePooling1D()(x)

    # --- RAMO B: CONTEXTO (Curso e Semestre) ---
    
    # Hashing & Embedding do Curso
    x_course = tf.keras.layers.Hashing(num_bins=hashing_bins_courses, output_mode="int")(input_course)
    x_course = tf.keras.layers.Embedding(input_dim=hashing_bins_courses, output_dim=16)(x_course)
    x_course = tf.keras.layers.Flatten()(x_course)

    # Junta Curso + Semestre
    context_vector = tf.keras.layers.Concatenate()([x_course, input_semester])
    context_vector = tf.keras.layers.Dense(32, activation="relu")(context_vector)

    # --- MERGE & HEAD ---
    
    # Junta o Histórico com o Contexto
    final_vector = tf.keras.layers.Concatenate()([student_academic_vector, context_vector])
    
    y = tf.keras.layers.Dense(128, activation="relu")(final_vector)
    y = tf.keras.layers.Dropout(0.3)(y)
    y = tf.keras.layers.Dense(64, activation="relu")(y)

    # SAÍDA: Sigmoid (Probabilidade independente para cada núcleo)
    output = tf.keras.layers.Dense(len(nuclei_labels), activation="sigmoid", name="nuclei_probs")(y)

    model = tf.keras.Model(
        inputs=[input_subj_names, input_subj_meta, input_semester, input_course], 
        outputs=output,
        name="Yawara_Engine_V2"
    )
    
    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=learning_rate),
        loss="binary_crossentropy",
        metrics=["binary_accuracy"]
    )
    
    return model