"""
VaaniTutor — Tier 3 LLM: Google Gemini 1.5 Flash (server-ai).
Spec Section 6.5 (Tier 3: Multilingual General LLM).
Model: gemini-1.5-flash
Timeout: 8.0s per tier.
"""

import httpx
from typing import Optional, Dict, Any
from ..config import settings
from .llm_utils import build_evaluation_prompt, parse_and_validate_llm_json

PROVIDER_NAME = "gemini-flash"
MODEL_NAME = "gemini-1.5-flash"
TIER_TIMEOUT = httpx.Timeout(8.0, connect=3.0)


async def evaluate_gemini(
    target_sentence: str,
    user_transcript: str,
    language_code: str,
    user_level: str = "beginner",
    is_retry: bool = False,
) -> Optional[Dict[str, Any]]:
    """Call Google Gemini 1.5 Flash API with 8s timeout and 1 JSON retry."""
    keys = settings.gemini_keys
    if not keys:
        return None

    prompt = build_evaluation_prompt(target_sentence, user_transcript, language_code, user_level, is_retry)
    payload = {
        "contents": [
            {
                "parts": [
                    {"text": prompt}
                ]
            }
        ],
        "generationConfig": {
            "temperature": 0.3,
            "response_mime_type": "application/json",
        },
    }

    for api_key in keys:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL_NAME}:generateContent?key={api_key}"
        try:
            async with httpx.AsyncClient(timeout=TIER_TIMEOUT) as client:
                resp = await client.post(url, json=payload)
                if resp.status_code == 200:
                    data = resp.json()
                    candidates = data.get("candidates", [])
                    if candidates:
                        parts = candidates[0].get("content", {}).get("parts", [])
                        if parts:
                            content = parts[0].get("text", "")
                            validated = parse_and_validate_llm_json(content, PROVIDER_NAME)
                            if validated:
                                return validated
                            elif not is_retry:
                                return await evaluate_gemini(
                                    target_sentence, user_transcript, language_code, user_level, is_retry=True
                                )
                else:
                    print(f"[WARN] Gemini Flash LLM returned {resp.status_code}: {resp.text}")
        except Exception as e:
            print(f"[WARN] Gemini Flash LLM call failed or timed out (8s): {e}")

    return None
