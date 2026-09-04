"""
VaaniTutor — Tier 4 LLM: Groq Llama 3.3 70B Versatile (server-ai).
Spec Section 6.5 (Tier 4: Ultra-Low-Latency Large Context Fallback).
Model: llama-3.3-70b-versatile
Timeout: 8.0s per tier.
"""

import httpx
from typing import Optional, Dict, Any
from ..config import settings
from .llm_utils import build_evaluation_prompt, parse_and_validate_llm_json

PROVIDER_NAME = "groq-llama"
MODEL_NAME = "llama-3.3-70b-versatile"
TIER_TIMEOUT = httpx.Timeout(8.0, connect=3.0)


CANDIDATE_MODELS = [
    "llama-3.3-70b-versatile",
    "openai/gpt-oss-120b",
    "openai/gpt-oss-20b",
]


async def evaluate_groq_llama(
    target_sentence: str,
    user_transcript: str,
    language_code: str,
    user_level: str = "beginner",
    is_retry: bool = False,
) -> Optional[Dict[str, Any]]:
    """Call Groq endpoint with candidate models, 8s timeout, and 1 JSON retry."""
    keys = settings.groq_keys
    if not keys:
        return None

    prompt = build_evaluation_prompt(target_sentence, user_transcript, language_code, user_level, is_retry)
    url = "https://api.groq.com/openai/v1/chat/completions"

    for api_key in keys:
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }
        for model in CANDIDATE_MODELS:
            payload = {
                "model": model,
                "messages": [
                    {"role": "user", "content": prompt}
                ],
                "temperature": 0.3,
                "response_format": {"type": "json_object"},
            }
            try:
                async with httpx.AsyncClient(timeout=TIER_TIMEOUT) as client:
                    resp = await client.post(url, headers=headers, json=payload)
                    if resp.status_code == 200:
                        data = resp.json()
                        content = data["choices"][0]["message"]["content"]
                        validated = parse_and_validate_llm_json(content, PROVIDER_NAME)
                        if validated:
                            return validated
                        elif not is_retry:
                            return await evaluate_groq_llama(
                                target_sentence, user_transcript, language_code, user_level, is_retry=True
                            )
                    elif resp.status_code == 404:
                        # Model not available in this region/key, try next candidate
                        continue
                    else:
                        print(f"[WARN] Groq LLM ({model}) returned {resp.status_code}: {resp.text}")
            except Exception as e:
                print(f"[WARN] Groq LLM call ({model}) failed or timed out (8s): {e}")

    return None
