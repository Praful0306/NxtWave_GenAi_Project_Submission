import jwt
from fastapi import Request
from slowapi import Limiter
from slowapi.util import get_remote_address


def get_rate_limit_key(request: Request) -> str:
    """
    Spec Section 12: Per-user rate limiting on expensive AI endpoints.
    Extracts userId from Bearer token if present, falling back to IP address.
    """
    auth = request.headers.get("Authorization", "")
    if auth.startswith("Bearer "):
        token = auth.split(" ", 1)[1]
        try:
            unverified = jwt.decode(token, options={"verify_signature": False})
            user_id = unverified.get("userId")
            if user_id:
                return f"user:{user_id}"
        except Exception:
            pass
        return f"token:{token[:16]}"
    return get_remote_address(request)


limiter = Limiter(key_func=get_rate_limit_key)
