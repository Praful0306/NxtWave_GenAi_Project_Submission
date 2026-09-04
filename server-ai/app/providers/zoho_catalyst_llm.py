"""
VaaniTutor — Tier 2 LLM: Zoho Catalyst QuickML GLM-4.7-Flash (server-ai).
Spec Section 6.5 (Tier 2: Catalyst QuickML LLM Deployment).
Timeout: 8.0s per tier.
"""

import httpx
from typing import Optional, Dict, Any
from ..config import settings
from .zoho_zia_stt import get_catalyst_access_token, DEFAULT_CATALYST_ORG
from .llm_utils import build_evaluation_prompt, parse_and_validate_llm_json

PROVIDER_NAME = "zoho-catalyst-llm"
TIER_TIMEOUT = httpx.Timeout(8.0, connect=3.0)


async def evaluate_zoho_catalyst(
    target_sentence: str,
    user_transcript: str,
    language_code: str,
    user_level: str = "beginner",
    is_retry: bool = False,
) -> Optional[Dict[str, Any]]:
    """Call Zoho Catalyst QuickML GLM-4.7-Flash endpoint with OAuth refresh and 8s timeout."""
    token = await get_catalyst_access_token()
    if not token:
        return None

    org_id = settings.CATALYST_ORG_ID or DEFAULT_CATALYST_ORG
    prompt = build_evaluation_prompt(target_sentence, user_transcript, language_code, user_level, is_retry)

    url = "https://api.catalyst.zoho.in/quickml/api/v1/models/glm/chat"
    headers = {
        "CATALYST-ORG": str(org_id),
        "Authorization": f"Zoho-oauthtoken {token}",
        "Content-Type": "application/json",
    }
    payload = {
        "prompt": prompt,
        "temperature": 0.3,
    }

    try:
        async with httpx.AsyncClient(timeout=TIER_TIMEOUT) as client:
            resp = await client.post(url, headers=headers, json=payload)
            if resp.status_code == 200:
                data = resp.json()
                content = data.get("text") or data.get("response") or data.get("data", {}).get("text", "")
                validated = parse_and_validate_llm_json(content, PROVIDER_NAME)
                if validated:
                    return validated
                elif not is_retry:
                    return await evaluate_zoho_catalyst(
                        target_sentence, user_transcript, language_code, user_level, is_retry=True
                    )
            else:
                print(f"[WARN] Zoho Catalyst LLM returned {resp.status_code}: {resp.text}")
    except Exception as e:
        print(f"[WARN] Zoho Catalyst LLM call failed or timed out (8s): {e}")

    return None
