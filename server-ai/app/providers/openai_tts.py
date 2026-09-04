"""
VaaniTutor — Tier 2 TTS: OpenAI TTS (server-ai).
Spec Section 6.2 (Tier 2: Fallback TTS, English & general fallback).
Model: tts-1, Voice: alloy / shimmer
"""

import httpx
from typing import Optional, Tuple
from ..config import settings

PROVIDER_NAME = "openai-tts"
OPENAI_TTS_URL = "https://api.openai.com/v1/audio/speech"
TIER_TIMEOUT = httpx.Timeout(6.0, connect=3.0)


async def synthesize_openai_tts(
    text: str,
    language_code: str,
    voice: str = "alloy",
    speed: float = 1.0,
) -> Optional[Tuple[bytes, str, str]]:
    """
    Synthesize speech using OpenAI TTS.
    Returns: Tuple[audio_bytes, content_type, provider_name] or None.
    """
    api_key = settings.OPENAI_API_KEY
    if not api_key:
        return None

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": "tts-1",
        "input": text.strip(),
        "voice": voice,
        "response_format": "mp3",
        "speed": max(0.5, min(2.0, speed)),
    }

    try:
        async with httpx.AsyncClient(timeout=TIER_TIMEOUT) as client:
            resp = await client.post(OPENAI_TTS_URL, headers=headers, json=payload)
            if resp.status_code == 200:
                return (resp.content, "audio/mpeg", PROVIDER_NAME)
            else:
                print(f"[WARN] OpenAI TTS returned HTTP {resp.status_code}: {resp.text[:150]}")
    except Exception as e:
        print(f"[WARN] OpenAI TTS attempt failed: {e}")

    return None
