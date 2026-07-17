"""KADE AI Platform — Unified Backend
Combines KADE AutoEdit AI (video processing) and KADE Growth AI (analytics).

AutoEdit modules: port 8472 → unified as /video/* routes
Growth modules:   port 8473 → unified as /growth/* routes

Run: uvicorn main:app --reload --host 0.0.0.0 --port 8472
"""

import inspect
import json
import html
import secrets
import time
import uuid
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Any, Dict, List, Literal, Optional

import uvicorn
from fastapi import FastAPI, HTTPException, Request, WebSocket, WebSocketDisconnect
from fastapi.encoders import jsonable_encoder
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from core.config import settings as core_settings

# ─── AutoEdit modules ────────────────────────────────────────────────────────
from modules.silence_cutter import cut_silences
from modules.whisper_transcript import transcribe_audio
from modules.beat_sync import detect_beats
from modules.scene_detector import detect_scenes
from modules.auto_color import analyze_color_audio
from modules.auto_captions import generate_captions
from modules.auto_zoom import detect_zoom_points
from modules.viral_detector import detect_viral_segments
from modules.podcast_mode import detect_speakers
from modules.repeat_detector import detect_repeats
from modules.profanity_filter import filter_profanity
from modules.auto_chapters import generate_chapters
from modules.auto_resize import analyze_resize
from modules.broll_suggest import suggest_broll


# ─── WebSocket manager ───────────────────────────────────────────────────────
class ConnectionManager:
    def __init__(self):
        self.active: List[WebSocket] = []

    async def connect(self, ws: WebSocket):
        await ws.accept()
        self.active.append(ws)

    def disconnect(self, ws: WebSocket):
        if ws in self.active:
            self.active.remove(ws)

    async def broadcast(self, message: dict):
        dead = []
        for ws in self.active:
            try:
                await ws.send_json(message)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.disconnect(ws)


manager = ConnectionManager()


@asynccontextmanager
async def lifespan(app: FastAPI):
    if core_settings.environment == "production":
        if not core_settings.backend_token or len(core_settings.backend_token) < 32:
            raise RuntimeError("KADE_BACKEND_TOKEN must contain at least 32 characters in production.")
        if not core_settings.allowed_origins or any(origin == "*" for origin in core_settings.allowed_origins):
            raise RuntimeError("KADE_ALLOWED_ORIGINS must be an explicit production allowlist.")
    core_settings.media_root.mkdir(parents=True, exist_ok=True)
    print("KADE AI Platform Backend starting...")
    yield
    print("KADE AI Platform Backend shutting down...")


app = FastAPI(
    title="KADE AI Platform Backend",
    version="1.0.0",
    description="Unified backend: AutoEdit AI + Growth AI",
    lifespan=lifespan,
    docs_url=None if core_settings.environment == "production" else "/docs",
    redoc_url=None if core_settings.environment == "production" else "/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=list(core_settings.allowed_origins),
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Authorization", "Content-Type"],
)

_rate_buckets: Dict[str, tuple[int, float]] = {}


@app.middleware("http")
async def security_gate(request: Request, call_next):
    if request.url.path in {"/health", "/growth/health"} or (
        request.url.path == "/oauth/youtube/callback" and request.method == "GET"
    ):
        return await call_next(request)

    if not core_settings.backend_token:
        return JSONResponse({"detail": "Backend authentication is not configured."}, status_code=503)
    authorization = request.headers.get("authorization", "")
    provided = authorization[7:] if authorization.lower().startswith("bearer ") else ""
    if not provided or not secrets.compare_digest(provided, core_settings.backend_token):
        return JSONResponse({"detail": "Unauthorized"}, status_code=401)

    content_length = request.headers.get("content-length")
    if content_length and content_length.isdigit() and int(content_length) > 2 * 1024 * 1024:
        return JSONResponse({"detail": "Request body too large"}, status_code=413)

    client = request.client.host if request.client else "unknown"
    now = time.monotonic()
    if len(_rate_buckets) > 4096:
        expired_clients = [key for key, (_, reset) in _rate_buckets.items() if reset <= now]
        for key in expired_clients:
            _rate_buckets.pop(key, None)
    count, reset_at = _rate_buckets.get(client, (0, now + 60))
    if now >= reset_at:
        count, reset_at = 0, now + 60
    if count >= 60:
        return JSONResponse({"detail": "Too many requests"}, status_code=429, headers={"Retry-After": str(max(1, int(reset_at - now)))})
    _rate_buckets[client] = (count + 1, reset_at)
    return await call_next(request)


