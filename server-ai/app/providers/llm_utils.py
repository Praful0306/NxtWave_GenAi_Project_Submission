"""
VaaniTutor — LLM Evaluation Schema Helpers & Prompt Builder (server-ai).
Spec Section 6.5 & 6.9b.
"""

import json
import re
from typing import Dict, Any, Optional

ALLOWED_ERROR_TYPES = {
    "grammar",
    "vocabulary",
    "word_order",
    "register",
    "pronunciation_note",
    "other",
}

LANGUAGE_NAMES = {
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


def build_evaluation_prompt(
    target_sentence: str,
    user_transcript: str,
    language_code: str,
    user_level: str = "beginner",
    is_retry: bool = False,
) -> str:
    """Construct system prompt for LLM evaluation adhering to Spec Section 6.5."""
    lang_name = LANGUAGE_NAMES.get(language_code, "Indian Language")

    retry_instruction = ""
    if is_retry:
        retry_instruction = (
            "CRITICAL: Your previous response was invalid JSON or missed required schema keys. "
            "You MUST output valid, parseable JSON with exact keys: correctedText, errors, fluencyScore, encouragement, aiReply.\n"
        )

    return f"""You are VaaniTutor AI, an empathetic and pedagogical Indic language tutor.
{retry_instruction}
Evaluate the user's spoken sentence in {lang_name} (code: {language_code}).
Expected Target Sentence / Prompt Context: "{target_sentence}"
User Spoken Transcript: "{user_transcript}"
User Level: "{user_level}"

Analyze the utterance against the 6-type Error Taxonomy:
1. grammar (syntax, inflection, tense, noun-verb or gender agreement)
2. vocabulary (inappropriate word choice or non-standard term)
3. word_order (syntax order mistakes, e.g. SOV vs SVO)
4. register (formality mismatches, e.g. informal vs polite address)
5. pronunciation_note (phonetic/spelling mismatch evident from transcript)
6. other (any other linguistic issue)

Return a JSON object ONLY with the following exact schema:
{{
  "correctedText": "<complete corrected sentence in {lang_name}>",
  "errors": [
    {{
      "type": "grammar|vocabulary|word_order|register|pronunciation_note|other",
      "original": "<problematic substring from user transcript>",
      "corrected": "<corrected substring>",
      "explanation": "<friendly explanation in English or {lang_name}>"
    }}
  ],
  "fluencyScore": <integer 0-100 representing fluency and pronunciation quality>,
  "encouragement": "<positive and warm reinforcement in {lang_name} or English>",
  "aiReply": "<a natural conversational reply in {lang_name} continuing the dialogue for interactive tutor speech>"
}}

Rules:
- Do NOT output markdown code fences (```json ... ```). Output raw JSON only.
- Ensure 'aiReply' is a conversational continuation in {lang_name}.
- Keep 'fluencyScore' as an integer between 0 and 100.
"""


def parse_and_validate_llm_json(raw_text: str, provider_name: str) -> Optional[Dict[str, Any]]:
    """
    Parse LLM response text into validated dictionary adhering to Spec Section 6.5 schema.
    Returns None if JSON is unparseable or missing required fields.
    """
    if not raw_text:
        return None

    cleaned = raw_text.strip()
    # Strip markdown fences if present
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```(?:json)?", "", cleaned, flags=re.IGNORECASE)
        cleaned = re.sub(r"```$", "", cleaned)
        cleaned = cleaned.strip()

    # Extract JSON object substring if model added preamble
    match = re.search(r"\{.*\}", cleaned, re.DOTALL)
    if match:
        cleaned = match.group(0)

    try:
        data = json.loads(cleaned)
    except Exception:
        return None

    if not isinstance(data, dict):
        return None

    # Required top-level keys
    required_keys = ["correctedText", "errors", "fluencyScore", "encouragement", "aiReply"]
    for key in required_keys:
        if key not in data:
            return None

    # Validate score
    try:
        score = int(data["fluencyScore"])
        data["fluencyScore"] = max(0, min(100, score))
    except (ValueError, TypeError):
        data["fluencyScore"] = 75

    # Validate errors array
    validated_errors = []
    if isinstance(data.get("errors"), list):
        for err in data["errors"]:
            if isinstance(err, dict):
                err_type = str(err.get("type", "other")).lower().strip()
                if err_type not in ALLOWED_ERROR_TYPES:
                    err_type = "other"
                validated_errors.append({
                    "type": err_type,
                    "original": str(err.get("original", "")),
                    "corrected": str(err.get("corrected", err.get("correction", ""))),
                    "explanation": str(err.get("explanation", "")),
                })
    data["errors"] = validated_errors

    data["correctedText"] = str(data.get("correctedText", ""))
    data["encouragement"] = str(data.get("encouragement", ""))
    data["aiReply"] = str(data.get("aiReply", ""))
    data["providerUsed"] = provider_name

    return data
