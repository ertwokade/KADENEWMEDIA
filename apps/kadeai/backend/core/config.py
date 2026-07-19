import os
from functools import lru_cache
from pathlib import Path


class Settings:
    database_url = os.environ.get("DATABASE_URL", "")
    redis_url = os.environ.get("REDIS_URL", "redis://localhost:6379/0")
    encryption_key = os.environ.get("ENCRYPTION_KEY", "")
    backend_token = os.environ.get("KADE_BACKEND_TOKEN", "")
    environment = os.environ.get("KADE_ENV", "development").lower()
    media_root = Path(os.environ.get("KADE_MEDIA_ROOT", str(Path.cwd() / "media"))).resolve()
    allowed_origins = tuple(
        origin.strip()
        for origin in os.environ.get(
            "KADE_ALLOWED_ORIGINS",
            "http://localhost:3000,http://127.0.0.1:3000",
        ).split(",")
        if origin.strip()
    )
    anthropic_api_key = os.environ.get("ANTHROPIC_API_KEY", "")
    anthropic_model = os.environ.get("ANTHROPIC_MODEL", "claude-sonnet-4-6")
    youtube_client_id = os.environ.get("YOUTUBE_CLIENT_ID", "")
    youtube_client_secret = os.environ.get("YOUTUBE_CLIENT_SECRET", "")
    youtube_redirect_uri = os.environ.get(
        "YOUTUBE_REDIRECT_URI",
        "http://127.0.0.1:8472/oauth/youtube/callback",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
