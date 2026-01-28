import random
from collections import defaultdict
from typing import List, Dict, Any, Tuple, Optional

# Helper para identificar níveis hierárquicos
ROMAN_TO_INT = {
    "I": 1, "II": 2, "III": 3, "IV": 4, "V": 5,
    "VI": 6, "VII": 7, "VIII": 8, "IX": 9, "X": 10
}

class StratifiedBatchGenerator:
    """
    Gerador de Batches para Contrastive Learning com Hard Negative Mining.
    
    Diferenciais da V3:
    1. SimCLR Approach: Gera duas views distorcidas (View1, View2) em vez de (Canonical, View).
    2. Sibling Awareness: Detecta e agrupa I, II, III para forçar distinção numérica.
    3. Gradient Safety: Garante que um canonical nunca apareça 2x no mesmo batch.
    """

    def __init__(
        self,
        dataset: List[Dict[str, Any]],
        augmenter,
        p_use_vars: float = 0.90, # 90% das vezes usa dados reais do histórico
        profile_weights: Optional[List[Tuple[str, float]]] = None,
        p_force_numeric_siblings: float = 0.80, # 80% das vezes força famílias numeradas
    ):
        self.dataset = dataset
        self.augmenter = augmenter
        self.p_use_vars = p_use_vars
        self.p_force_numeric_siblings = p_force_numeric_siblings

        if profile_weights is None:
            # Maioria Light/Medium para manter a semântica legível
            profile_weights = [("light", 0.55), ("medium", 0.38), ("hard", 0.07)]
        
        self.profile_weights = profile_weights
        self._profile_pool = self._build_weighted_pool(profile_weights)

        # --- Indexação Inteligente ---
        self.by_root = defaultdict(list)          # "CALCULO" -> [...]
        self.by_family = defaultdict(list)        # "CALCULO_DIFERENCIAL" -> [...]
        self.sibling_map = defaultdict(list)      # "FISICA" -> [FISICA_I, FISICA_II...] (Ordenado)

        for item in self.dataset:
            canon = item["canonical"]
            
            # Index por Root (Primeira palavra)
            root = canon.split("_")[0]
            self.by_root[root].append(item)

            # Index por Família e Nível
            base_family, level = self._split_family_and_level(canon)
            self.by_family[base_family].append(item)

        # Constrói o mapa de irmãos ordenados (I < II < III)
        for base_family, items in self.by_family.items():
            leveled = []
            for it in items:
                _, lvl = self._split_family_and_level(it["canonical"])
                if lvl is not None:
                    leveled.append((lvl, it))
            
            # Só nos interessa famílias com pelo menos 2 níveis para contrastar
            if len(leveled) >= 2:
                leveled.sort(key=lambda x: x[0]) # Ordena por int (1, 2, 3...)
                self.sibling_map[base_family] = [it for _, it in leveled]

        self.root_keys = list(self.by_root.keys())
        self.sibling_families = list(self.sibling_map.keys())

        print(f"[BATCH GEN V3] Indexação concluída.")
        print(f"   |__ Famílias com Numeração (Siblings): {len(self.sibling_families)} (Ex: Calc I/II/III)")
        print(f"   |__ Clusters Temáticos (Roots): {len(self.root_keys)}")

    # --------------------------
    # CORE API
    # --------------------------
    def get_batch(self, batch_size: int) -> Tuple[List[str], List[str]]:
        if batch_size < 2: raise ValueError("Batch size deve ser >= 2")

        used_canonicals = set()
        anchors, positives = [], []

        # Cota para Hard Negatives (Metade do batch tenta ser do mesmo tema)
        hard_quota = max(1, batch_size // 2)

        # 1. Seleciona um Cluster Difícil (Prioriza Siblings: I vs II vs III)
        hard_pool = self._pick_hard_pool()

        # 2. Preenche a cota Hard (sem repetir canonicals)
        self._fill_from_pool(hard_pool, hard_quota, anchors, positives, used_canonicals, prefer_siblings=True)

        # 3. Completa o resto com aleatoriedade global (Ruído de Fundo)
        remaining = batch_size - len(anchors)
        if remaining > 0:
            # Copia rasa para shuffle seguro
            global_pool = list(self.dataset) 
            random.shuffle(global_pool)
            self._fill_from_pool(global_pool, remaining, anchors, positives, used_canonicals, prefer_siblings=False)

        # 4. Fallback de Segurança (Se dataset for minúsculo e faltar gente)
        guard = 0
        while len(anchors) < batch_size and guard < batch_size * 5:
            guard += 1
            it = random.choice(self.dataset)
            if it["canonical"] in used_canonicals:
                continue
            
            a, p = self._make_two_views(it)
            used_canonicals.add(it["canonical"])
            anchors.append(a)
            positives.append(p)

        # 5. Embaralhamento Final (Mistura o Hard com o Global)
        combined = list(zip(anchors, positives))
        random.shuffle(combined)
        anchors, positives = zip(*combined)
        
        return list(anchors), list(positives)

    # --------------------------
    # LÓGICA INTERNA
    # --------------------------
    def _make_two_views(self, item: Dict[str, Any]) -> Tuple[str, str]:
        """
        Gera duas visões independentes do MESMO conceito.
        Estratégia SimCLR: A rede deve aprender que View1 ~= View2.
        """
        # Escolhe a base textual (pode ser o canonical ou uma variação real existente)
        base1 = self._pick_base_text(item)
        base2 = self._pick_base_text(item)

        # Aplica Augmentation com perfis variados
        # View 1: Tende a ser mais limpa (Light/Medium)
        prof1 = random.choice(["light", "light", "medium"])
        # View 2: Totalmente aleatória (pode ser Hard)
        prof2 = self._pick_profile()

        view1 = self.augmenter.augment(base1, profile=prof1)
        view2 = self.augmenter.augment(base2, profile=prof2)

        return view1, view2

    def _pick_base_text(self, item: Dict[str, Any]) -> str:
        """Usa vars reais com alta probabilidade (Dataset Real > Sintético)."""
        vars_list = item.get("vars") or []
        if vars_list and random.random() < self.p_use_vars:
            return random.choice(vars_list)
        return item["canonical"]

    def _pick_hard_pool(self) -> List[Dict[str, Any]]:
        """Escolhe qual 'família' vai dominar a parte Hard do batch."""
        # Alta chance de pegar famílias numeradas (I, II, III)
        if self.sibling_families and random.random() < self.p_force_numeric_siblings:
            fam = random.choice(self.sibling_families)
            return self.sibling_map[fam] # Já retorna lista ordenada

        # Fallback: Pega qualquer tema comum (Root)
        root = random.choice(self.root_keys) if self.root_keys else None
        if root:
            return self.by_root[root]

        return self.dataset

    def _fill_from_pool(self, pool: List[Dict[str, Any]], k: int, 
                       anchors: list, positives: list, used: set, prefer_siblings: bool):
        if k <= 0 or not pool: return

        # Se for sibling pool, tenta pegar extremos (I e IV) para maximizar contraste
        candidates = pool
        if prefer_siblings and len(pool) >= 3:
            # Reorganiza: [Primeiro, Último, Meio...]
            # Ex: [Calc I, Calc II, Calc III, Calc IV] -> [Calc I, Calc IV, Calc II, Calc III]
            candidates = [pool[0], pool[-1]] + pool[1:-1]
        
        count = 0
        for it in candidates:
            if count >= k: break
            if it["canonical"] in used: continue

            a, p = self._make_two_views(it)
            
            used.add(it["canonical"])
            anchors.append(a)
            positives.append(p)
            count += 1

    def _split_family_and_level(self, canonical: str) -> Tuple[str, Optional[int]]:
        """Detecta numerais no final da string (I, II, 3, IV...)."""
        parts = canonical.split("_")
        if not parts: return canonical, None
        
        last = parts[-1]
        if last.isdigit():
            return "_".join(parts[:-1]), int(last)
        
        if last in ROMAN_TO_INT:
            return "_".join(parts[:-1]), ROMAN_TO_INT[last]
            
        return canonical, None

    def _build_weighted_pool(self, weights: List[Tuple[str, float]]) -> List[str]:
        pool = []
        for name, w in weights:
            n = int(round(w * 100))
            pool.extend([name] * max(1, n))
        return pool

    def _pick_profile(self) -> str:
        return random.choice(self._profile_pool)
