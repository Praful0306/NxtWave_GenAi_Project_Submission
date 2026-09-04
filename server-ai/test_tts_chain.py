"""
VaaniTutor — TTS Chain & WebSocket Streaming Rigorous Test Runner.
Spec Section 6.2, 6.3 & 6.4.
"""

import sys
import os
import json
import asyncio
import dotenv

sys.stdout.reconfigure(encoding="utf-8")
dotenv.load_dotenv(".env")

from app.providers import sarvam_tts, openai_tts, tts_router


async def run_tts_tests():
    results = {}

    # 1. Live WebSocket streaming for Hindi (hi-IN)
    hi_res = await sarvam_tts.synthesize_sarvam_tts(
        text="नमस्ते, आप कैसे हैं?",
        language_code="hi-IN",
        speaker="kavya",
    )
    if hi_res:
        audio_bytes, content_type, provider = hi_res
        results["live_hindi_ws"] = {
            "success": True,
            "bytes_length": len(audio_bytes),
            "content_type": content_type,
            "provider": provider,
            "has_data": len(audio_bytes) > 1000,
        }
    else:
        results["live_hindi_ws"] = {"success": False}

    # 2. Live WebSocket streaming for Kannada (kn-IN)
    kn_res = await sarvam_tts.synthesize_sarvam_tts(
        text="ನಾನು ಬೆಂಗಳೂರಿನಲ್ಲಿ ವಾಸಿಸುತ್ತೇನೆ.",
        language_code="kn-IN",
        speaker="kavya",
    )
    if kn_res:
        audio_bytes, content_type, provider = kn_res
        results["live_kannada_ws"] = {
            "success": True,
            "bytes_length": len(audio_bytes),
            "content_type": content_type,
            "provider": provider,
            "has_data": len(audio_bytes) > 1000,
        }
    else:
        results["live_kannada_ws"] = {"success": False}

    # 3. Fallback Test: English with Sarvam simulated down -> Falls to OpenAI TTS (Spec Section 6.2)
    orig_sarvam_router = tts_router.synthesize_sarvam_tts

    async def mock_sarvam_down(*args, **kwargs):
        return None

    tts_router.synthesize_sarvam_tts = mock_sarvam_down

    # English fallback test
    en_fallback_res = await tts_router.synthesize_speech(
        text="Hello, how are you doing today?",
        language_code="en-IN",
    )
    results["english_fallback"] = {
        "attempted_fallback": True,
        "provider": en_fallback_res[2] if en_fallback_res else "unconfigured_or_failed",
    }

    # 4. Indic No-Fallback Test: Hindi with Sarvam simulated down -> Returns None (Spec Section 6.2 matrix)
    hi_no_fallback_res = await tts_router.synthesize_speech(
        text="नमस्ते",
        language_code="hi-IN",
    )
    results["indic_no_fallback"] = {
        "correctly_rejected_without_unauthorized_substitution": hi_no_fallback_res is None,
    }

    # Restore original function
    tts_router.synthesize_sarvam_tts = orig_sarvam_router

    with open("tts_test_results.json", "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)

    print(json.dumps(results, indent=2))


if __name__ == "__main__":
    asyncio.run(run_tts_tests())