# ─── Health ──────────────────────────────────────────────────────────────────
@app.get("/health")
async def health():
    return {"status": "ok", "version": "1.0.0", "modules": ["autoedit", "growth"]}


# ─── WebSocket ───────────────────────────────────────────────────────────────
@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    authorization = ws.headers.get("authorization", "")
    provided = authorization[7:] if authorization.lower().startswith("bearer ") else ""
    if not core_settings.backend_token or not provided or not secrets.compare_digest(provided, core_settings.backend_token):
        await ws.close(code=4401)
        return
    await manager.connect(ws)
    try:
        while True:
            await ws.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(ws)


# ══════════════════════════════════════════════════════════════════════════════
#  VIDEO EDITOR ROUTES (AutoEdit AI)
# ══════════════════════════════════════════════════════════════════════════════

class VideoRequest(BaseModel):
    video_path: str = Field(min_length=1, max_length=2048)


class SilenceCutRequest(VideoRequest):
    threshold_db: float = -40.0
    min_silence_ms: int = 500
    padding_ms: int = 100


class TranscriptRequest(VideoRequest):
    language: str = "tr"
    model_size: str = "base"


class BeatSyncRequest(VideoRequest):
    bpm_override: float = 0
    sensitivity: str = "medium"


class SceneDetectRequest(VideoRequest):
    threshold: float = 30.0
    min_scene_length: float = 1.0


class AutoColorRequest(VideoRequest):
    sample_rate: int = 30


class AutoCaptionsRequest(VideoRequest):
    language: str = "tr"
    max_chars_per_line: int = 42


class AutoZoomRequest(VideoRequest):
    zoom_factor: float = 1.15
    min_zoom_duration: float = 1.5


class ViralDetectorRequest(VideoRequest):
    min_clip_duration: int = 15
    max_clip_duration: int = 60
    top_n: int = 5


class PodcastModeRequest(VideoRequest):
    num_speakers: int = 0


class RepeatDetectorRequest(VideoRequest):
    similarity_threshold: float = 0.85
    min_duration: float = 2.0


class ProfanityFilterRequest(VideoRequest):
    language: str = "tr"
    action: str = "mark"


class AutoChaptersRequest(VideoRequest):
    min_chapter_duration: int = 60
    max_chapters: int = 15


class AutoResizeRequest(VideoRequest):
    target_format: str = "9:16"


class BrollSuggestRequest(VideoRequest):
    language: str = "tr"
    min_segment_duration: float = 3.0


async def _run_module(fn, *args, **kwargs) -> Dict[str, Any]:
    """Wraps module call, catches errors uniformly."""
    try:
        if "video_path" in kwargs:
            candidate = Path(str(kwargs["video_path"])).expanduser().resolve()
            try:
                candidate.relative_to(core_settings.media_root)
            except ValueError as exc:
                raise HTTPException(status_code=403, detail="Video path is outside the configured media root.") from exc
            if not candidate.is_file():
                raise HTTPException(status_code=404, detail="Video file was not found.")
            kwargs["video_path"] = str(candidate)
        result = fn(*args, **kwargs)
        if inspect.isawaitable(result):
            result = await result
        return {"success": True, "data": jsonable_encoder(result)}
    except HTTPException:
        raise
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Video file was not found.")
    except Exception as exc:
        raise HTTPException(status_code=500, detail="Processing failed.") from exc


@app.post("/silence-cut")
async def silence_cut(req: SilenceCutRequest):
    return await _run_module(
        cut_silences,
        video_path=req.video_path,
        threshold_db=req.threshold_db,
        min_silence_ms=req.min_silence_ms,
        keep_padding_ms=req.padding_ms,
    )


@app.post("/transcript")
async def transcript(req: TranscriptRequest):
    return await _run_module(
        transcribe_audio,
        video_path=req.video_path,
        language=req.language,
        model_name=req.model_size,
    )


