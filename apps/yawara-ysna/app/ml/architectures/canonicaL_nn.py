import re
from unidecode import unidecode
from sentence_transformers import SentenceTransformer
import joblib
import os
from typing import List, Dict
from sklearn.metrics.pairwise import cosine_similarity
import json
import itertools
from datetime import datetime
import asyncio

from app.core.config import settings
from app.schemas.canonical import PredictResult, PredictDecisionScore

from app.utils.llm_client import GeminiClient

class YsnaCanonicalArchitecture:
    def __init__(self):
        self.llm_client = GeminiClient()
        self.model = SentenceTransformer('paraphrase-multilingual-MiniLM-L12-v2')

        self.canonical_space = None
        self.prototype_embeddings = None
        self.prototype_to_id = None

        self.save_log_data_path = f"{settings.NN_MODEL_CANONICAL_BASE_PATH}/{settings.NN_MODEL_LOGS_ID}"
        self.new_concept_path = f"{settings.NN_MODEL_CANONICAL_BASE_PATH}/{settings.NN_MODEL_CONCEPTS_ID}"
        self.base_labels_path = f"{settings.NN_MODEL_CANONICAL_BASE_PATH}/{settings.NN_MODEL_LABELS_ID}"
        self.cache_path = f"{settings.NN_MODEL_CANONICAL_BASE_PATH}/{settings.NN_MODEL_CACHE_ID}"

        # Remove stopwords ( Verbos de Ligação e Preposições Comuns)
        self.STOPWORDS = {"DE", "DO", "DA", "E", "O", "A", "PARA", "COM"}

        # Weights
        self.D = 0.6 # Distribution Threshold
        self.K = 0.10 # Separation Threshold
        self.alpha = 1 # Weight for Coverage In
        self.beta = 0.5 # Weight for Extras Out
        self.T = 0.01 # Secondary Score Threshold

        self._bootstrap_space()

    async def run_predict(self, raw_input) -> PredictResult:
        """
        Main function to run the prediction pipeline:
        1. Normalize the raw input text.
        2. Convert any detected Roman numerals in the normalized text to Arabic numerals.
        3. Encode the standardized input text into an embedding vector using the loaded model.
        4. Retrieve the top 2 most similar candidate canonical IDs based on cosine similarity between the input embedding and the prototype embeddings.
        5. Apply the primary decision logic to classify the input as "NEW_CONCEPT", "ACCEPT", or "SECONDARY_VALIDATION" based on the similarity scores and defined thresholds.
        6. If the classification is "SECONDARY_VALIDATION", calculate the coverage metrics (Coverage In and Extras Out) for the top 2 candidates and compute the secondary scores to make a final decision on whether to "ACCEPT" or "REVIEW" the input.
        7. Compile the results, including the decision, similarity scores, coverage metrics, and candidate information, into a structured format and save the decision log for future analysis.
        @param raw_input: The raw input string to be processed and classified
        @return: A dictionary containing the classification result, similarity scores, coverage metrics, candidate information, and other relevant details about the input and the decision-making process.
        """
        input_norm = self._normalize(raw_input)
        input_std = self._roman_to_arabic(input_norm)
        
        v = await self._encode(input_std)
        
        try:
            candidates = await self._retrieve_top2(v)
        
            # if dont have close canonical, set as new concept and save for new training
            if not candidates:
                await self._save_new_concept(input_std, self._convert_in_canonical(input_std) or "UNKNOWN")
                return PredictResult(
                    timestamp=datetime.now().isoformat(),
                    raw_input=raw_input,
                    input_std=input_std,
                    status="NEW_CONCEPT",
                    canonical_id=self._convert_in_canonical(input_std) or "UNKNOWN",
                    decision_scores=PredictDecisionScore(sim1=0.0, sim2=0.0, gap=0.0, s1=0.0, s2=0.0),
                    candidates=[]
                )

            c1, c2 = candidates[0], candidates[1]
            sim1, sim2 = c1['similarity'], c2['similarity']
            gap = sim1 - sim2

            status, _ = self._primary_gate(candidates)
            
            res_id = None
            s1, s2 = 0.0, 0.0
            
            if status == "SECONDARY_VALIDATION":
                cov_in1, ext_out1 = self._coverage_metrics(input_std, c1['best_alias'])
                s1 = self._calculate_secondary_score(cov_in1, ext_out1)
                
                cov_in2, ext_out2 = self._coverage_metrics(input_std, c2['best_alias'])
                s2 = self._calculate_secondary_score(cov_in2, ext_out2)
                
                status = self._secondary_decision(s1, s2)
                res_id = c1['canonical_id'] if status == "ACCEPT" and s1 > s2 else (c2['canonical_id'] if status == "ACCEPT" else None)

            elif status == "ACCEPT":
                res_id = c1['canonical_id']

            if status == "REVIEW":
                review_result = await self._llm_resolve_review(input_std, c1, c2)
                res_id = review_result.get("canonical", None)
                status = "ACCEPT" if res_id and res_id != "UNKNOWN" else "REVIEW"

            if(res_id is None):
                res_id = "UNKNOWN"

            result = PredictResult(
                timestamp=datetime.now().isoformat(),
                raw_input=raw_input,
                input_std=input_std,
                status=status,
                canonical_id=res_id or "UNKNOWN",
                decision_scores=PredictDecisionScore(
                    sim1=round(sim1, 4),
                    sim2=round(sim2, 4),
                    gap=round(gap, 4),
                    s1=round(s1, 4),
                    s2=round(s2, 4)
                ),
                candidates=candidates
            )

            await self._save_logs_decision(result)
            return result
        except Exception as e:
            print("------ Erro na predição ------\n\n", e)
            return self._fallback_response(raw_input, "PREDICTION_ERROR", [(candidates[0]['canonical_id'], candidates[0]['similarity'])] if candidates else None)
        

    def optimize_constants(self, test_cases):
        d_space = [0.60, 0.70, 0.75]        # Limiar de 'conhecido' 
        k_space = [0.01, 0.02, 0.05, 0.10]  # Limiar de separação (Gap) 
        beta_space = [0.5, 0.8, 1.2]        # Penalidade de extras (Beta) 
        t_space = [0.01, 0.05, 0.10]        # Margem de desempate
        
        best_config = None
        best_performance = -float('inf')
        
        combinations = list(itertools.product(d_space, k_space, beta_space, t_space))
        print(f"Iniciando busca em {len(combinations)} combinações...")

        for d, k, beta, t in combinations:
            correct = 0
            wrong = 0
            reviews = 0
            
            for case in test_cases:
                res = self._predict(case['input'], D=d, K=k, alpha=1.0, beta=beta, T=t)
                
                if res['status'] == "ACCEPT":
                    if res['canonical_id'] == case['expected']:
                        correct += 1
                    else:
                        wrong += 1
                elif res['status'] == "REVIEW":
                    reviews += 1
            
            # Recompensamos acertos (+2)
            # Penalizamos fortemente erros críticos (-10)
            # Penalizamos levemente o excesso de cautela/REVIEW (-0.5)
            score = (correct * 2.0) - (wrong * 10.0) - (reviews * 0.5)
            
            if score > best_performance:
                best_performance = score
                best_config = {"D": d, "K": k, "Beta": beta, "T": t, "Score": score}

        return best_config
    

    # ====================================
    # ============= CONFIGS ==============
    # ====================================

    def _bootstrap_space(self):
        """
        Load Amostral Space:
            - This function initializes the amostral space by loading prototype data and their corresponding embeddings.
            - If a cached version of the prototype embeddings exists, it loads the data from the cache to speed up initialization.
            - If the cache does not exist, it reads the base labels from a JSON file, processes the prototypes by normalizing and converting any Roman numerals to Arabic numerals, and then encodes the prototypes using the model to create the prototype embeddings. Finally, it saves this processed data to the cache for future use, allowing for faster initialization in subsequent runs.
        @return: None
        """
        if os.path.exists(self.cache_path):
            data = joblib.load(self.cache_path)
            self.prototype_embeddings = data['embeddings']
            self.prototype_to_id = data['ids']
            self.flat_prototypes = data['protos']
        else:
            print("--- Gerando Novo Espaço Amostral (Primeira Execução) ---")
            new_concept_space = []
            base_labels_space = []

            if os.path.exists(self.new_concept_path) and os.path.getsize(self.new_concept_path) > 0:
                with open(self.new_concept_path, 'r') as f:
                    try:
                        new_concept_space = json.load(f) or []
                    except json.JSONDecodeError:
                        new_concept_space = []

            if os.path.exists(self.base_labels_path) and os.path.getsize(self.base_labels_path) > 0:
                with open(self.base_labels_path, 'r') as f:
                    try:
                        base_labels_space = json.load(f) or []
                    except json.JSONDecodeError:
                        base_labels_space = []

            canonical_space = base_labels_space + new_concept_space

            flat_protos = []
            proto_ids = []

            for entry in canonical_space:
                for proto in entry['vars']:
                    clean_proto = self._roman_to_arabic(self._normalize(proto))
                    flat_protos.append(clean_proto)
                    proto_ids.append(entry['canonical'])

            self.flat_prototypes = flat_protos
            self.prototype_to_id = proto_ids
            self.prototype_embeddings = self.model.encode(flat_protos)

            joblib.dump({
                'embeddings': self.prototype_embeddings,
                'ids': self.prototype_to_id,
                'protos': self.flat_prototypes
            }, self.cache_path)

    # ====================================
    # ============= HANDLES ==============
    # ====================================

    def _normalize(self, raw_input: str) -> str:
        """
        Normalize Input Text:
        - Convert to uppercase
        - Remove accents
        - Remove specific punctuations (commas, parentheses, hyphens)
            - Normalize multiple spaces to a single space
            - Trim leading and trailing spaces
        @param raw_input: The raw input string to be normalized
        @return: A normalized string suitable for further processing
        """
        if not raw_input:
            return ""
        
        text = unidecode(raw_input.upper())
        text = re.sub(r'[,\(\)\-\.]', ' ', text)
        text = re.sub(r'\s+', ' ', text).strip()
        return text

    def _convert_in_canonical(self, input_std: str) -> str:
        return input_std.replace(" ", '_').upper()
    
    def _roman_to_arabic(self, input_norm: str) -> str:
        """
        Detect and Convert Roman Numerals to Arabic Numerals:
        - This function identifies common Roman numerals (I, II, III, IV, V, VI, VII, VIII, IX, X) in the input text and converts them to their Arabic numeral equivalents (1, 2, 3, 4, 5, 6, 7, 8, 9, 10).
        - The conversion is done using regular expressions to ensure that only standalone Roman numerals are replaced
            (e.g., 'I' in 'INTEGRAL' will not be replaced).
        @param input_norm: The normalized input string that may contain Roman numerals
        @return: A string with Roman numerals converted to Arabic numerals
        """
        roman_map = {
            r'\bI\b': '1',
            r'\bII\b': '2',
            r'\bIII\b': '3',
            r'\bIV\b': '4',
            r'\bV\b': '5',
            r'\bVI\b': '6',
            r'\bVII\b': '7',
            r'\bVIII\b': '8',
            r'\bIX\b': '9',
            r'\bX\b': '10'
        }
        
        text = input_norm
        for roman, arabic in roman_map.items():
            text = re.sub(roman, arabic, text)
            
        return text
    
    def _tokenize_for_coverage(self,text):
        """
        Tokenize the input text and create a coverage dictionary indicating the presence of each token. The function splits the input text into tokens and constructs a dictionary where each token is a key, and its value is 0 if the token is a stopword (common linking verbs and prepositions) or 1 if it is not a stopword. This coverage dictionary can be used to assess how well the input text covers important terms while ignoring common words that do not contribute to the meaning.
        @param text: The input text to be tokenized and analyzed for coverage
        @return: A dictionary where keys are tokens from the input text and values are 0 for stopwords and 1 for non-stopwords
        """
        tokens = text.split()
        return {t: (0 if t in self.STOPWORDS else 1) for t in tokens}
    
    async def _encode(self, input_std: str):
        """
        Mapeia o texto padronizado para um embedding vetorial.
        """
        return await asyncio.to_thread(self.model.encode, input_std)

    async def _retrieve_top2(self, input_vector):
        """
        Search for the top 2 most similar canonical IDs based on the input vector and the prototype embeddings. The function calculates cosine similarity between the input vector and each prototype embedding, then groups the results by canonical ID, selecting the highest similarity score for each ID (max pooling). Finally, it sorts the IDs by their best similarity score and returns the top 2 results, including the canonical ID, the best matching alias (prototype), and the similarity score.
        @param input_vector: The embedding vector of the input text
        """

        proto_embeddings = self.prototype_embeddings
        flat_protos = self.flat_prototypes
        proto_to_id = self.prototype_to_id

        # 1. Calculate similarity with all prototypes
        sims = cosine_similarity([input_vector], proto_embeddings)[0]
        
        # 2. Group results by ID, taking the maximum similarity for each ID (max pooling)
        id_scores = {}
        id_to_best_proto = {}
        
        for i, score in enumerate(sims):
            c_id = proto_to_id[i]
            if score > id_scores.get(c_id, -1):
                id_scores[c_id] = score
                id_to_best_proto[c_id] = flat_protos[i]
                
        # 3. Rank ids order by best similarity 
        sorted_ids = sorted(id_scores.items(), key=lambda x: x[1], reverse=True)
        
        top2 = []
        for i in range(min(2, len(sorted_ids))):
            c_id, score = sorted_ids[i]
            top2.append({
                "canonical_id": c_id,
                "best_alias": id_to_best_proto[c_id],
                "similarity": float(score)
            })
            
        return top2
    
    def _primary_gate(self, candidates, D=0.75, K=0.10):
        """
        Decision Logic for Classification:
        - This function implements the primary decision logic for classifying an input based on its similarity to
            the top 2 candidate canonical IDs. It uses two thresholds: D (Distribution Threshold) and K (Separation Threshold).
        - The function evaluates the similarity scores of the top 2 candidates and applies the following rules:
            1. If the highest similarity score (sim1) is below the Distribution Threshold (D), the input is classified as "NEW_CONCEPT".
            2. If the gap between the highest and second-highest similarity scores (sim1 - sim2) is greater than or equal to the Separation Threshold (K) and the highest similarity score (sim1) is above or equal to the Distribution Threshold (D), the input is classified as "ACCEPT".
            3. If neither of the above conditions are met, the input is classified as "SECONDARY_VALIDATION", indicating that further review is needed to determine the correct classification.
        @param candidates: A list of the top 2 candidate canonical IDs with their similarity scores
        @param D: Distribution Threshold for determining if the input is a new concept
        @param K: Separation Threshold for determining if the input can be accepted based on the gap between the top 2 candidates
        @return: A tuple containing the classification result ("NEW_CONCEPT", "ACCEPT", or "SECONDARY_VALIDATION") and the gap value for reference
        """
        D = self.D
        K = self.K

        sim1 = candidates[0]['similarity']
        sim2 = candidates[1]['similarity']
        gap = sim1 - sim2 # Difference between the top 2 similarity scores
        
        if sim1 < D:
            return "NEW_CONCEPT", gap
        
        if gap >= K and sim1 >= D:
            return "ACCEPT", gap
        
        # If neither condition is met, it falls into the secondary validation category
        return "SECONDARY_VALIDATION", gap

    def _coverage_metrics(self, input_text, canon_text):
        """
        Calculate Coverage Metrics:
        - This function computes two key metrics to evaluate how well the input text covers the canonical text:
            1. Coverage In: This metric measures the proportion of tokens in the input text that are present in the canonical text. It is calculated by summing the weights of the tokens in the input that are also found in the canonical text and dividing by the total weight of the input tokens.
            2. Extras Out: This metric measures the proportion of tokens in the canonical text that are not present in the input text. It is calculated by summing the weights of the tokens in the canonical text that are not found in the input text and dividing by the total weight of the canonical tokens.
        - The function uses the tokenization method that assigns a weight of 0 to stopwords (common linking verbs and prepositions) and a weight of 1 to non-stopwords, allowing it to focus on the meaningful content of the texts while ignoring common words that do not contribute to the overall meaning.
        @param input_text: The normalized input text to be evaluated for coverage
        @param canon_text: The normalized canonical text to be used as a reference for coverage evaluation
        @return: A tuple containing the Coverage In and Extras Out metrics, which indicate how well the input text covers the canonical text and how much extra information is present in the canonical text that is not covered by the input text, respectively.
        """
        in_tokens = self._tokenize_for_coverage(input_text)
        can_tokens = self._tokenize_for_coverage(canon_text)
        
        # Sum of the weights of the input tokens
        total_in_weight = sum(in_tokens.values())
        # Sum of the weights of the canonical tokens
        total_can_weight = sum(can_tokens.values())
        
        # 1. Coverage In: O que da entrada está no canônico?
        covered_weight = sum(weight for t, weight in in_tokens.items() if t in can_tokens)
        coverage_in = covered_weight / total_in_weight if total_in_weight > 0 else 0
        
        # 2. Extras Out: O que o canônico tem a mais que não está na entrada?
        extra_weight = sum(weight for t, weight in can_tokens.items() if t not in in_tokens)
        extras_out = extra_weight / total_can_weight if total_can_weight > 0 else 0
        
        return coverage_in, extras_out
    
    def _calculate_secondary_score(self, coverage_in, extras_out):
        """
        Calcula o score final de desempate usando os pesos calibráveis.
        """
        alpha = self.alpha
        beta = self.beta

        return alpha * coverage_in - beta * extras_out

    def _secondary_decision(self, s1, s2):
        """
        Secondary Decision Logic:
        - This function implements the secondary decision logic for classifying an input that falls into the "SECONDARY_VALIDATION" category based on its coverage metrics. It uses a secondary score (s1) calculated from the Coverage In and Extras Out metrics, and a secondary score threshold (T) to determine the final classification.
        - The function applies the following rule:
            1. If the secondary score (s1) is greater than or equal to the secondary score threshold (T) and s1 is positive, the input is classified as "ACCEPT".
            2. If the above condition is not met, the input is classified as "REVIEW", indicating that it is ambiguous and requires further review to determine the correct classification.
        @param s1: The secondary score calculated from the coverage metrics
        @param s2: The secondary score threshold for determining if the input can be accepted based on its coverage metrics
        @return: A string indicating the final classification result ("ACCEPT" or "REVIEW") based on the secondary decision logic
        """
        T = self.T

        delta = s1 - s2 
        
        # If difference is above threshold and s1 is positive, we can accept
        if delta >= T and s1 > 0:
            return "ACCEPT"
        
        return "REVIEW" # if not, ambiguous, needs review

    async def _llm_resolve_review(self, input_text, c1_alias, c2_alias):
        """
        Call llm for resolve review problems
        @param input_text: The normalized input text that requires review
        @param c1_alias: The best matching alias (prototype) of the first candidate canonical ID
        @param c2_alias: The best matching alias (prototype) of the second candidate canonical ID
        @return: A string indicating the final classification result ("ACCEPT" or "REVIEW") based on the LLM's analysis.
        """
        try:
            decision = await asyncio.to_thread(
                self.llm_client.check_concept_ambiguity, 
                input_text, 
                [[c1_alias.get("canonical_id"), c1_alias.get("similarity")], [c2_alias.get("canonical_id"), c2_alias.get("similarity")]]
            )

            print(decision)
            
            canonical = decision.get("canonical", "UNKNOWN").upper().strip().replace(" ", "_")
            reasoning = decision.get("reasoning", "LLM Decision")

            await self._save_new_concept(input_text, canonical)

            return {
                "canonical_id": canonical,
                "confidence": 1.0,
                "source": "LLM_GENERATION",
                "status": True,
                "reasoning": reasoning
            }

        except Exception as e:
            return self._fallback_response(input_text, "LLM_ERROR", [c1_alias, c2_alias])

    def _fallback_response(self, raw_input: str, source: str, candidates: List = None) -> Dict:
        """
        If have any error in LLM call, fallback to this response, which can be the top candidate or just the raw input as canonical.
        @param raw_input: The original raw input string that was being processed when the error occurred
        @param source: A string indicating the source of the fallback response (e.g., "LLM_ERROR")
        @param candidates: A list of candidate canonical IDs that were being considered before the error occurred
        """
        fallback_name = candidates[0][0] if candidates else raw_input.upper().replace(" ", "_")
        return {
            "canonical_id": fallback_name,
            "confidence": 0.0,
            "source": source,
            "status": False
        }

    # ====================================
    # =============== SAVE ===============
    # ====================================

    async def _save_logs_decision(self, log_data):        
        with open(self.save_log_data_path, "a") as f:
           f.write(json.dumps(log_data.model_dump()) + "\n")
            
    
    async def _save_new_concept(self, input_text : str, canon_id : str):
        new_concept_data = {
            "canonical": canon_id,
            "vars": [input_text]
        }
        with open(self.new_concept_path, "a") as f:
            f.write(json.dumps(new_concept_data) + "\n")