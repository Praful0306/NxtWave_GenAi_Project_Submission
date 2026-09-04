"""
VaaniTutor — Zoho Zia STT Provider (server-ai).
Spec Section 6.2 & 6.4a: Catalyst QuickML Zia Speech-to-Text.
Endpoint: https://api.catalyst.zoho.in/quickml/api/v1/models/zia/audio/transcribe
Headers:
  CATALYST-ORG: <org-id>
  Authorization: Zoho-oauthtoken <access-token>
Enforces 6.0s per-tier timeout and logs explicit Catalyst response errors.
"""

import time
import httpx
from typing import Optional, Dict, Any
from ..config import settings

_catalyst_access_token: Optional[str] = None
_catalyst_token_expires_at: float = 0
TIER_TIMEOUT = httpx.Timeout(6.0, connect=3.0)
DEFAULT_CATALYST_ORG = "60073713594"


async def get_catalyst_access_token() -> Optional[str]:
    global _catalyst_access_token, _catalyst_token_expires_at

    if _catalyst_access_token and time.time() < (_catalyst_token_expires_at - 60):
        return _catalyst_access_token

    if not (settings.CATALYST_REFRESH_TOKEN and settings.CATALYST_CLIENT_ID and settings.CATALYST_CLIENT_SECRET):
        return None

    url = "https://accounts.zoho.in/oauth/v2/token"
    params = {
        "refresh_token": settings.CATALYST_REFRESH_TOKEN,
        "client_id": settings.CATALYST_CLIENT_ID,
        "client_secret": settings.CATALYST_CLIENT_SECRET,
        "grant_type": "refresh_token",
    }

    try:
        async with httpx.AsyncClient(timeout=TIER_TIMEOUT) as client:
            resp = await client.post(url, params=params)
            if resp.status_code == 200:
                data = resp.json()
                _catalyst_access_token = data.get("access_token")
                expires_in = data.get("expires_in", 3600)
                _catalyst_token_expires_at = time.time() + expires_in
                return _catalyst_access_token
            else:
                print(f"[WARN] Catalyst token refresh failed (Status {resp.status_code}): {resp.text}")
    except Exception as e:
        print(f"[WARN] Failed to refresh Zoho Catalyst access token: {e}")

    return None


async def transcribe_zoho_zia(audio_bytes: bytes, filename: str, language_code: str) -> Optional[Dict[str, Any]]:
    """
    Transcribe audio via Zoho Catalyst QuickML Zia STT endpoint.
    Spec Section 6.4a.
    """
    token = await get_catalyst_access_token()
    org_id = settings.CATALYST_ORG_ID or DEFAULT_CATALYST_ORG

    if not token:
        return None

    # Supported language codes on Zia: kn, hi, en
    zia_lang_map = {
        "kn-IN": "kn",
        "hi-IN": "hi",
        "en-IN": "en",
        "kn": "kn",
        "hi": "hi",
        "en": "en",
    }
    target_lang = zia_lang_map.get(language_code, "hi")

    url = "https://api.catalyst.zoho.in/quickml/api/v1/models/zia/audio/transcribe"
    headers = {
        "CATALYST-ORG": str(org_id),
        "Authorization": f"Zoho-oauthtoken {token}",
    }
    files = {
        "file": (filename or "audio.wav", audio_bytes, "audio/wav"),
    }
    data = {
        "language": target_lang,
    }

    try:
        async with httpx.AsyncClient(timeout=TIER_TIMEOUT) as client:
            resp = await client.post(url, headers=headers, files=files, data=data)
            if resp.status_code == 200:
                res_data = resp.json()
                transcript = res_data.get("text") or res_data.get("data", {}).get("transcript") or res_data.get("transcript", "")
                confidence = float(res_data.get("data", {}).get("confidence", 0.92))
                if transcript:
                    return {
                        "transcript": transcript.strip(),
                        "confidence": confidence,
                        "providerUsed": "zoho-zia",
                        "languageCode": language_code,
                    }
            else:
                print(f"[WARN] Zoho Catalyst QuickML Zia returned {resp.status_code}: {resp.text}")
    except Exception as e:
        print(f"[WARN] Zoho Zia STT call failed or timed out (6s): {e}")

    return None
