"""
VaaniTutor server-ai — JWT verification (verify-only, NEVER issues tokens).

Two auth mechanisms:
1. User JWT verification — for /api/practice/* routes
2. Internal service key — for /internal/* routes (server-node → server-ai)
"""

import jwt
from fastapi import Depends, HTTPException, Header, Request
from typing import Optional
from .config import settings


async def verify_user_jwt(request: Request) -> dict:
    """
    FastAPI dependency: verifies the user's JWT from the Authorization header.
    Returns { userId, email } on success.

    This service NEVER issues tokens — it only verifies against the shared JWT_SECRET
    (configured separately per service — spec Section 4).
    """
    auth_header = request.headers.get("Authorization", "")

    if not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Authentication required. No valid Bearer token provided.",
        )

    token = auth_header.split(" ", 1)[1]

    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=["HS256"])
        return {"userId": payload["userId"], "email": payload["email"]}
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=401,
            detail="Token expired. Please log in again.",
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=401,
            detail="Invalid token.",
        )


async def verify_internal_key(
    x_internal_key: Optional[str] = Header(None, alias="X-Internal-Key"),
) -> bool:
    """
    FastAPI dependency: verifies the internal service key for server-to-server calls.
    Used on /internal/* routes — called by server-node, not by users.
    """
    if not x_internal_key or x_internal_key != settings.INTERNAL_SERVICE_KEY:
        raise HTTPException(
            status_code=403,
            detail="Invalid or missing internal service key.",
        )
    return True
