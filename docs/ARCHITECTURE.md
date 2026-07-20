# Kade Studio Mimarisi

## Bileşenler

```text
Browser ──HTTP──> Next.js web ──SQL──> PostgreSQL
   │                   │
   └─presigned PUT────>MinIO         Redis/BullMQ
                                           │
                                      Worker/FFmpeg ──> MinIO
```

- `apps/studio-web`: App Router UI, auth gate, API, presigned URL, planner ve timeline transaction’ları.
- `apps/studio-worker`: ingest/transcription/export consumer’ları; tüm FFmpeg çağrıları argument-array ile yapılır.
- `packages/db`: Drizzle şeması, pool ve migration runner.
- `packages/editor-core`: UI/database/network bağımsız timeline, mapping, caption, planner validation ve FFmpeg script fonksiyonları.
- `packages/shared`: environment, S3 ve BullMQ bağlantıları.

## Upload akışı

1. Browser project oluşturur.
2. Web MIME, boyut ve project UUID’sini doğrular; UUID tabanlı key ve presigned PUT verir.
3. Browser dosyayı doğrudan MinIO/S3’e yollar.
4. Complete endpoint key’in proje prefix’ini doğrular, Asset + ProcessingJob yazar ve ingest job ekler.

## Ingest akışı

Worker original nesneyi geçici dizine indirir. ffprobe gerçek container/stream türünü doğrular. En fazla 720p proxy, en fazla 1080p mezzanine, 16 kHz mono WAV, waveform ve üç thumbnail üretilir. `silencedetect` aralıkları `analysisJson` içinde saklanır. Çıktılar H.264/AAC/yuv420p’dir. İş ilerlemesi BullMQ ve database’e yazılır.

## Transcription akışı

Mock mod asset süresine göre deterministik kelimeler üretir. OpenAI modu çıkarılmış mono sesi `verbose_json` ve word/segment timestamp ile gönderir. 24 MB üzeri ses 15 dakikalık MP3 parçalara ayrılır; chunk offset’i word timestamp’lerine eklenir ve sınır tekrarları temizlenir.

## Edit planner akışı

Komut önce Türkçe/İngilizce regex parser’dan geçer. Tanınmazsa OpenAI Responses API Zod Structured Output’a düşer. Girdi yalnız komut, duration, aspect/caption state ve cümle listesidir. Plan Zod, range sınırı ve sentence ID whitelist kontrolünden sonra uygulanır. Command öncesindeki history korunur, redo dalı yeni editte silinir, yeni snapshot atomik transaction ile yazılır.

## Preview mapping

HTML video proxy’yi source zamanında oynatır. UI playhead output zamanıdır. `sourceTimeToTimelineTime` ve `timelineTimeToSourceTime` included range’lerin kümülatif uzunluklarını kullanır. Oynatma bir cut’a girince bir sonraki included range başlangıcına atlar. Güncelleme `requestAnimationFrame` ile React render hızından ayrılır.

## Export akışı

Web belirli timeline version için Export kaydı ve BullMQ işi oluşturur. Worker snapshot’ı ve mezzanine’i alır; her included range için video `trim/setpts`, audio `atrim/asetpts` ve kısa fade üretir, segmentleri concat eder, crop/pad uygular, ASS captions ve title overlay ekler. Büyük graph geçici filter script dosyasındadır. FFmpeg progress database’e yazılır. Çıktı ffprobe ile codec/ölçü/süre açısından doğrulanır, MinIO’ya yüklenir ve presigned download endpoint’i sunulur.
