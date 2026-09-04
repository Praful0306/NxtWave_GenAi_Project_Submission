"""
VaaniTutor server-ai — Configuration via Pydantic Settings.

All AI provider keys and service credentials are loaded here.
This service is stateless by design — no database driver of any kind.
"""

from pydantic_settings import BaseSettings
from typing import List, Optional


class Settings(BaseSettings):
    """
    Environment-based settings for the AI microservice.
    All fields map to environment variables (case-insensitive).
    """

    # ─── JWT (verify-only — this service NEVER issues tokens) ───
    JWT_SECRET: str = "dev-jwt-secret-DO-NOT-USE-IN-PROD"

    # ─── Internal service key (server-node → server-ai) ───
    INTERNAL_SERVICE_KEY: str = "dev-internal-key"

    # ─── CORS ───
    FRONTEND_URL: str = "http://localhost:5173"

    # ─── Sarvam AI (STT + TTS) — comma-separated key pool ───
    SARVAM_API_KEYS: str = ""

    # ─── OpenRouter (Sarvam-M LLM) ───
    OPENROUTER_API_KEY: str = ""

    # ─── Zoho Catalyst (Zia STT + GLM-4.7-Flash LLM — Section 6.4a) ───
    # This is a SERVICE CREDENTIAL, not end-user OAuth (Section 6.11).
    CATALYST_ORG_ID: str = ""
    CATALYST_REFRESH_TOKEN: str = ""
    CATALYST_CLIENT_ID: str = ""
    CATALYST_CLIENT_SECRET: str = ""

    # ─── Google Gemini ───
    GEMINI_API_KEYS: str = ""

    # ─── Groq ───
    GROQ_API_KEYS: str = ""

    # ─── NVIDIA NIM ───
    NVIDIA_NIM_API_KEYS: str = ""

    # ─── Cloudflare Workers AI ───
    CLOUDFLARE_API_KEYS: str = ""
    CLOUDFLARE_ACCOUNT_ID: str = ""

    # ─── OpenAI (Whisper STT fallback + TTS fallback) ───
    OPENAI_API_KEY: str = ""

    @property
    def sarvam_keys(self) -> List[str]:
        """Parse comma-separated Sarvam API keys into a list."""
        return [k.strip() for k in self.SARVAM_API_KEYS.split(",") if k.strip()]

    @property
    def gemini_keys(self) -> List[str]:
        return [k.strip() for k in self.GEMINI_API_KEYS.split(",") if k.strip()]

    @property
    def groq_keys(self) -> List[str]:
        return [k.strip() for k in self.GROQ_API_KEYS.split(",") if k.strip()]

    @property
    def nvidia_keys(self) -> List[str]:
        return [k.strip() for k in self.NVIDIA_NIM_API_KEYS.split(",") if k.strip()]

    @property
    def cloudflare_keys(self) -> List[str]:
        return [k.strip() for k in self.CLOUDFLARE_API_KEYS.split(",") if k.strip()]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True


settings = Settings()
