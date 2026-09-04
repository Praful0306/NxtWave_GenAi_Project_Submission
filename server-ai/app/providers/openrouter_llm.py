"""
VaaniTutor — Tier 1 LLM: Sarvam-M via OpenRouter (server-ai).
Spec Section 6.5 (Tier 1: Primary Indic LLM).
Model: sarvamai/sarvam-m:free / sarvamai/sarvam-m
Timeout: 8.0s per tier.
Strict Rule: No internal model substitution. Only Sarvam-M is queried.
"""

import httpx
from typing import Optional, Dict, Any
from ..config import settings
from .llm_utils import build_evaluation_prompt, parse_and_validate_llm_json

PROVIDER_NAME = "sarvam-m"
# Prioritize :free variant, then standard slug. Strictly Sarvam-M only.
SARVAM_MODELS = ["sarvamai/sarvam-m:free", "sarvamai/sarvam-m"]
TIER_TIMEOUT = httpx.Timeout(8.0, connect=3.0)


async def evaluate_openrouter_sarvam(
    target_sentence: str,
    user_transcript: str,
    language_code: str,
    user_level: str = "beginner",
    is_retry: bool = False,
) -> Optional[Dict[str, Any]]:
    """
    Call Sarvam-M on OpenRouter with 8s timeout and 1 JSON retry rule.
    Strictly queries Sarvam-M slugs only. If unreachable, returns None
    so the router cleanly cascades to Tier 2 (Zoho Catalyst) and down the chain.
    """
    api_key = settings.OPENROUTER_API_KEY
    if not api_key:
        return None

    prompt = build_evaluation_prompt(target_sentence, user_transcript, language_code, user_level, is_retry)
    url = "https://openrouter.ai/api/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://vaanitutor.app",
        "X-Title": "VaaniTutor Indic Language Assessment",
    }

    for model in SARVAM_MODELS:
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
                        # Execute 1 retry on malformed JSON for this model
                        return await evaluate_openrouter_sarvam(
                            target_sentence, user_transcript, language_code, user_level, is_retry=True
                        )
                elif resp.status_code == 404:
                    # Model variant not active on OpenRouter, try next Sarvam-M slug
                    continue
                else:
                    print(f"[WARN] OpenRouter {model} returned {resp.status_code}: {resp.text[:200]}")
        except Exception as e:
            print(f"[WARN] OpenRouter {model} call failed or timed out (8s): {e}")

    # Neither Sarvam-M variant responded -> Return None so llm_router cascades to Tier 2 (Catalyst)
    return None
