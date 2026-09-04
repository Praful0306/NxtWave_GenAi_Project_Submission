"""
VaaniTutor — Tier 6 LLM: Cloudflare Workers AI (server-ai).
Spec Section 6.5 (Tier 6: Cloudflare Edge LLM Fallback).
Model: @cf/meta/llama-3.3-70b-instruct
Timeout: 8.0s per tier.
"""

import httpx
from typing import Optional, Dict, Any
from ..config import settings
from .llm_utils import build_evaluation_prompt, parse_and_validate_llm_json

PROVIDER_NAME = "cloudflare"
MODEL_NAME = "@cf/meta/llama-3.3-70b-instruct"
TIER_TIMEOUT = httpx.Timeout(8.0, connect=3.0)


async def evaluate_cloudflare(
    target_sentence: str,
    user_transcript: str,
    language_code: str,
    user_level: str = "beginner",
    is_retry: bool = False,
) -> Optional[Dict[str, Any]]:
    """Call Cloudflare Workers AI endpoint with 8s timeout and 1 JSON retry."""
    keys = settings.cloudflare_keys
    account_id = settings.CLOUDFLARE_ACCOUNT_ID
    if not keys or not account_id:
        return None

    prompt = build_evaluation_prompt(target_sentence, user_transcript, language_code, user_level, is_retry)
    url = f"https://api.cloudflare.com/client/v4/accounts/{account_id}/ai/run/{MODEL_NAME}"
    payload = {
        "messages": [
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.3,
    }

    for api_key in keys:
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }
        try:
            async with httpx.AsyncClient(timeout=TIER_TIMEOUT) as client:
                resp = await client.post(url, headers=headers, json=payload)
                if resp.status_code == 200:
                    data = resp.json()
                    content = data.get("result", {}).get("response", "")
                    validated = parse_and_validate_llm_json(content, PROVIDER_NAME)
                    if validated:
                        return validated
                    elif not is_retry:
                        return await evaluate_cloudflare(
                            target_sentence, user_transcript, language_code, user_level, is_retry=True
                        )
                else:
                    print(f"[WARN] Cloudflare Workers AI returned {resp.status_code}: {resp.text}")
        except Exception as e:
            print(f"[WARN] Cloudflare Workers AI call failed or timed out (8s): {e}")

    return None