@app.post("/beat-sync")
async def beat_sync(req: BeatSyncRequest):
    sensitivity_map = {"low": 0.35, "medium": 0.65, "high": 0.9}
    return await _run_module(
        detect_beats,
        video_path=req.video_path,
        sensitivity=sensitivity_map.get(req.sensitivity, 0.65),
    )


@app.post("/scene-detect")
async def scene_detect(req: SceneDetectRequest):
    return await _run_module(
        detect_scenes,
        video_path=req.video_path,
        threshold=req.threshold,
        min_scene_duration=req.min_scene_length,
    )


@app.post("/auto-color")
async def auto_color(req: AutoColorRequest):
    return await _run_module(
        analyze_color_audio,
        video_path=req.video_path,
    )


@app.post("/auto-captions")
async def auto_captions(req: AutoCaptionsRequest):
    return await _run_module(
        generate_captions,
        video_path=req.video_path,
        language=req.language,
    )


@app.post("/auto-zoom")
async def auto_zoom(req: AutoZoomRequest):
    return await _run_module(
        detect_zoom_points,
        video_path=req.video_path,
        min_scale=req.zoom_factor,
        zoom_duration=req.min_zoom_duration,
    )


@app.post("/viral-detector")
async def viral_detector(req: ViralDetectorRequest):
    return await _run_module(
        detect_viral_segments,
        video_path=req.video_path,
        min_duration=req.min_clip_duration,
        clip_duration=req.max_clip_duration,
        top_n=req.top_n,
    )


@app.post("/podcast-mode")
async def podcast_mode(req: PodcastModeRequest):
    return await _run_module(
        detect_speakers,
        video_path=req.video_path,
    )


@app.post("/repeat-detector")
async def repeat_detector(req: RepeatDetectorRequest):
    return await _run_module(
        detect_repeats,
        video_path=req.video_path,
        similarity_threshold=req.similarity_threshold,
    )


@app.post("/profanity-filter")
async def profanity_filter(req: ProfanityFilterRequest):
    return await _run_module(
        filter_profanity,
        video_path=req.video_path,
        language=req.language,
        replacement=req.action,
    )


@app.post("/auto-chapters")
async def auto_chapters(req: AutoChaptersRequest):
    return await _run_module(
        generate_chapters,
        video_path=req.video_path,
        min_chapter_duration=req.min_chapter_duration,
        max_chapters=req.max_chapters,
    )


@app.post("/auto-resize")
async def auto_resize(req: AutoResizeRequest):
    return await _run_module(
        analyze_resize,
        video_path=req.video_path,
    )


@app.post("/broll-suggest")
async def broll_suggest(req: BrollSuggestRequest):
    return await _run_module(
        suggest_broll,
        video_path=req.video_path,
        language=req.language,
        min_duration=req.min_segment_duration,
    )


# ══════════════════════════════════════════════════════════════════════════════
#  GROWTH ANALYTICS ROUTES (Growth AI)
# ══════════════════════════════════════════════════════════════════════════════

# These routes proxy to or replicate Growth AI functionality.
# For full OAuth2 + PostgreSQL integration, configure core/config.py and
# run `alembic upgrade head` before starting.

try:
    from collectors.youtube import (
        build_authorization_url,
        exchange_code_for_tokens,
        fetch_channel_identity,
    )
    from collectors.base import MetricSnapshotDTO
    _youtube_available = True
except ImportError:
    _youtube_available = False

_oauth_states: Dict[str, float] = {}


@app.get("/growth/health")
async def growth_health():
    return {
        "status": "ok",
        "youtube_collector": _youtube_available,
        "platforms": ["youtube", "instagram", "tiktok", "kick"],
    }


@app.get("/oauth/youtube/auth-url")
async def youtube_auth_url():
    if not _youtube_available:
        raise HTTPException(status_code=503, detail="YouTube collector not available. Check requirements.")
    try:
        if not core_settings.youtube_client_id or not core_settings.youtube_client_secret:
            raise HTTPException(status_code=503, detail="YOUTUBE_CLIENT_ID/SECRET ortam değişkenleri eksik.")
        now = time.monotonic()
        for expired_state in [key for key, expires_at in _oauth_states.items() if expires_at <= now]:
            _oauth_states.pop(expired_state, None)
        state = secrets.token_urlsafe(24)
        _oauth_states[state] = now + 600
        return {"auth_url": build_authorization_url(core_settings.youtube_redirect_uri, state)}
    except Exception as exc:
        if isinstance(exc, HTTPException):
            raise exc
        raise HTTPException(status_code=500, detail="OAuth initialization failed.") from exc


