import random
import re
import unicodedata
from dataclasses import dataclass

@dataclass
class AugmentConfig:
    p_acronym_pure: float = 0.04      # sigla pura (FT) - raríssimo
    p_acronym_mixed: float = 0.18     # sigla + contexto (FEN. TRANSP. / FT TRANSP)
    p_stopword_drop: float = 0.25
    p_roman_to_arabic: float = 0.75   # alto pq resolve bug real
    p_truncate: float = 0.22
    p_join_number: float = 0.10       # CALC II -> CALCII
    p_split_number: float = 0.10      # CALCII -> CALC II
    p_zero_pad: float = 0.06          # 2 -> 02
    p_char_noise: float = 0.03        # typo pesado - raríssimo
    p_drop_punct: float = 0.12        # remove/normaliza pontuação

class SemanticAugmenterV2:
    """
    Objetivo: gerar 'sujeira real' sem destruir o sinal que separa matérias parecidas.
    Estratégia:
      A) Normalização determinística (quase sempre útil)
      B) Augmentações human-like (abreviações, siglas contextualizadas, números)
      C) Ruído pesado (typos) bem raro e controlado
    """

    def __init__(self):
        self.roman_map = {
            "I": "1", "II": "2", "III": "3", "IV": "4", "V": "5",
            "VI": "6", "VII": "7", "VIII": "8", "IX": "9", "X": "10"
        }
        self.stopwords = {"DE", "DA", "DO", "DAS", "DOS", "E", "PARA", "COM", "EM", "NA", "NO"}

        # Heurística: tokens que geralmente aparecem abreviados do jeito "humano"
        # ? (não é dicionário de matérias; é dicionário de *padrão de escrita*)
        self.common_abbrev = {
            "ENGENHARIA": "ENG",
            "ADMINISTRACAO": "ADM",
            "MECANICA": "MEC",
            "ELETRICA": "ELET",
            "ELETRONICA": "ELET",
            "COMPUTACAO": "COMP",
            "SISTEMAS": "SIS",
            "METODOS": "MET",
            "NUMERICOS": "NUM",
            "FISICA": "FIS",
            "QUIMICA": "QUI",
            "CALCULO": "CALC",
            "ALGEBRA": "ALG",
            "PROBABILIDADE": "PROB",
            "ESTATISTICA": "EST",
        }

        # Pontuação/separadores típicos em históricos e sistemas
        self.sep_regex = re.compile(r"[\/\-\–\—\:\;\,\(\)\[\]\{\}\|]+")

    # -----------------------------
    # PERFIS (controle de agressividade)
    # -----------------------------
    
    def augment(self, text: str, profile: str = "light") -> str:
        if not text:
            return ""

        cfg = self._profile_cfg(profile)

        # A) Normalização determinística: aumenta recall sem “inventar” semântica
        t = self._normalize(text)

        # B) Aplicar transformações "human-like"
        t = self._maybe_drop_punct(t, cfg)
        t = self._maybe_acronym(t, cfg)  # pode retornar sigla pura raramente, ou versão contextualizada
        t = self._token_level_ops(t, cfg)
        t = self._maybe_number_join_split(t, cfg)

        # C) Ruído pesado (bem raro)
        if random.random() < cfg.p_char_noise:
            t = self._char_noise(t)

        return re.sub(r"\s+", " ", t).strip()

    def _profile_cfg(self, profile: str) -> AugmentConfig:
        # Calibragem de probabilidades por perfil
        if profile == "light":
            return AugmentConfig(
                p_acronym_pure=0.01,
                p_acronym_mixed=0.10,
                p_stopword_drop=0.20,
                p_roman_to_arabic=0.80,
                p_truncate=0.12,
                p_join_number=0.06,
                p_split_number=0.06,
                p_zero_pad=0.02,
                p_char_noise=0.01,
                p_drop_punct=0.18,
            )
        if profile == "medium":
            return AugmentConfig(
                p_acronym_pure=0.03,
                p_acronym_mixed=0.18,
                p_stopword_drop=0.28,
                p_roman_to_arabic=0.75,
                p_truncate=0.22,
                p_join_number=0.10,
                p_split_number=0.10,
                p_zero_pad=0.05,
                p_char_noise=0.03,
                p_drop_punct=0.15,
            )
        # hard
        return AugmentConfig(
            p_acronym_pure=0.05,
            p_acronym_mixed=0.25,
            p_stopword_drop=0.35,
            p_roman_to_arabic=0.65,
            p_truncate=0.30,
            p_join_number=0.14,
            p_split_number=0.14,
            p_zero_pad=0.08,
            p_char_noise=0.06,
            p_drop_punct=0.12,
        )

    # -----------------------------
    # NORMALIZAÇÃO
    # -----------------------------
    def _normalize(self, text: str) -> str:
        t = text.strip().upper()

        # remove acentos (CÁLCULO -> CALCULO)
        t = "".join(
            c for c in unicodedata.normalize("NFKD", t)
            if not unicodedata.combining(c)
        )

        # normaliza separadores em espaço
        t = self.sep_regex.sub(" ", t)

        # remove caracteres “estranhos” mantendo letras/números/espaço/ponto
        t = re.sub(r"[^A-Z0-9\.\s]", " ", t)
        t = re.sub(r"\s+", " ", t).strip()

        return t

    def _maybe_drop_punct(self, t: str, cfg: AugmentConfig) -> str:
        # Em geral histórico vem como "ENG. MEC." / "CALC. II"
        # Aqui você simula às vezes tirar pontos (ENG. -> ENG) ou o contrário (ENG -> ENG.)
        if random.random() < cfg.p_drop_punct:
            # remove pontos excedentes
            t = re.sub(r"\.+", ".", t)
            # 50/50: remove todos os pontos ou deixa como está
            if random.random() < 0.5:
                t = t.replace(".", "")
        return t

    # -----------------------------
    # SIGLAS / ACRÔNIMOS
    # -----------------------------

    def _maybe_acronym(self, t: str, cfg: AugmentConfig) -> str:
        words = t.split()
        if len(words) < 2:
            return t

        # gera sigla baseada em palavras relevantes
        acronym = self._generate_acronym(words)
        if len(acronym) < 2:
            return t

        r = random.random()

        # Sigla pura (raríssima)
        if r < cfg.p_acronym_pure:
            return acronym

        # Sigla contextualizada (mais real): "FT TRANSP" ou "FEN. TRANSP."
        if r < (cfg.p_acronym_pure + cfg.p_acronym_mixed):
            # duas variantes comuns:
            if random.random() < 0.5:
                # "FT" + uma palavra-chave do final (ajuda a não colapsar tudo)
                tail = self._pick_tail_keyword(words)
                if tail:
                    return f"{acronym} {tail}"
                return acronym
            else:
                # abreviação por token: "FEN. TRANSP."
                return self._abbrev_phrase(words)

        return t

    def _generate_acronym(self, words: list[str]) -> str:
        letters = []
        for w in words:
            if w in self.stopwords:
                continue
            if w.isdigit():
                continue
            # ignora tokens muito curtos (ex.: "I", "II" já cai em isdigit depois de map)
            if len(w) < 2:
                continue
            letters.append(w[0])
        return "".join(letters)

    def _pick_tail_keyword(self, words: list[str]) -> str:
        # pega uma palavra “distintiva” no final (geralmente onde está a especificação)
        # ex: FENOMENOS DE TRANSPORTE -> TRANSPORTE
        candidates = [w for w in words[::-1] if w not in self.stopwords and not w.isdigit() and len(w) >= 4]
        return candidates[0] if candidates else ""

    def _abbrev_phrase(self, words: list[str]) -> str:
        out = []
        for w in words:
            if w in self.stopwords:
                # stopwords às vezes somem em abreviação
                if random.random() < 0.6:
                    continue
                out.append(w)
                continue
            out.append(self._abbrev_token(w))
        return " ".join(out)

    # -----------------------------
    # OPERAÇÕES POR TOKEN
    # -----------------------------
    def _token_level_ops(self, t: str, cfg: AugmentConfig) -> str:
        words = t.split()
        new_words = []

        for w in words:
            # stopword drop
            if w in self.stopwords and random.random() < cfg.p_stopword_drop:
                continue

            # roman -> arabic
            if w in self.roman_map and random.random() < cfg.p_roman_to_arabic:
                new_words.append(self.roman_map[w])
                continue

            # truncation / abbreviations
            if len(w) >= 4 and not w.isdigit() and random.random() < cfg.p_truncate:
                new_words.append(self._abbrev_token(w))
                continue

            new_words.append(w)

        return " ".join(new_words)

    def _abbrev_token(self, word: str) -> str:
        # 1) padrão humano “comum” (não é dicionário de matérias; é dicionário de escrita)
        if word in self.common_abbrev and random.random() < 0.75:
            base = self.common_abbrev[word]
            # às vezes coloca ponto
            if random.random() < 0.5:
                return base + "."
            return base

        # 2) heurística: abreviação com cara humana
        #    - mínimo 3
        #    - evita cortar em lugar merda: tenta parar após uma vogal (aprox. “sílabas”)
        min_len = 3
        if len(word) <= min_len:
            return word

        cut = self._human_cut_point(word, min_len=min_len)
        token = word[:cut]

        if random.random() < 0.55:
            token += "."
        return token

    def _human_cut_point(self, w: str, min_len: int = 3) -> int:
        vowels = set("AEIOU")
        # escolhe um alvo entre 3 e 6 (abreviação humana normalmente não passa disso)
        target = random.randint(min_len, min(6, len(w) - 1))

        # tenta ajustar para terminar em vogal (ex: "FENOMENOS" -> "FENO.")
        # se não achar, fica no target mesmo
        for i in range(target, min(len(w) - 1, target + 2)):
            if w[i-1] in vowels:
                return i
        return target

    # -----------------------------
    # NÚMEROS COLADOS / SEPARADOS / ZERO PAD
    # -----------------------------
    def _maybe_number_join_split(self, t: str, cfg: AugmentConfig) -> str:
        # junta: "CALCULO II" -> "CALCULOII" (ou "CALCULO2")
        if random.random() < cfg.p_join_number:
            t = re.sub(r"\b([A-Z]{3,})\s+([0-9]{1,2})\b", r"\1\2", t)

        # separa: "CALCULO2" -> "CALCULO 2"
        if random.random() < cfg.p_split_number:
            t = re.sub(r"\b([A-Z]{3,})([0-9]{1,2})\b", r"\1 \2", t)

        # zero pad: "2" -> "02"
        if random.random() < cfg.p_zero_pad:
            t = re.sub(r"\b([0-9])\b", r"0\1", t)

        return t

    # -----------------------------
    # TYPO NOISE
    # -----------------------------
    def _char_noise(self, text: str) -> str:
        # erro simples e barato: swap de vizinhos, mas evitando mexer em espaços
        if len(text) < 5:
            return text

        idxs = [i for i in range(len(text) - 1) if text[i] != " " and text[i+1] != " "]
        if not idxs:
            return text

        i = random.choice(idxs)
        arr = list(text)
        arr[i], arr[i+1] = arr[i+1], arr[i]
        return "".join(arr)


augmenter = SemanticAugmenterV2()

# Gera N variações em perfis diferentes (é bom pra treinar contrastivo)
def generate_variants(text: str, n: int = 8) -> list[str]:
    profiles = (["light"] * 5) + (["medium"] * 2) + (["hard"] * 1)
    out = []
    for _ in range(n):
        p = random.choice(profiles)
        out.append(augmenter.augment(text, profile=p))
    return out
