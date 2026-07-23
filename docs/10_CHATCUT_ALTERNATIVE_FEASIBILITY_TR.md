# 10 — ChatCut Alternatifi Video Editör: Fizibilite (Faz 2, şartname §17)

**Temel karar:** `docs/02_ARCHITECTURE_DECISIONS_TR.md` KARAR 1'e bakın — temel
Kade Studio (`apps/studio-web` + `apps/studio-worker` + `packages/editor-core`).

## 1. Zaten var olan (kod incelemesiyle doğrulandı, 20 Temmuz 2026 commit'i)

| Şartname §17.1 maddesi | Kade Studio karşılığı | Durum |
|---|---|---|
| Video upload/import | Presign/complete API rotaları, S3/MinIO | Var |
| Güvenli multipart upload | Presigned URL akışı | Var, güvenlik testleri doğrulanmalı |
| Transkripsiyon | `worker/media.ts` → OpenAI Whisper (`AI_MODE=openai`) veya mock fallback, kelime-bazlı zaman damgası | Var |
| Transcript tabanlı kesme | Timeline/proje API'leri | Var |
| Sessizlik tespiti | `ingest.ts` → `detectSilences` | Var |
| Filler kelime tespiti | `planner.ts` → `remove_fillers` operasyonu | Var |
| Doğal dil komutla düzenleme | Türkçe/İngilizce parser ("sessizlikleri kaldır" vb.) | Var — şartnamenin istediğinden bile ileri |
| Highlight önerisi | Doğrulanmadı | Belirsiz |
| Otomatik altyazı | `captions.ts` → kelime gruplama + ASS format, 3 stil preseti | Var |
| Altyazı stilleri | 3 preset | Var |
| 9:16, 1:1, 16:9 dönüşümü | `planner.ts`+`ffmpeg.ts` → crop/pad filtre grafiği | Var |
| Basit crop/reframe | Aynı | Var |
| Render job queue | BullMQ (`export.ts`) | Var |
| İlerleme durumu | Progress tracking | Var |
| Proje kaydı | DB şeması (`@kade/db`) + timeline snapshot versiyonlama | Var |

## 2. Eksik (şartname §17.1'den, kodda bulunamadı)

- **Kullanım kredisi** — `packages/db` içinde "credit"/"usage" araması boş döndü. Bu, §8 (ticari veri modeli) ile kesişen bir iş — `docs/05_COMMERCE_AND_ENTITLEMENT_TR.md` §3'teki UsageLimit/CreditWallet tasarımıyla birlikte ele alınmalı.
- **Retry/cancel** — job kuyruğunda görünmüyor.
- **Logo/watermark, intro/outro/CTA şablonları** — yok.
- **Basit B-roll önerisi** — yok.
- **Manuel timeline düzeltmesi** (kullanıcı arayüzü seviyesinde) — backend var, frontend editör UI'ının bu API'leri ne kadar kullandığı bu turda ayrıca doğrulanmadı.

## 3. §17.2 (sonraki aşama) ve §17.3 (teknik zorunluluklar)

- Ağır render işlemleri zaten worker/queue'da (Web request içinde değil) — §17.3'ün en kritik maddesi **zaten karşılanıyor**.
- FFmpeg izolasyonu: `ffmpeg.ts` ayrı bir modül, worker sürecinde çalışıyor — mimari doğru.
- Sandbox/izolasyon, dosya-arası erişim testleri, fail/retry/idempotency tasarımı: **bu turda kod okumasıyla doğrulanamadı**, canlı ortamda güvenlik testi gerektirir (Faz 8/9).
- AI servis maliyetinin admin panelinde görünürlüğü: yok, kredi sistemiyle birlikte eklenmeli.

## 4. §17.4 (telif/lisans)

Kullanıcı upload hakları kabulü, üçüncü taraf müzik/stock/font lisans takibi,
"royalty-free" iddiası kontrolü, AI üretim lisans belgelemesi, takedown süreci —
**bu turda hiçbiri doğrulanmadı/uygulanmadı**. Bunlar Faz 8 (hukuki) kapsamına
giriyor ve genel IP/içerik koruma sistemiyle (§21) birlikte ele alınmalı.

## 5. Sonuç ve öncelik sırası (Faz 6 için)

1. Kredi/kullanım sistemi (§8 ile birlikte) — en kritik eksik, ödeme/paket sistemiyle bağlantılı.
2. Güvenlik doğrulaması: signed URL süresi, dosya tipi/boyut/süre limiti, sandbox testleri (canlı ortam gerektirir, bu turda yapılamadı).
3. Retry/cancel, admin maliyet paneli.
4. Watermark/şablonlar — ticari karar bekliyor (hangi pakette watermark var/yok).
5. Telif/lisans süreci — Faz 8, hukuki inceleme gerektirir.

**Bu turda kod değişikliği yapılmadı** — bu belge yalnızca fizibiliteyi ve mevcut
kapsamı belgeliyor, uygulama Faz 6'da (şartnamenin kendi faz sırasına göre, Faz 3
ticaret ve Faz 4 paneller tamamlandıktan sonra) yapılacak.
