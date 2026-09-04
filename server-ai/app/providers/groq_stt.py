"""
VaaniTutor — Groq Whisper STT Provider (server-ai).
Spec Section 6.2 & 6.4: Fallback STT provider using whisper-large-v3.
Enforces 6.0s per-tier timeout.
"""

import httpx
from typing import Optional, Dict, Any, List
from ..config import settings

_current_groq_index = 0
TIER_TIMEOUT = httpx.Timeout(6.0, connect=3.0)


def get_next_groq_key() -> Optional[str]:
    global _current_groq_index
    keys: List[str] = settings.groq_keys
    if not keys:
        return None
    key = keys[_current_groq_index % len(keys)]
    _current_groq_index = (_current_groq_index + 1) % len(keys)
    return key


async def transcribe_groq(audio_bytes: bytes, filename: str, language_code: str) -> Optional[Dict[str, Any]]:
    api_key = get_next_groq_key()
    if not api_key:
        return None

    lang_iso = language_code.split("-")[0] if "-" in language_code else language_code

    url = "https://api.groq.com/openai/v1/audio/transcriptions"
    headers = {
        "Authorization": f"Bearer {api_key}",
    }
    files = {
        "file": (filename or "audio.wav", audio_bytes, "audio/wav"),
    }
    data = {
        "model": "whisper-large-v3",
        "language": lang_iso,
        "temperature": "0.0",
        "response_format": "json",
    }

    try:
        async with httpx.AsyncClient(timeout=TIER_TIMEOUT) as client:
            resp = await client.post(url, headers=headers, files=files, data=data)
            if resp.status_code == 200:
                result = resp.json()
                text = result.get("text", "").strip()
                return {
                    "transcript": text if text else f"[Speech recognized in {language_code}]",
                    "confidence": 0.89,
                    "providerUsed": "groq-whisper",
                    "languageCode": language_code,
                }
    except Exception as e:
        print(f"[WARN] Groq Whisper STT failed or timed out (6s): {e}")

    return None
