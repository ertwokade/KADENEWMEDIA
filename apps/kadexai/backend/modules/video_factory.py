"""KadexAI Video Fabrikası — senaryodan otomatik video üretimi.

Vendored motor: MoneyPrinterTurbo (MIT, bkz. LICENSES/NOTICE.md), KadexAI
markası altında. Bu modül ince bir köprüdür:
  1. Motoru LAZY import eder (moviepy/edge_tts/faster-whisper kurulu değilse
     backend yine boot olur; yalnızca bu uç 503 döner).
  2. KadexAI ortam değişkenlerini (GEMINI/OPENAI/PEXELS...) motor konfigürasyonuna
     köprüler — kullanıcı ayrı config.toml doldurmak zorunda kalmaz.
  3. Basit bir istek → tam pipeline (senaryo→ses→altyazı→video) çalıştırır.

Gerekli ek paketler (requirements'a eklenir): moviepy, edge_tts, faster-whisper.
Stok görüntü için ücretsiz bir PEXELS_API_KEY önerilir (yoksa yalnızca düz
renk/statik materyalle sınırlı kalınır).
"""

from __future__ import annotations

import os
import sys
import uuid
from pathlib import Path
from typing import Any, Dict, Optional

_MPT_ROOT = Path(__file__).resolve().parent.parent / "vendor" / "mpturbo"


class VideoEngineUnavailable(RuntimeError):
    """Motor bağımlılıkları kurulu değil."""


def _ensure_on_path() -> None:
    root = str(_MPT_ROOT)
    if root not in sys.path:
        sys.path.insert(0, root)


def _bridge_env_to_config(config: Any, *, language: str) -> None:
    """KadexAI env değişkenlerini motorun `config.app` sözlüğüne aktarır."""
    app_cfg = config.app

    gemini = os.environ.get("GEMINI_API_KEY", "").strip()
    openai = os.environ.get("OPENAI_API_KEY", "").strip()

    # LLM sağlayıcı seçimi: Gemini (ücretsiz katman) önce, sonra OpenAI.
    if gemini:
        app_cfg["llm_provider"] = "gemini"
        app_cfg["gemini_api_key"] = gemini
    elif openai:
        app_cfg["llm_provider"] = "openai"
        app_cfg["openai_api_key"] = openai

    # Stok görüntü sağlayıcısı (ücretsiz Pexels/Pixabay).
    pexels = os.environ.get("PEXELS_API_KEY", "").strip()
    if pexels:
        app_cfg["pexels_api_keys"] = [pexels]
    pixabay = os.environ.get("PIXABAY_API_KEY", "").strip()
    if pixabay:
        app_cfg["pixabay_api_keys"] = [pixabay]

    # Seslendirme: edge_tts ücretsiz ve varsayılan; dile göre ses seçilir.
    app_cfg.setdefault("subtitle_provider", "edge")


# Dile göre varsayılan (ücretsiz edge-tts) ses.
_DEFAULT_VOICE = {
    "tr": "tr-TR-EmelNeural-Female",
    "en": "en-US-JennyNeural-Female",
}

# 16:9 yatay / 9:16 dikey eşleme.
_ASPECT = {
    "portrait": "9:16",
    "landscape": "16:9",
}


def generate_video(
    *,
    subject: str,
    script: str = "",
    language: str = "tr",
    aspect: str = "portrait",
    voice_name: Optional[str] = None,
) -> Dict[str, Any]:
    """Bir konu/senaryodan tam video üretir. Çıktı video yolunu döndürür.

    Raises:
        VideoEngineUnavailable: motor bağımlılıkları kurulu değilse.
    """
    _ensure_on_path()
    try:
        from app.config import config  # type: ignore
        from app.models.schema import VideoAspect, VideoParams  # type: ignore
        from app.services import task as mpt_task  # type: ignore
    except Exception as exc:  # ImportError vb.
        raise VideoEngineUnavailable(
            "Video motoru bağımlılıkları kurulu değil (moviepy, edge_tts, "
            "faster-whisper). Kurulum: pip install -r backend/requirements.txt"
        ) from exc

    _bridge_env_to_config(config, language=language)

    if not (config.app.get("gemini_api_key") or config.app.get("openai_api_key")):
        raise VideoEngineUnavailable(
            "Senaryo üretimi için bir AI anahtarı gerekli (GEMINI_API_KEY veya "
            "OPENAI_API_KEY)."
        )

    aspect_value = (
        VideoAspect.portrait.value if _ASPECT.get(aspect, "9:16") == "9:16"
        else VideoAspect.landscape.value
    )
    voice = voice_name or _DEFAULT_VOICE.get(language, _DEFAULT_VOICE["en"])

    params = VideoParams(
        video_subject=subject,
        video_script=script or "",
        video_aspect=aspect_value,
        voice_name=voice,
        video_language=language,
    )

    task_id = f"kade_{uuid.uuid4().hex[:12]}"
    result = mpt_task.start(task_id, params, stop_at="video")

    if not result:
        raise RuntimeError("Video üretimi başarısız oldu (pipeline boş sonuç).")

    # Motor sonucu {"videos": [...]} veya benzeri döndürür; normalize et.
    videos = result.get("videos") if isinstance(result, dict) else None
    return {
        "task_id": task_id,
        "videos": videos or [],
        "raw": result,
    }
