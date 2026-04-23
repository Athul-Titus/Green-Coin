"""
GreenCoin — Groq LLM Client
Shared Groq client for all ML services.
"""
import json
import logging
from groq import Groq
from config import settings

logger = logging.getLogger("greencoin.llm")

_client = None


def get_groq_client() -> Groq:
    """Return a shared Groq client instance."""
    global _client
    if _client is None:
        _client = Groq(api_key=settings.GROQ_API_KEY)
    return _client


def ask_llm(system_prompt: str, user_prompt: str, temperature: float = 0.3) -> dict:
    """
    Send a prompt to Groq's Llama 3.1 and parse JSON from the response.
    Falls back to an empty dict on any error.
    """
    try:
        client = get_groq_client()
        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=temperature,
            max_tokens=1024,
            response_format={"type": "json_object"},
        )
        text = response.choices[0].message.content.strip()
        return json.loads(text)
    except Exception as e:
        logger.warning(f"Groq LLM call failed: {e}")
        return {}
