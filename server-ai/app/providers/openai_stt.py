"""
VaaniTutor — OpenAI Whisper STT Provider (server-ai).
Spec Section 6.2 & 6.4: Fallback STT provider using whisper-1.
"""

import httpx
from typing import Optional, Dict, Any
from ..config import settings


async def transcribe_openai(audio_bytes: bytes, filename: str, language_code: str) -> Optional[Dict[str, Any]]:
    """
    Transcribe audio via OpenAI Whisper-1 API.
    """
    if not settings.OPENAI_API_KEY:
        return None

    lang_iso = language_code.split("-")[0] if "-" in language_code else language_code

    url = "https://api.openai.com/v1/audio/transcriptions"
    headers = {
        "Authorization": f"Bearer {settings.OPENAI_API_KEY}",
    }
    files = {
        "file": (filename or "audio.webm", audio_bytes, "audio/webm"),
    }
    data = {
        "model": "whisper-1",
        "language": lang_iso,
        "temperature": "0.0",
        "response_format": "json",
    }

    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            resp = await client.post(url, headers=headers, files=files, data=data)
            if resp.status_code == 200:
                result = resp.json()
                text = result.get("text", "").strip()
                if text:
                    return {
                        "transcript": text,
                        "confidence": 0.88,
                        "providerUsed": "openai-whisper",
                        "languageCode": language_code,
                    }
    except Exception as e:
        print(f"[WARN] OpenAI Whisper STT failed: {e}")

    return None