@app.post("/oauth/youtube/callback")
async def youtube_callback(code: str, account_id: Optional[int] = None):
    raise HTTPException(status_code=410, detail="Legacy token-returning callback is disabled.")


@app.get("/oauth/youtube/callback", response_class=HTMLResponse)
async def youtube_callback_get(request: Request):
    if not _youtube_available:
        raise HTTPException(status_code=503, detail="YouTube collector not available.")
    code = request.query_params.get("code")
    state = request.query_params.get("state")
    error = request.query_params.get("error")
    if error:
        return HTMLResponse("<h1>YouTube bağlantısı iptal edildi</h1>", status_code=400)
    expires_at = _oauth_states.pop(state, 0) if state else 0
    if not code or not state or expires_at < time.monotonic():
        return HTMLResponse("<h1>YouTube bağlantısı başarısız</h1><p>Authorization code eksik.</p>", status_code=400)
    try:
        tokens = await exchange_code_for_tokens(code, core_settings.youtube_redirect_uri)
        identity = await fetch_channel_identity(tokens["access_token"])
        channel = html.escape(str(identity.get("handle") or identity.get("external_id") or "Bağlandı"))
        return HTMLResponse(
            "<h1>YouTube bağlandı</h1>"
            f"<p>Kanal: {channel}</p>"
            "<p>Bu pencereyi kapatıp KADE Growth ekranına dönebilirsin.</p>"
        )
    except Exception:
        return HTMLResponse("<h1>YouTube bağlantısı başarısız</h1>", status_code=500)


class InsightRequest(BaseModel):
    period: Literal["daily", "weekly", "monthly"] = "weekly"
    platform: Optional[Literal["youtube", "instagram", "tiktok", "kick"]] = None


@app.post("/insights/generate")
async def generate_insight(req: InsightRequest):
    """Generate AI insights using Claude API."""
    import os
    anthropic_key = os.environ.get("ANTHROPIC_API_KEY")
    if not anthropic_key:
        raise HTTPException(status_code=503, detail="ANTHROPIC_API_KEY ortam değişkeni bulunamadı.")
    try:
        import anthropic
        client = anthropic.Anthropic(api_key=anthropic_key, timeout=25.0, max_retries=1)
        prompt = f"""Sen bir sosyal medya büyüme analistisisin.
Kullanıcının {req.period} performans verilerini analiz et ve Türkçe olarak:
1. En güçlü 3 büyüme alanı
2. Dikkat edilmesi gereken 2 zayıflık
3. Bu hafta için 3 somut eylem önerisi
yazarak kısa bir rapor oluştur."""
        message = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=1024,
            messages=[{"role": "user", "content": prompt}],
        )
        return {"success": True, "period": req.period, "summary": message.content[0].text}
    except Exception as exc:
        raise HTTPException(status_code=500, detail="Insight generation failed.") from exc


@app.post("/reports/weekly")
async def weekly_report():
    """Generate weekly growth report using Claude API."""
    import os
    anthropic_key = os.environ.get("ANTHROPIC_API_KEY")
    if not anthropic_key:
        raise HTTPException(status_code=503, detail="ANTHROPIC_API_KEY ortam değişkeni bulunamadı.")
    try:
        import anthropic
        client = anthropic.Anthropic(api_key=anthropic_key, timeout=25.0, max_retries=1)
        prompt = """Bir içerik üreticisi için kapsamlı haftalık sosyal medya büyüme raporu oluştur.
Rapor şu bölümleri içersin:
📊 HAFTALIK ÖZET
📈 BÜYÜME METRİKLERİ
🏆 EN İYİ PERFORMANS
⚠️ DİKKAT EDİLECEKLER
🎯 GELECEK HAFTA STRATEJİSİ

Türkçe yaz, net ve eyleme geçirilebilir öneriler sun."""
        message = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=2048,
            messages=[{"role": "user", "content": prompt}],
        )
        return {"success": True, "report": message.content[0].text}
    except Exception as exc:
        raise HTTPException(status_code=500, detail="Report generation failed.") from exc


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8472, reload=True)
