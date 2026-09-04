"""
VaaniTutor — 7-Tier LLM Evaluation Cascading Router (server-ai).
Spec Section 6.5 & Section 6.9b:
Order of Execution:
1. Sarvam-M via OpenRouter (Primary for Indian languages)
2. Zoho Catalyst QuickML GLM-4.7-Flash
3. Google Gemini 1.5 Flash
4. Groq (Llama 3.3 70B Versatile)
5. NVIDIA NIM (Nemotron-4-340B)
6. Cloudflare Workers AI (Llama 3.3 70B)
7. Deterministic Rule-Based Fallback Grader
"""

from typing import Dict, Any
from . import openrouter_llm
from . import zoho_catalyst_llm
from . import gemini_llm
from . import groq_llm
from . import nvidia_llm
from . import cloudflare_llm
from . import deterministic_evaluator


async def evaluate_practice_utterance(
    target_sentence: str,
    user_transcript: str,
    language_code: str,
    user_level: str = "beginner",
) -> Dict[str, Any]:
    """
    Execute the cascading 7-tier LLM evaluation chain.
    Each tier executes with 8.0s timeout and 1 malformed-JSON self-correction retry.
    Falls back gracefully to Tier 7 deterministic evaluator if all remote tiers fail.
    """
    # ─── 1. Primary: Sarvam-M (OpenRouter) ───
    res = await openrouter_llm.evaluate_openrouter_sarvam(
        target_sentence, user_transcript, language_code, user_level
    )
    if res:
        return res

    # ─── 2. Tier 2: Zoho Catalyst QuickML GLM-4.7-Flash ───
    res = await zoho_catalyst_llm.evaluate_zoho_catalyst(
        target_sentence, user_transcript, language_code, user_level
    )
    if res:
        return res

    # ─── 3. Tier 3: Google Gemini 1.5 Flash ───
    res = await gemini_llm.evaluate_gemini(
        target_sentence, user_transcript, language_code, user_level
    )
    if res:
        return res

    # ─── 4. Tier 4: Groq (Llama 3.3 70B Versatile) ───
    res = await groq_llm.evaluate_groq_llama(
        target_sentence, user_transcript, language_code, user_level
    )
    if res:
        return res

    # ─── 5. Tier 5: NVIDIA NIM (Nemotron-4-340B) ───
    res = await nvidia_llm.evaluate_nvidia_nim(
        target_sentence, user_transcript, language_code, user_level
    )
    if res:
        return res

    # ─── 6. Tier 6: Cloudflare Workers AI (Llama 3.3 70B) ───
    res = await cloudflare_llm.evaluate_cloudflare(
        target_sentence, user_transcript, language_code, user_level
    )
    if res:
        return res

    # ─── 7. Tier 7: Deterministic Rule-Based Fallback ───
    return deterministic_evaluator.evaluate_deterministic(
        target_sentence, user_transcript, language_code, user_level
    )
