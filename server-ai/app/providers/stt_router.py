"""
VaaniTutor — STT Router & Cascading Fallback Chain (server-ai).
Spec Section 6.2 & 6.4:
Order of Execution:
1. Sarvam AI (Primary for Indic & Tier 1) -> saaras:v3 with mode='transcribe'
2. Zoho Catalyst Zia STT (Fallback for Tier 1: kn-IN, hi-IN, en-IN)
3. Google Gemini 1.5 Flash Audio
4. Groq Whisper (whisper-large-v3)
5. OpenAI Whisper (whisper-1)
6. Deterministic Mock STT Fallback
"""

from typing import Dict, Any
from . import sarvam_stt
from . import zoho_zia_stt
from . import gemini_stt
from . import groq_stt
from . import openai_stt
from . import mock_stt

TIER_1_LANGUAGES = {"kn-IN", "hi-IN", "en-IN"}


async def transcribe_audio_chain(
    audio_bytes: bytes,
    filename: str,
    mime_type: str,
    language_code: str
) -> Dict[str, Any]:
    """
    Execute cascading STT fallback chain per the Spec Section 6.2 & 6.4 order.
    """
    is_tier_1 = language_code in TIER_1_LANGUAGES

    # ─── 1. Primary: Sarvam AI STT (saaras:v3, mode='transcribe') ───
    res = await sarvam_stt.transcribe_sarvam(audio_bytes, filename, language_code)
    if res:
        return res

    # ─── 2. Fallback for Tier 1 (kn-IN, hi-IN, en-IN): Zoho Catalyst Zia STT ───
    if is_tier_1:
        res = await zoho_zia_stt.transcribe_zoho_zia(audio_bytes, filename, language_code)
        if res:
            return res

    # ─── 3. Fallback: Google Gemini Flash Multimodal Audio ───
    res = await gemini_stt.transcribe_gemini(audio_bytes, mime_type, language_code)
    if res:
        return res

    # ─── 4. Fallback: Groq Whisper (whisper-large-v3) ───
    res = await groq_stt.transcribe_groq(audio_bytes, filename, language_code)
    if res:
        return res

    # ─── 5. Fallback: OpenAI Whisper (whisper-1) ───
    res = await openai_stt.transcribe_openai(audio_bytes, filename, language_code)
    if res:
        return res

    # ─── 6. Deterministic Fallback: Mock STT (Spec Section 2) ───
    return mock_stt.transcribe_mock(language_code)
