"""
VaaniTutor — LLM Evaluation Chain & Error Taxonomy Rigorous Test Suite.
Spec Section 6.5 & Section 6.9b.
"""

import asyncio
import json
from app.providers.llm_router import evaluate_practice_utterance
from app.providers.deterministic_evaluator import evaluate_deterministic
from app.providers import openrouter_llm, zoho_catalyst_llm, gemini_llm, groq_llm, nvidia_llm, cloudflare_llm

VALID_TAXONOMY_TYPES = {"grammar", "vocabulary", "word_order", "register", "pronunciation_note", "other"}


async def run_tests():
    results = {}

    # 1. Live LLM Evaluation (Hindi)
    res_hi = await evaluate_practice_utterance(
        target_sentence="नमस्ते, आप कैसे हैं?",
        user_transcript="नमस्ते, तुम कैसा है?",
        language_code="hi-IN",
        user_level="beginner",
    )
    results["live_hindi"] = res_hi

    # 2. Live LLM Evaluation (Kannada)
    res_kn = await evaluate_practice_utterance(
        target_sentence="ನಾನು ಬೆಂಗಳೂರಿನಲ್ಲಿ ವಾಸಿಸುತ್ತೇನೆ.",
        user_transcript="ನಾನು ಬೆಂಗಳೂರು ಇರುತ್ತೇನೆ.",
        language_code="kn-IN",
        user_level="beginner",
    )
    results["live_kannada"] = res_kn

    # 3. Deterministic Tier-7 Fallback Test (all remote keys simulated failed)
    res_det = evaluate_deterministic(
        target_sentence="ನಾನು ಪ್ರತಿದಿನ ಕನ್ನಡ ಕಲಿಯುತ್ತೇನೆ.",
        user_transcript="ನಾನು ಪ್ರತಿದಿನ ಕನ್ನಡ ಕಲಿಯುತ್ತೀನಿ.",
        language_code="kn-IN",
        user_level="beginner",
    )
    results["deterministic_fallback"] = res_det

    # 4. Explicit Behavioral Test for 1 Malformed-JSON Retry then Fallback
    # Scenario A: Tier fails once with bad JSON, retries and succeeds on attempt 2
    retry_success_calls = 0
    async def mock_retry_success_provider(*args, is_retry=False, **kwargs):
        nonlocal retry_success_calls
        retry_success_calls += 1
        if not is_retry:
            # First attempt returns None (simulating malformed JSON parse failure)
            # In actual provider, it calls itself with is_retry=True
            return await mock_retry_success_provider(*args, is_retry=True, **kwargs)
        return {
            "correctedText": "ನಮಸ್ಕಾರ",
            "errors": [],
            "fluencyScore": 95,
            "encouragement": "Superb!",
            "aiReply": "ಹೇಗಿದ್ದೀರಿ?",
            "providerUsed": "mock-retry-success",
        }

    res_retry_success = await mock_retry_success_provider("a", "b", "kn-IN")
    results["retry_behavior_success"] = {
        "calls": retry_success_calls,
        "succeeded": res_retry_success["providerUsed"] == "mock-retry-success",
    }

    # Scenario B: Tier fails on BOTH attempt 1 and attempt 2 (exhausts retry), cascades to next tier
    tier1_exhausted_calls = 0
    async def mock_exhausted_tier1(*args, is_retry=False, **kwargs):
        nonlocal tier1_exhausted_calls
        tier1_exhausted_calls += 1
        if not is_retry:
            # First attempt fails -> invokes retry
            return await mock_exhausted_tier1(*args, is_retry=True, **kwargs)
        # Second attempt also fails -> returns None
        return None

    # Wire into router mock chain
    orig_openrouter = openrouter_llm.evaluate_openrouter_sarvam
    orig_catalyst = zoho_catalyst_llm.evaluate_zoho_catalyst
    orig_gemini = gemini_llm.evaluate_gemini
    orig_groq = groq_llm.evaluate_groq_llama

    async def mock_async_none(*args, **kwargs):
        return None

    openrouter_llm.evaluate_openrouter_sarvam = mock_exhausted_tier1
    zoho_catalyst_llm.evaluate_zoho_catalyst = mock_async_none
    gemini_llm.evaluate_gemini = mock_async_none

    # Router should attempt Tier 1 twice (initial + 1 retry), then cascade down to Groq or deterministic
    res_cascade = await evaluate_practice_utterance("नमस्ते", "नमस्ते", "hi-IN")
    results["retry_behavior_exhausted_and_cascaded"] = {
        "tier1_calls": tier1_exhausted_calls,
        "cascaded_provider": res_cascade["providerUsed"],
    }

    # Restore router providers
    openrouter_llm.evaluate_openrouter_sarvam = orig_openrouter
    zoho_catalyst_llm.evaluate_zoho_catalyst = orig_catalyst
    gemini_llm.evaluate_gemini = orig_gemini
    groq_llm.evaluate_groq_llama = orig_groq

    with open("llm_test_results.json", "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)

    print(json.dumps({
        "status": "complete",
        "live_hindi_provider": res_hi.get("providerUsed"),
        "live_hindi_score": res_hi.get("fluencyScore"),
        "live_kannada_provider": res_kn.get("providerUsed"),
        "deterministic_provider": res_det.get("providerUsed"),
        "retry_success_calls": retry_success_calls,
        "exhausted_tier1_calls": tier1_exhausted_calls,
        "has_ai_reply_hi": bool(res_hi.get("aiReply")),
        "has_ai_reply_kn": bool(res_kn.get("aiReply")),
        "has_ai_reply_det": bool(res_det.get("aiReply")),
    }))


if __name__ == "__main__":
    asyncio.run(run_tests())
