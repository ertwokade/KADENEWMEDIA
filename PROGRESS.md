# Kade Studio — İlerleme

Son güncelleme: 2026-07-20

## Durum

- [x] Mevcut repository, kullanıcı değişiklikleri ve yerel araçlar incelendi.
- [x] Mevcut Vite sitesi ve `apps/kadexai` ürününü koruyan izole workspace yaklaşımı seçildi.
- [x] pnpm workspace ve temel uygulamalar
- [x] PostgreSQL/Drizzle şeması ve migration
- [x] Redis/BullMQ ve MinIO storage
- [x] Timeline çekirdeği ve unit testleri
- [x] Upload/ingest/transkripsiyon hattı
- [x] Next.js dashboard ve editör
- [x] Deterministik/OpenAI planner, undo/redo ve sürümler
- [x] FFmpeg export ve indirme
- [x] Integration/E2E testleri ve fixture
- [x] Docker Compose, CI ve dokümantasyon
- [x] Tam Docker doğrulaması ve gerçek tarayıcıdan uçtan uca export

## Doğrulama günlüğü

- Node.js `v24.15.0` bulundu.
- Docker `29.6.1`, Compose `v5.3.0` bulundu.
- FFmpeg/ffprobe `8.1.2` bulundu.
- Corepack üzerinden pnpm `11.15.1` hazırlandı.
- Mevcut çalışma ağacındaki `src/App.jsx` ve Kadir Demir sayfası değişiklikleri kullanıcıya ait kabul edilerek kapsam dışında bırakıldı.
- `pnpm lint`: geçti.
- `pnpm typecheck`: geçti.
- Unit: 13/13 geçti.
- Integration: 3/3 geçti (gerçek PostgreSQL + Redis).
- Production Next.js build: geçti.
- MinIO bucket init ve server-level browser CORS: exit code 0.
- Gerçek FFmpeg media smoke: 14.0s kaynak, iki sessizlik, 11.0s H.264 360x640 export; ffprobe geçti.
- `docker compose up --build`: tüm imajlar oluşturuldu; migration ve MinIO init exit code 0; web, worker, PostgreSQL, Redis ve MinIO ayağa kalktı.
- `/api/health`: database, Redis ve storage kontrollerinin tamamı geçti; `AI_MODE=mock` doğrulandı.
- Playwright E2E: gerçek upload → ingest → mock transkript → komut → undo/redo → 9:16 export akışı geçti.
- E2E export ffprobe: H.264 + AAC, 1080x1920, 9.626 saniye.
- Host diski test sırasında dolunca yalnızca yeniden üretilebilir npm/pnpm/Playwright ve Docker build önbellekleri temizlendi. Redis AOF'nin yarım kalan 193 baytlık kuyruğu `redis-check-aof` ile onarıldı; proje/veritabanı/medya volume'ları korunarak doğrulama tamamlandı.
