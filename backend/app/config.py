# ============================================================
# app/config.py – centralised settings
# Uses python-dotenv directly for Python 3.14 compatibility.
# All secrets come from environment variables, never hardcoded.
# ============================================================

import os
from dotenv import load_dotenv

# Load .env file from the backend directory
load_dotenv()


class Settings:
    # Google AI
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL:   str = os.getenv("GEMINI_MODEL", "gemini-3-flash-preview")

    # Camb AI API
    CAMBAI_API_KEY: str = os.getenv("CAMBAI_API_KEY", "")

    # CORS – comma or space separated list of allowed origins
    @property
    def CORS_ORIGINS(self) -> list[str]:
        raw = os.getenv("CORS_ORIGINS", "")
        if raw:
            # Support JSON array or comma-separated string
            raw = raw.strip().strip("[]").replace('"', '').replace("'", "")
            return [o.strip() for o in raw.split(",") if o.strip()]
        # Default: allow local Vite dev server
        return [
            "http://localhost:5173",
            "http://localhost:3000",
        ]

    # Image constraints
    MAX_IMAGE_SIZE_MB: int = int(os.getenv("MAX_IMAGE_SIZE_MB", "10"))


settings = Settings()
