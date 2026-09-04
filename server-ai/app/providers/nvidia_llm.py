"""
VaaniTutor — Tier 5 LLM: NVIDIA NIM Nemotron-4-340B (server-ai).
Spec Section 6.5 (Tier 5: NVIDIA NIM API Fallback).
Model: nvidia/nemotron-4-340b-instruct
Timeout: 8.0s per tier.
"""

import httpx
from typing import Optional, Dict, Any
from ..config import settings
from .llm_utils import build_evaluation_prompt, parse_and_validate_llm_json

PROVIDER_NAME = "nvidia-nim"
MODEL_NAME = "nvidia/nemotron-4-340b-instruct"
TIER_TIMEOUT = httpx.Timeout(8.0, connect=3.0)


async def evaluate_nvidia_nim(
    target_sentence: str,
    user_transcript: str,
    language_code: str,
    user_level: str = "beginner",
    is_retry: bool = False,
) -> Optional[Dict[str, Any]]:
    """Call NVIDIA NIM Nemotron endpoint with 8s timeout and 1 JSON retry."""
    keys = settings.nvidia_keys
    if not keys:
        return None

    prompt = build_evaluation_prompt(target_sentence, user_transcript, language_code, user_level, is_retry)
    url = "https://integrate.api.nvidia.com/v1/chat/completions"
    payload = {
        "model": MODEL_NAME,
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
                    content = data["choices"][0]["message"]["content"]
                    validated = parse_and_validate_llm_json(content, PROVIDER_NAME)
                    if validated:
                        return validated
                    elif not is_retry:
                        return await evaluate_nvidia_nim(
                            target_sentence, user_transcript, language_code, user_level, is_retry=True
                        )
                else:
                    print(f"[WARN] NVIDIA NIM LLM returned {resp.status_code}: {resp.text}")
        except Exception as e:
            print(f"[WARN] NVIDIA NIM LLM call failed or timed out (8s): {e}")

    return None
