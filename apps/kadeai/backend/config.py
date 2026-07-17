import os
from dataclasses import dataclass, field


def _float_env(name: str, default: float) -> float:
    try:
        return float(os.environ.get(name, default))
    except (TypeError, ValueError):
        return default


def _int_env(name: str, default: int) -> int:
    try:
        return int(os.environ.get(name, default))
    except (TypeError, ValueError):
        return default


@dataclass
class Settings:
    WHISPER_MODEL: str = os.environ.get("WHISPER_MODEL", "base")
    WHISPER_LANGUAGE: str = os.environ.get("WHISPER_LANGUAGE", "tr")
    SILENCE_THRESHOLD: float = _float_env("SILENCE_THRESHOLD", -40.0)
    MIN_SILENCE_DURATION: float = _float_env("MIN_SILENCE_DURATION", 0.5)
    FADE_DURATION: float = _float_env("FADE_DURATION", 0.08)
    KEEP_PADDING_MS: int = _int_env("KEEP_PADDING_MS", 100)
    SCENE_THRESHOLD: float = _float_env("SCENE_THRESHOLD", 30.0)
    TARGET_LUFS: float = _float_env("TARGET_LUFS", -14.0)
    BEAT_SENSITIVITY: float = _float_env("BEAT_SENSITIVITY", 0.65)
    FILLER_WORDS: list[str] = field(default_factory=lambda: [
        "şey", "yani", "hani", "ıı", "eee", "umm", "like", "you know"
    ])


settings = Settings()
