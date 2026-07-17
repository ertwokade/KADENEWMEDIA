import json
import os
import subprocess
import tempfile
from pathlib import Path


def _ensure_file(path: str) -> Path:
    source = Path(path)
    if not source.exists():
        raise FileNotFoundError(path)
    return source


def extract_audio(video_path: str) -> str:
    source = _ensure_file(video_path)
    if source.suffix.lower() in {".wav", ".mp3", ".m4a", ".aac", ".flac", ".ogg"}:
        return str(source)

    out_path = Path(tempfile.gettempdir()) / f"kade_audio_{os.getpid()}_{abs(hash(str(source)))}.wav"
    cmd = [
        "ffmpeg", "-y", "-i", str(source),
        "-vn", "-ac", "1", "-ar", "16000",
        str(out_path),
    ]
    try:
        subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)
    except FileNotFoundError as exc:
        raise RuntimeError("FFmpeg bulunamadı. Video analizleri için FFmpeg'i PATH içine ekle.") from exc
    except subprocess.CalledProcessError as exc:
        detail = exc.stderr.decode("utf-8", errors="ignore").strip()
        raise RuntimeError(f"FFmpeg audio çıkarma hatası: {detail}") from exc
    return str(out_path)


def get_video_info(video_path: str) -> dict:
    source = _ensure_file(video_path)
    cmd = [
        "ffprobe", "-v", "error",
        "-show_entries", "format=duration",
        "-show_streams",
        "-of", "json",
        str(source),
    ]
    try:
        completed = subprocess.run(cmd, check=True, capture_output=True, text=True)
        data = json.loads(completed.stdout or "{}")
    except FileNotFoundError as exc:
        raise RuntimeError("FFprobe bulunamadı. Video bilgisi için FFmpeg paketini kur.") from exc
    except Exception as exc:
        raise RuntimeError(f"Video bilgisi okunamadı: {exc}") from exc

    duration = float(data.get("format", {}).get("duration") or 0)
    video_stream = next((s for s in data.get("streams", []) if s.get("codec_type") == "video"), {})
    return {
        "duration": duration,
        "width": int(video_stream.get("width") or 0),
        "height": int(video_stream.get("height") or 0),
        "fps": video_stream.get("r_frame_rate", ""),
    }
