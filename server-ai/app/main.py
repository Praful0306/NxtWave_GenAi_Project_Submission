"""
VaaniTutor server-ai — FastAPI Application Entry Point.

This service is STATELESS by design (spec Section 6.1):
- No database driver of any kind
- Receives inputs, calls AI providers, returns outputs
- JWT verification only (never issues tokens)
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from .config import settings
from .limiter import limiter
from .routes import internal, practice

# ─── FastAPI app ───
app = FastAPI(
    title="VaaniTutor AI Service",
    description="Stateless AI microservice — STT, TTS, LLM assessment",
    version="1.1.0",
)

# Attach limiter to app state and middleware
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

# ─── CORS — restricted to FRONTEND_URL + server-node ───
# FRONTEND_URL accepts a comma-separated list so the apex domain, its www form
# and the *.vercel.app fallback can all be allowed during a DNS cutover
# (spec §13) without a redeploy between them.
_allowed_origins = [
    origin.strip().rstrip("/")
    for origin in str(settings.FRONTEND_URL or "").split(",")
    if origin.strip()
] + [
    "http://localhost:5000",
    "http://127.0.0.1:5000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

# ─── Routes ───
app.include_router(internal.router)
app.include_router(practice.router)


@app.get("/health", tags=["health"])
async def health_check():
    """Health check endpoint."""
    return {
        "status": "ok",
        "service": "vaanitutor-server-ai",
    }


@app.on_event("startup")
async def startup():
    """Log configuration status on startup without non-ASCII chars for Windows cp1252."""
    print("\n[INFO] server-ai starting up")
    print(f"       Frontend URL:   {settings.FRONTEND_URL}")

    providers = {
        "Sarvam":     bool(settings.sarvam_keys),
        "Catalyst":   bool(settings.CATALYST_REFRESH_TOKEN),
        "OpenRouter": bool(settings.OPENROUTER_API_KEY),
        "Gemini":     bool(settings.gemini_keys),
        "Groq":       bool(settings.groq_keys),
        "NVIDIA NIM": bool(settings.nvidia_keys),
        "Cloudflare": bool(settings.cloudflare_keys),
        "OpenAI":     bool(settings.OPENAI_API_KEY),
    }

    print("       AI providers configured:")
    for name, available in providers.items():
        status = "[READY]" if available else "[UNCONFIGURED]"
        print(f"         {status} {name}")
    print()
