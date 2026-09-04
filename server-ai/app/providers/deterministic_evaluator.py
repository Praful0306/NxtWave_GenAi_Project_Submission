"""
VaaniTutor — Deterministic Rule-Based Evaluator (server-ai).
Spec Section 6.5 (Tier 7: Zero-Key Offline Safety Fallback).

Guarantees the system always returns a schema-compliant assessment
with valid correctedText, errors taxonomy, fluencyScore, encouragement,
and a natural, language-aware aiReply even if all cloud LLM providers are unavailable.
"""

from typing import Dict, Any, List
import re


LANGUAGE_NAME_MAP = {
    "kn-IN": "Kannada",
    "hi-IN": "Hindi",
    "ta-IN": "Tamil",
    "te-IN": "Telugu",
    "bn-IN": "Bengali",
    "mr-IN": "Marathi",
    "gu-IN": "Gujarati",
    "pa-IN": "Punjabi",
    "ml-IN": "Malayalam",
    "or-IN": "Odia",
    "en-IN": "Indian English",
}

AI_REPLIES_BY_LANG = {
    "kn-IN": "ತುಂಬಾ ಚೆನ್ನಾಗಿದೆ! ನೀವು ಇದನ್ನು ದಿನನಿತ್ಯ ಬಳಸಬಹುದೇ?",
    "hi-IN": "बहुत बढ़िया! क्या आप इसे रोज़मर्रा की बातचीत में इस्तेमाल कर सकते हैं?",
    "ta-IN": "மிகவும் நன்று! இதை நீங்கள் தினமும் பயன்படுத்த முடியுமா?",
    "te-IN": "చాలా బాగుంది! మీరు దీన్ని ప్రతిరోజూ ఉపయోగించగలరా?",
    "bn-IN": "খুব ভালো! আপনি কি এটি প্রতিদিন ব্যবহার করতে পারেন?",
    "mr-IN": "खूप छान! तुम्ही हे दररोज वापरू शकता का?",
    "gu-IN": "ખૂબ સરસ! શું તમે આ રોજિંદા જીવનમાં વાપરી શકો છો?",
    "pa-IN": "ਬਹੁਤ ਵਧੀਆ! ਕੀ ਤੁਸੀਂ ਇਸਨੂੰ ਰੋਜ਼ਾਨਾ ਵਰਤ ਸਕਦੇ ਹੋ?",
    "ml-IN": "വളരെ നന്നായിരിക്കുന്നു! നിങ്ങൾക്ക് ഇത് ദിവസവും ഉപയോഗിക്കാൻ കഴിയുമോ?",
    "or-IN": "ବହୁତ ଭଲ! ଆପଣ ଏହାକୁ ପ୍ରତିଦିନ ବ୍ୟବହାର କରିପାରିବେ କି?",
    "en-IN": "Great effort! Can you use this phrase in another sentence?",
}

ENCOURAGEMENT_BY_LANG = {
    "kn-IN": "ಒಳ್ಳೆಯ ಪ್ರಯತ್ನ! ನಿರಂತರ ಅಭ್ಯಾಸದಿಂದ ನೀವು ಪರಿಣಿತಿ ಪಡೆಯುತ್ತೀರಿ.",
    "hi-IN": "शानदार प्रयास! अभ्यास करते रहें, आप बहुत तेजी से सीख रहे हैं।",
    "ta-IN": "சிறந்த முயற்சி! தொடர்ந்து பயிற்சி செய்யுங்கள்.",
    "te-IN": "మంచి ప్రయత్నం! క్రమం తప్పకుండా సాధన చేయండి.",
    "bn-IN": "চমৎকার চেষ্টা! নিয়মিত অনুশীলন আপনাকে দক্ষ করে তুলবে।",
    "mr-IN": "उत्तम प्रयत्न! सतत सरावाने तुमची प्रगती नक्की होईल.",
    "gu-IN": "સરસ પ્રયાસ! સતત અભ્યાસથી તમે ઝડપથી શીખી શકશો.",
    "pa-IN": "ਵਧੀਆ ਕੋਸ਼ਿਸ਼! ਅਭਿਆਸ ਜਾਰੀ ਰੱਖੋ.",
    "ml-IN": "നല്ല ശ്രമം! തുടർന്നും പരിശീലിക്കുക.",
    "or-IN": "ଉତ୍ତମ ପ୍ରୟାସ! ଅଭ୍ୟାସ ଜାରି ରଖନ୍ତୁ।",
    "en-IN": "Well done! Your pronunciation and rhythm are improving.",
}


def evaluate_deterministic(
    target_sentence: str,
    user_transcript: str,
    language_code: str,
    user_level: str = "beginner",
) -> Dict[str, Any]:
    """
    Produce a deterministic evaluation when all AI tiers fail or are unconfigured.
    Computes token-overlap similarity, extracts errors, and outputs strict Spec Section 6.5 schema.
    """
    target = target_sentence.strip() if target_sentence else ""
    spoken = user_transcript.strip() if user_transcript else ""

    target_tokens = target.split()
    spoken_tokens = spoken.split()

    errors: List[Dict[str, str]] = []
    
    # Simple token alignment comparison
    if target and spoken:
        if target == spoken:
            fluency_score = 95
        else:
            # Calculate word match ratio
            matches = sum(1 for w in spoken_tokens if w in target_tokens)
            total = max(len(target_tokens), len(spoken_tokens), 1)
            ratio = matches / total
            fluency_score = max(50, min(90, int(ratio * 100)))

            # Identify missing or altered words
            for idx, word in enumerate(spoken_tokens):
                if idx < len(target_tokens) and word != target_tokens[idx]:
                    errors.append({
                        "type": "vocabulary" if len(word) != len(target_tokens[idx]) else "grammar",
                        "original": word,
                        "corrected": target_tokens[idx],
                        "explanation": f"Expected '{target_tokens[idx]}' instead of '{word}' in this context.",
                    })
    else:
        fluency_score = 75

    corrected_text = target if target else spoken
    encouragement = ENCOURAGEMENT_BY_LANG.get(language_code, ENCOURAGEMENT_BY_LANG["en-IN"])
    ai_reply = AI_REPLIES_BY_LANG.get(language_code, AI_REPLIES_BY_LANG["en-IN"])

    return {
        "correctedText": corrected_text,
        "errors": errors,
        "fluencyScore": fluency_score,
        "encouragement": encouragement,
        "aiReply": ai_reply,
        "providerUsed": "deterministic-evaluator",
    }
