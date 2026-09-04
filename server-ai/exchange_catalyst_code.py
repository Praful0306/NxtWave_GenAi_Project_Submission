"""
VaaniTutor — Catalyst OAuth Grant Code Exchange Helper.
Usage: python exchange_catalyst_code.py <AUTHORIZATION_CODE>
Exchanges 3-minute grant code with accounts.zoho.in and saves CATALYST_REFRESH_TOKEN to .env.
"""

import sys
import os
import re
import httpx
from app.config import settings


def exchange_code(code: str):
    client_id = settings.CATALYST_CLIENT_ID
    client_secret = settings.CATALYST_CLIENT_SECRET

    if not client_id or not client_secret:
        print("[ERROR] CATALYST_CLIENT_ID and CATALYST_CLIENT_SECRET must be set in .env")
        return

    url = "https://accounts.zoho.in/oauth/v2/token"
    params = {
        "code": code.strip(),
        "client_id": client_id,
        "client_secret": client_secret,
        "grant_type": "authorization_code",
    }

    print(f"[INFO] Exchanging grant code with {url}...")
    with httpx.Client(timeout=10.0) as client:
        resp = client.post(url, params=params)
        print(f"Status Code: {resp.status_code}")
        data = resp.json()

        if "refresh_token" in data:
            refresh_token = data["refresh_token"]
            print("[SUCCESS] Successfully obtained refresh token from Zoho OAuth.")

            # Update .env file directly
            env_path = os.path.join(os.path.dirname(__file__), ".env")
            if os.path.exists(env_path):
                with open(env_path, "r", encoding="utf-8") as f:
                    content = f.read()

                if "CATALYST_REFRESH_TOKEN=" in content:
                    new_content = re.sub(
                        r"CATALYST_REFRESH_TOKEN=.*",
                        f"CATALYST_REFRESH_TOKEN={refresh_token}",
                        content,
                    )
                else:
                    new_content = content + f"\nCATALYST_REFRESH_TOKEN={refresh_token}\n"

                with open(env_path, "w", encoding="utf-8") as f:
                    f.write(new_content)

                print("[SUCCESS] Updated server-ai/.env with CATALYST_REFRESH_TOKEN successfully.")
        else:
            print("[ERROR] Failed to obtain refresh token. Error:", data.get("error", "unknown error"))


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python exchange_catalyst_code.py <ZOHO_GRANT_CODE>")
        sys.exit(1)
    exchange_code(sys.argv[1])
