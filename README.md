# Kade Studio

**Prompt ile kurgula. Timeline’da kontrol et.**

Kade Studio, tek konuşmacılı video ve ses kayıtlarını non-destructive biçimde düzenleyen Türkçe-first bir Kade Media ürünüdür. MP4/MOV/WebM/MP3/WAV yükler, FFmpeg ile proxy ve mezzanine üretir, kelime zaman kodlu transkript çıkarır, doğal dil komutlarını doğrulanmış edit planlarına çevirir ve altyazılı H.264/AAC MP4 export eder.

> Repository’deki mevcut Kade Media Vite sitesi korunmuştur. Eski site komutları `legacy:*`, Kade Studio ise varsayılan workspace komutları altındadır.

## Ekranlar

- `/` — proje dashboard’u, durumlar ve Demo AI etiketi
- `/projects/new` — proje oluşturma, dosya doğrulama ve doğrudan MinIO upload
- `/editor/[projectId]` — AI kurgu/transkript, source-mapped player, inspector, timeline, undo/redo, versiyon ve export
- `/login` — `APP_PASSWORD` ayarlıysa internal password gate
- `/api/health` — PostgreSQL, Redis, MinIO ve AI modu health sonucu

## Mimari

Next.js web uygulaması kısa request/response işlemlerini yürütür. Browser dosyayı presigned PUT ile doğrudan MinIO’ya yollar. BullMQ işleri Redis’te tutulur. Worker ingest ve export sırasında FFmpeg/ffprobe çalıştırır; uzun medya işi web request’i içinde yapılmaz. PostgreSQL/Drizzle proje, asset, transkript, kelime, timeline, snapshot, command, processing job ve export kayıtlarını saklar.

Detaylar: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) ve [docs/EDITOR_MODEL.md](docs/EDITOR_MODEL.md).

## Gereksinimler

- Node.js 22 LTS veya uyumlu güncel sürüm
- Corepack + pnpm 11
- Docker Desktop / Docker Engine + Compose
- Yerel geliştirme worker’ı için FFmpeg ve ffprobe (`subtitles/libass` filtresi dahil)

## Geliştirme kurulumu

```bash
cp .env.example .env
corepack prepare pnpm@11.15.1 --activate
docker compose up -d postgres redis minio minio-init
pnpm install
pnpm db:migrate
pnpm demo:fixture
pnpm dev
```

Windows PowerShell execution policy `pnpm.ps1` çalıştırmıyorsa komutların başına `corepack` ekleyin: `corepack pnpm dev`.

Uygulama: <http://localhost:3000>
MinIO Console: <http://localhost:9001> (`kade` / `.env` içindeki secret)

## Tek komut Docker

```bash
cp .env.example .env
docker compose up --build
```

Servisler: `postgres`, `redis`, `minio`, `minio-init`, `migrate`, `web`, `worker`. Bucket private oluşturulur; browser upload CORS origin’i MinIO server environment’i ile otomatik uygulanır.

## Mock AI modu

Varsayılan `AI_MODE=mock` değeridir ve API anahtarı istemez. Gerçek FFmpeg ingest/export aynen çalışır; yalnız AI transkripti asset süresinden deterministik oluşturulur. Metinde test edilebilir `ııı`, `şey` ve `yani` kelimeleri vardır.

## OpenAI modu

`.env` içinde:

```dotenv
AI_MODE=openai
OPENAI_API_KEY=sk-...
OPENAI_EDIT_MODEL=gpt-5-mini
OPENAI_TRANSCRIPTION_MODEL=whisper-1
```

Worker 16 kHz mono sesi kullanır; büyük dosyaları 15 dakikalık ve 25 MB altı parçalara böler, offset’leri birleştirir ve sınır tekrarlarını temizler. Planner önce deterministik Türkçe/İngilizce parser’ı dener; gerekirse Responses API + Zod Structured Output kullanır ve `store: false` gönderir. Model yalnız sağlanan sentence ID’leri arasından seçim yapabilir; ham video byte’ları modele gönderilmez.

## Test ve kalite komutları

```bash
pnpm lint
pnpm typecheck
pnpm test:unit
pnpm test:integration   # PostgreSQL + Redis gerekir
pnpm demo:fixture
pnpm --filter @kade/studio-worker test:media
pnpm test:e2e           # tam Docker stack gerekir
pnpm build
pnpm verify
```

Media smoke testi gerçek FFmpeg proxy/mezzanine/audio/waveform/thumbnail üretir, sessizlikleri doğrular, dikey kısa MP4 export eder ve sonucu ffprobe ile denetler.

## Demo senaryosu

1. `pnpm demo:fixture` ile 14 saniyelik test videosunu oluşturun.
2. Dashboard’dan yeni proje açıp `fixtures/generated/kade-studio-demo.mp4` dosyasını yükleyin.
3. Ingest tamamlanınca şu komutu gönderin:

   `0.7 saniyeden uzun sessizlikleri kes, ııı ve şey kelimelerini çıkar, 9:16 yap ve Kade altyazılarını aç.`

4. Timeline süresinin kısaldığını, oranı ve caption track’i kontrol edin.
5. Undo/redo yapın ve MP4 export başlatın.
6. Tamamlanan export’u indirin.

## Güvenlik notları

- Kullanıcı metni shell komutuna dönüştürülmez; execa argument array kullanılır.
- Storage key’leri UUID tabanlı ve server üretimlidir.
- MIME browser’da, gerçek format worker’da ffprobe ile doğrulanır.
- Timeline planı ve sentence ID’leri Zod ile doğrulanır.
- `APP_PASSWORD` session cookie’si HttpOnly, SameSite=Lax ve production’da Secure’dur.
- Secret’lar `NEXT_PUBLIC_*` dışında client bundle’a aktarılmaz.

## Sorun giderme

- **Health 503:** `docker compose ps` ve `docker compose logs worker web` çalıştırın.
- **Upload CORS:** `S3_PUBLIC_ENDPOINT=http://localhost:9000` ve `MINIO_API_CORS_ALLOW_ORIGIN` değerini kontrol edin.
- **Worker subtitles hatası:** `ffmpeg -filters | grep subtitles` çıktısında `subtitles` bulunmalı; image `fontconfig` ve `libass` kurar.
- **Windows pnpm bulunamadı:** `corepack pnpm <komut>` kullanın.
- **Docker overlayfs read-only:** Host diskinde alan açın, sonra `docker desktop stop --force && docker desktop start` uygulayın. Volume silmeyin.

## Bilinen sınırlamalar

- MVP tek primary asset ve tek konuşmacı odaklıdır.
- Browser preview proxy üzerinde source seek ile çalışır; export öncesi her edit için yeni render üretilmez.
- OpenAI çağrıları anahtarsız ortamda çalıştırılmaz; deterministik parser ve mock transkript çalışmaya devam eder.
- Windows’taki bazı bağımsız FFmpeg dağıtımları `libass` içerse de Fontconfig dosyası sağlamaz. Docker worker önerilir.
- Gerçek zamanlı ortak çalışma, ödeme, AI video/görsel/müzik üretimi ve multi-camera kapsam dışıdır.

## Legacy site

Mevcut Kade Media sitesi için: `pnpm legacy:dev`, `pnpm legacy:build`, `pnpm legacy:lint`, `pnpm legacy:test:unit`.
