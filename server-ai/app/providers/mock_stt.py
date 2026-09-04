"""
VaaniTutor — Mock STT Provider (server-ai).
Spec Section 2: Deterministic fallback ensuring the app is 100% testable
and resilient even when zero external AI API keys are configured.
"""

from typing import Dict, Any

# Contextual sample responses per language for test verification
SAMPLE_TRANSCRIPTS = {
    "kn-IN": "ನಮಸ್ಕಾರ, ನಾನು ಚೆನ್ನಾಗಿದ್ದೇನೆ. ಧನ್ಯವಾದಗಳು.",
    "hi-IN": "नमस्ते, मैं ठीक हूँ। बहुत-बहुत धन्यवाद।",
    "en-IN": "Good morning, I am doing well. Thank you very much.",
    "ta-IN": "வணக்கம், நான் நன்றாக இருக்கிறேன். நன்றி.",
    "te-IN": "నమస్కారం, నేను బాగున్నాను. ధన్యవాదాలు.",
    "bn-IN": "নমস্কার, আমি ভালো আছি। ধন্যবাদ।",
    "mr-IN": "नमस्कार, मी मजेत आहे. धन्यवाद.",
    "gu-IN": "નમસ્તે, હું મજામાં છું. આભાર.",
    "pa-IN": "ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ, ਮੈਂ ਠੀਕ ਹਾਂ। ਧੰਨਵਾਦ।",
    "ml-IN": "നമസ്കാരം, എനിക്ക് സുഖമാണ്. നന്ദി.",
    "od-IN": "ନମସ୍କାର, ମୁଁ ଭଲ ଅଛି। ଧନ୍ୟବାଦ।",
}


def transcribe_mock(language_code: str) -> Dict[str, Any]:
    """
    Produce a deterministic, high-quality transcript fallback.
    """
    transcript = SAMPLE_TRANSCRIPTS.get(
        language_code,
        f"Namaste, practicing speaking in {language_code}."
    )

    return {
        "transcript": transcript,
        "confidence": 0.85,
        "providerUsed": "mock-stt",
        "languageCode": language_code,
    }
