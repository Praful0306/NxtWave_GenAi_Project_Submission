"""
VaaniTutor — Cascading TTS Router (server-ai).
Spec Section 6.2 Matrix:
- en-IN (English): Sarvam Bulbul v3 (stream) -> Fallback: OpenAI TTS
- hi-IN, kn-IN, ta-IN, te-IN, bn-IN, mr-IN, gu-IN, pa-IN, ml-IN, od-IN:
  Sarvam Bulbul v3 (stream) -> Fallback: None (—)
"""

from typing import Optional, Tuple, AsyncGenerator
from .sarvam_tts import synthesize_sarvam_tts, stream_sarvam_tts_chunks, PROVIDER_NAME as SARVAM_PROVIDER
from .openai_tts import synthesize_openai_tts


async def stream_speech(
    text: str,
    language_code: str,
    speaker: str = "kavya",
) -> Optional[Tuple[AsyncGenerator[bytes, None], str, str]]:
    """
    Stream speech chunks progressively according to Spec Section 6.2 & 6.3:
    1. Tier 1: Sarvam Bulbul v3 WebSocket stream.
    2. Tier 2: OpenAI TTS (strictly for en-IN / English only).
    3. If Indic language and Sarvam fails -> returns None.
    """
    if not text or not text.strip():
        return None

    lang = language_code.strip()
    base_lang = lang.split("-")[0].lower()
    is_english = base_lang == "en"

    # Tier 1: Sarvam Bulbul v3 WebSocket chunk stream
    gen = stream_sarvam_tts_chunks(text, lang, speaker=speaker)
    try:
        first_chunk = await gen.__anext__()
    except (StopAsyncIteration, Exception):
        first_chunk = None

    if first_chunk:
        async def chunk_producer():
            yield first_chunk
            async for chunk in gen:
                yield chunk

        return (chunk_producer(), "audio/wav", SARVAM_PROVIDER)

    # Tier 2: OpenAI TTS fallback for English only
    if is_english:
        openai_res = await synthesize_openai_tts(text, lang)
        if openai_res:
            audio_bytes, content_type, provider = openai_res
            async def single_chunk_producer():
                yield audio_bytes
            return (single_chunk_producer(), content_type, provider)

    return None


async def synthesize_speech(
    text: str,
    language_code: str,
    speaker: str = "kavya",
) -> Optional[Tuple[bytes, str, str]]:
    """
    Synthesize complete speech buffer according to Spec Section 6.2 matrix.
    """
    if not text or not text.strip():
        return None

    lang = language_code.strip()
    base_lang = lang.split("-")[0].lower()
    is_english = base_lang == "en"

    # Tier 1: Sarvam Bulbul v3 WebSocket stream
    sarvam_res = await synthesize_sarvam_tts(text, lang, speaker=speaker)
    if sarvam_res:
        return sarvam_res

    # Tier 2: OpenAI TTS — strictly allowed ONLY for English per Spec Section 6.2
    if is_english:
        openai_res = await synthesize_openai_tts(text, lang)
        if openai_res:
            return openai_res

    # For Indic languages, Spec Section 6.2 specifies no fallback ('—').
    return None

