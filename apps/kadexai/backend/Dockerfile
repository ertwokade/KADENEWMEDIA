FROM python:3.11-slim AS runtime

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    KADE_ENV=production \
    PORT=8472

RUN apt-get update \
    && apt-get install --no-install-recommends -y ffmpeg libgl1 libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd --system kade \
    && useradd --system --gid kade --create-home kade

WORKDIR /app
COPY requirements.txt ./
# The Keyubu VDS has no CUDA GPU. Preinstall the official CPU wheel so
# openai-whisper does not pull several gigabytes of NVIDIA libraries.
RUN python -m pip install --upgrade pip \
    && python -m pip install torch --index-url https://download.pytorch.org/whl/cpu \
    && python -m pip install -r requirements.txt

COPY . .
# Video Fabrikası motoru eksik paketle sessizce 503 dönüyordu. Import burada
# doğrulanır: bir bağımlılık eksikse imaj derlenmez ve dağıtım eski sürüme döner.
RUN python -c "import sys; sys.path.insert(0, 'vendor/mpturbo'); from app.config import config; from app.models.schema import VideoParams; from app.services import task; print('video engine import ok')"
RUN mkdir -p /app/media && chown -R kade:kade /app
USER kade

EXPOSE 8472
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8472/health', timeout=3)"

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8472", "--workers", "2", "--proxy-headers", "--forwarded-allow-ips", "*"]
