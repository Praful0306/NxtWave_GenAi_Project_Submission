"""
VaaniTutor — Google Gemini 1.5 Flash Audio STT Provider (server-ai).
Spec Section 6.2 & 6.4: Fallback STT provider for Indian languages.
"""

import base64
import httpx
from typing import Optional, Dict, Any, List
from ..config import settings
from ..data.seed_roadmaps import INDIC_LANG_NAMES

_current_gemini_index = 0


def get_next_gemini_key() -> Optional[str]:
    global _current_gemini_index
    keys: List[str] = settings.gemini_keys
    if not keys:
        return None
    key = keys[_current_gemini_index % len(keys)]
    _current_gemini_index = (_current_gemini_index + 1) % len(keys)
    return key


async def transcribe_gemini(audio_bytes: bytes, mime_type: str, language_code: str) -> Optional[Dict[str, Any]]:
    """
    Transcribe audio via Google Gemini 1.5 Flash multimodal audio input.
    """
    api_key = get_next_gemini_key()
    if not api_key:
        return None

    lang_name = INDIC_LANG_NAMES.get(language_code, language_code)
    b64_audio = base64.b64encode(audio_bytes).decode("utf-8")
    clean_mime = mime_type.split(";")[0] if mime_type else "audio/webm"

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
    payload = {
        "contents": [
            {
                "parts": [
                    {
                        "inline_data": {
                            "mime_type": clean_mime,
                            "data": b64_audio,
                        }
                    },
                    {
                        "text": f"Listen to this audio recording in {lang_name} ({language_code}). Transcribe the exact words spoken in native script and Latin script. Return ONLY the exact transcript text, nothing else."
                    }
                ]
            }
        ],
        "generationConfig": {
            "temperature": 0.0,
        }
    }

    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            resp = await client.post(url, json=payload)
            if resp.status_code == 200:
                data = resp.json()
                text = data["candidates"][0]["content"]["parts"][0]["text"].strip()
                if text:
                    return {
                        "transcript": text,
                        "confidence": 0.91,
                        "providerUsed": "gemini-flash",
                        "languageCode": language_code,
                    }
    except Exception as e:
        print(f"[WARN] Gemini Flash Audio STT failed: {e}")

    return None
