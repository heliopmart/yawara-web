"""
Módulo Cliente LLM (Large Language Model Client).

Responsável por encapsular toda a complexidade de comunicação com a API do Google Gemini.
Implementa padrões de resiliência como Rate Limiting, tratamento de erros de rede
e limpeza de respostas JSON (Sanitization).
"""

import json
import re
import time
import logging
import google.generativeai as genai
from typing import List, Tuple, Dict, Any

from app.core.config import settings

logger = logging.getLogger("yawara.services.llm")

class GeminiClient:
    """
    Cliente wrapper para o Google Generative AI com Rate Limiting integrado.
    """
    
    # Configuração do Rate Limiter (2.0s = 30 RPM - Seguro para Free Tier)
    MIN_REQUEST_INTERVAL = 2.0

    def __init__(self):
        self._configure_api()
        self._last_call_timestamp = 0.0
        self.model = genai.GenerativeModel('gemini-2.5-flash')

    def _configure_api(self):
        try:
            genai.configure(api_key=settings.GOOGLE_API_KEY)
        except Exception as e:
            logger.error(f"Falha ao configurar API Gemini: {e}")

    def _enforce_rate_limit(self):
        """Bloqueia a execução se necessário para respeitar a quota da API."""
        elapsed = time.time() - self._last_call_timestamp
        if elapsed < self.MIN_REQUEST_INTERVAL:
            time.sleep(self.MIN_REQUEST_INTERVAL - elapsed)
        
        self._last_call_timestamp = time.time()

    def check_concept_ambiguity(self, raw_input: str, candidates: List[Tuple[str, float]]) -> Dict[str, Any]:
        """
        Consulta o Gemini para decidir se um termo é sinônimo ou novo conceito.
        """
        self._enforce_rate_limit()

        # Constrói o contexto para a IA
        candidates_text = "\n".join([f"- {name} ({score:.1%})" for name, score in candidates])
        
        prompt = f"""
        Você é o Kernel Semântico do Yawara.
        INPUT: "{raw_input}"
        
        MEMÓRIA NEURAL (Candidatos próximos):
        {candidates_text}
        
        TAREFA:
        O input é semanticamente IGUAL a algum candidato (sinônimo, abreviação)?
        Ou é um conceito NOVO (disciplina distinta)?
        
        RESPOSTA JSON APENAS:
        {{
            "canonical": "NOME_EXISTENTE_OU_NOVO_PADRONIZADO",
            "is_new": boolean,
            "reasoning": "curta explicação"
        }}
        """

        try:
            if settings.ENVIRONMENT == "development_local_mock":
                raise Exception("MOCK MODE")

            response = self.model.generate_content(
                prompt,
                generation_config={"response_mime_type": "application/json"}
            )
            
            return self._parse_json_response(response.text)

        except Exception as e:
            logger.error(f"Erro na chamada LLM: {str(e)}")
            # Relança para o Resolver decidir o fallback
            raise e

    def _parse_json_response(self, text: str) -> Dict[str, Any]:
        """Limpa e converte a resposta Markdown/String para Dict."""
        clean_text = re.sub(r"^```json\s*", "", text)
        clean_text = re.sub(r"\s*```$", "", clean_text)
        return json.loads(clean_text)