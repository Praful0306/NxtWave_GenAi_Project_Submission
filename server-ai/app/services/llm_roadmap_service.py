"""
VaaniTutor — Roadmap Generation Service (server-ai).
Spec Section 6.5 & Section 10 Phase 2:
Generates week-by-week, day-by-day customized curriculum with daily quizzes.
Uses LLM chain with automatic fallback to deterministic seed bank.
"""

import json
from typing import Dict, Any, List
import httpx
from pydantic import BaseModel, Field

from ..config import settings
from ..data.seed_roadmaps import get_deterministic_roadmap, INDIC_LANG_NAMES


class RoadmapRequest(BaseModel):
    languageCode: str = Field(..., description="e.g. kn-IN, hi-IN, en-IN")
    level: str = Field("Basic", description="Basic, Intermediate, or Advanced")
    totalDays: int = Field(30, description="Total days for the curriculum (7-365)")


async def generate_roadmap_llm(language_code: str, level: str, total_days: int) -> Dict[str, Any]:
    """
    Generate a full personalized roadmap with daily quizzes.
    Attempts primary LLMs (OpenRouter/Sarvam-M, Gemini, Groq) with 100% fallback to deterministic seed bank.
    """
    lang_name = INDIC_LANG_NAMES.get(language_code, language_code)

    prompt = f"""You are an expert language teacher building a personalized day-by-day roadmap to learn {lang_name} at starting level {level} over {total_days} days.

Generate a JSON object with this exact structure:
{{
  "languageCode": "{language_code}",
  "startLevel": "{level}",
  "totalDays": {total_days},
  "generatedBy": "ai-llm",
  "weeks": [
    {{
      "weekNumber": 1,
      "theme": "Week theme",
      "days": [
        {{
          "dayNumber": 1,
          "topic": "Lesson topic",
          "targetPhrases": ["phrase in {lang_name}", "second phrase"],
          "grammarFocus": "Brief grammar rule focus",
          "promptText": "Prompt in {lang_name} for the learner to practice speaking",
          "translationEnglish": "English translation of prompt",
          "scenario": "Real-world conversational scenario",
          "quiz": [
            {{
              "question": "Multiple-choice question recalling today's grammar/vocabulary",
              "options": ["Option A", "Option B", "Option C", "Option D"],
              "correctAnswerIndex": 0,
              "explanation": "Why this answer is correct"
            }}
          ]
        }}
      ]
    }}
  ]
}}

Return ONLY the raw JSON object, without markdown code fences or conversational text.
"""

    if settings.gemini_keys:
        try:
            async with httpx.AsyncClient(timeout=20.0) as client:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={settings.gemini_keys[0]}"
                payload = {
                    "contents": [{"parts": [{"text": prompt}]}],
                    "generationConfig": {"temperature": 0.3, "responseMimeType": "application/json"}
                }
                resp = await client.post(url, json=payload)
                if resp.status_code == 200:
                    data = resp.json()
                    text = data["candidates"][0]["content"]["parts"][0]["text"]
                    parsed = json.loads(text)
                    parsed["generatedBy"] = "gemini-flash"
                    return parsed
        except Exception as e:
            print(f"[WARN] Gemini roadmap generation fallback: {e}")

    # 2. Resilient Deterministic Fallback (Spec Section 6.5)
    return get_deterministic_roadmap(language_code, level, total_days)
