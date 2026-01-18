"""
Módulo Cliente LLM (Large Language Model Client).

Responsável por encapsular a comunicação com a API do Google Gemini.
Implementa padrões de resiliência e sanitização de JSON.
"""

import json
import time
import re
import logging
import google.generativeai as genai

# from google import genai

from typing import Dict, Any, List

from app.core.config import settings

logger = logging.getLogger("yawara.services.llm")

class GeminiClient:
    """
    Cliente wrapper para o Google Generative AI com Rate Limiting integrado.
    """
    
    MIN_REQUEST_INTERVAL = 15.0

    def __init__(self):
        self.client = self._configure_api()
        self._last_call_timestamp = 0.0
        
        self.model_name = 'gemini-2.5-flash' 
        self.model = None
        self._init_model()

    def _configure_api(self):
        """Configura a chave de API globalmente."""
        try:
            if not settings.GOOGLE_API_KEY:
                logger.warning("GOOGLE_API_KEY não encontrada. LLM Client iniciará desativado.")
                return
            
            # return genai.Client(api_key=settings.GOOGLE_API_KEY)
            
            genai.configure(api_key=settings.GOOGLE_API_KEY)
        except Exception as e:
            logger.error(f"Falha ao configurar API Gemini: {e}")

    def _init_model(self):
        """Instancia o modelo generativo."""
        try:
            self.model = genai.GenerativeModel(self.model_name)
        except Exception as e:
            logger.error(f"Erro ao instanciar modelo {self.model_name}: {e}")

    def _enforce_rate_limit(self):
        """Bloqueia a execução brevemente se necessário para respeitar a quota."""
        elapsed = time.time() - self._last_call_timestamp
        if elapsed < self.MIN_REQUEST_INTERVAL:
            wait_time = self.MIN_REQUEST_INTERVAL - elapsed
            logger.debug(f"Rate Limit: Aguardando {wait_time:.2f}s...")
            time.sleep(wait_time)
        self._last_call_timestamp = time.time()

    def check_concept_ambiguity(self, raw_input: str, candidates: List) -> Dict[str, Any]:
        """
        Consulta a LLM para decidir se um termo é sinônimo ou novo conceito.
        """
        if not self.model:
            return {"canonical": "UNKNOWN", "is_new": False, "reasoning": "LLM Disabled"}

        self._enforce_rate_limit()

        # Formata lista de candidatos para o prompt
        candidates_text = "\n".join([f"- {name} (Score: {score:.1%})" for name, score in candidates])
        
        prompt = f"""
        Você é o Kernel Semântico do Yawara.
        
        INPUT DO HISTÓRICO: "{raw_input}"
        
        MEMÓRIA NEURAL (Candidatos parecidos encontrados):
        {candidates_text}
        
        TAREFA:
        O input refere-se à MESMA disciplina de algum candidato acima (sinônimo, abreviação, erro de OCR)?
        Ou é um conceito NOVO (disciplina distinta)?
        
        REGRAS:
        - Se for igual, retorne o nome canônico do candidato.
        - Se for novo, crie um nome padronizado (UPPERCASE_SNAKE_CASE).
        - Responda APENAS JSON válido.
        
        RESPOSTA JSON:
        {{
            "canonical": "NOME_PADRONIZADO",
            "is_new": boolean,
            "reasoning": "curta explicação"
        }}
        """

        try:
            # Modo Mock para testes locais (evita gastar quota)
            if getattr(settings, "ENVIRONMENT", "") == "development_local_mock":
                logger.info("Mockando resposta da LLM...")
                return {"canonical": raw_input.upper().replace(" ", "_"), "is_new": True, "reasoning": "MOCK"}

            response = self.model.generate_content(
                prompt,
                generation_config={"response_mime_type": "application/json"}
            )
            
            return self._parse_json_response(response.text)

        except Exception as e:
            print(e)
            # logger.error(f"Erro na chamada LLM: {str(e)}")

            timer = getattr(e, "retry_delay", {"seconds": 30}).get("seconds", 30)
            logger.warning(f"Aguardando {timer}s antes de nova tentativa...")

            # Retorna estrutura de erro segura para o Resolver não quebrar
            return {"canonical": "UNKNOWN", "is_new": False, "reasoning": "LLM Error", "time": timer}

    def _parse_json_response(self, text: str) -> Dict[str, Any]:
        """Limpa e converte a resposta para Dict."""
        try:
            # Remove crases de markdown se o modelo adicionar (```json ... ```)
            clean_text = text.replace("```json", "").replace("```", "").strip()
            return json.loads(clean_text)
        except json.JSONDecodeError:
            logger.error(f"Falha ao decodificar JSON da LLM: {text[:100]}...")
            return {"canonical": "UNKNOWN", "is_new": False, "reasoning": "Invalid JSON"}