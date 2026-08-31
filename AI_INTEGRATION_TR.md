# AI_INTEGRATION_TR.md

Tarih: 22 Temmuz 2026

## Tespit edilen durum: İKİ ayrı Gemini entegrasyonu var

### 1. Legacy site — `server/api/chat.js`

- Model: `gemini-2.5-flash`, doğrudan REST çağrısı (`generativelanguage.googleapis.com`).
- `GEMINI_API_KEY` yalnızca sunucuda (`process.env`), client bundle'a sızmıyor (kontrol edildi: `NEXT_PUBLIC_`/`VITE_` öneki yok, `src/` içinde referans bulunamadı).
- Admin modu (`adminMode: true`) yalnızca `getAuthorizedUser(req)` gerçek bir admin/editor session'ı doğrularsa aktif oluyor — client'ın "ben adminim" demesi yeterli değil.
- Public (ziyaretçi) kullanım: rate limit (20 istek/pencere), mesaj uzunluğu sınırı (1000 karakter, admin'de 4000), sistem promptu kullanıcı girdisinden ayrı tutuluyor (`KADE_CONTEXT_TR`/`EN` sabit metin + `promptText` birleştirmesi — klasik prompt-injection'a karşı tam izolasyon değil ama kullanıcı mesajı ayrı bir "Kullanıcı mesajı:" etiketiyle veriliyor).
- Sistem promptu **açıkça** "fiyat, süre, müşteri, başarı metriği uydurma" talimatı içeriyor — halüsinasyon riskini azaltan iyi bir tasarım kararı.
- Hata durumunda public kullanıcıya sadece `{ reply: null, fallback: true }` dönüyor — stack trace/hata detayı sızmıyor; admin modda daha açıklayıcı hata gösteriliyor (kabul edilebilir, çünkü admin zaten yetkili).
- **Model adı kodda sabit** (`gemini-2.5-flash`, hard-coded) — merkezi config/env üzerinden yönetilmiyor. Kullanıcı talimatı bunu açıkça istemişti.

### 2. `apps/kadexai` — `lib/ai/provider.ts` (çoklu sağlayıcı: Gemini, Groq, Mistral, Anthropic, OpenAI)

- Gemini için **eski SDK** kullanılıyor: `@google/generative-ai@0.24.1`. Kullanıcı talimatı güncel `@google/genai` paketinin değerlendirilmesini istemişti — bu oturumda **değiştirilmedi** (canlı API testi olmadan SDK göçü riskli; ayrı, test edilebilir bir oturumda yapılmalı).
- Model seçimi `lib/ai/models.ts` + `lib/ai/modelRouter.ts` üzerinden merkezi (`modelConfig.geminiModel || 'gemini-2.5-flash'`) — legacy'nin aksine burada gerçek bir merkezi config var.
- `GEMINI_API_KEY` yalnızca sunucuda; `/api/env-status` ve `AIHealthPanel.tsx` yalnızca **anahtarın var olup olmadığını** (boolean) gösteriyor, değerini değil — doğru.
- `proxy.ts` içinde AI uçları için kullanıcı bazlı dağıtık kota (`distributedRateLimit`: dakikalık 30, günlük 500, `idempotencyKey` desteği, backend yoksa production'da fail-closed) ve istek gövdesi boyut sınırı (64KB, transcribe için 26MB) uygulanıyor.
- Test kapsamı: "distributed AI quota enforces cost, daily limit and idempotency locally" ve "distributed quota fails closed in production without a backend" testleri geçiyor.

## Yapısal çıktı (structured output)

Bu oturumda incelenen AI uçlarının çoğu (`/api/generate/*`) serbest metin üretiyor (başlık, hashtag, açıklama gibi görevler için bu doğaldır). Kullanıcı talimatının istediği **lead sınıflandırma / paket önerisi gibi karar-destek özellikleri için Zod ile doğrulanan JSON Schema çıktısı bu oturumda bulunamadı** — böyle bir özellik henüz yok. Bu, kullanıcı talimatındaki 10 önerilen AI özelliğinden biri ("Lead'i ihtiyaç türüne göre sınıflandırma", "Müşteriye uygun paket önerisi") olarak **yapılmamış** durumda; mevcut altyapı (Zod zaten bağımlılık olarak kurulu, `zod@^4`) buna uygun ama özellik inşa edilmedi.

## Prompt injection / güvenlik

- Sistem promptu ile kullanıcı girdisi ayrı değişkenlerde tutuluyor, ama nihai istek tek bir string olarak birleştirilip modele gönderiliyor (klasik metin-tabanlı LLM API'lerinin doğası gereği tam izolasyon yok — bu Gemini/OpenAI-uyumlu REST API'lerin genel sınırlaması, Kade'ye özgü bir eksiklik değil).
- Function calling / tool-calling **kullanılmıyor** (bu oturumda incelenen uçlarda) — yani "yalnızca allowlist'teki fonksiyonlara izin ver" riski şu an için oluşmuyor çünkü model doğrudan bir işlem tetiklemiyor, yalnızca metin üretiyor ve admin bunu görüp kullanıyor.
- AI çıktısı doğrudan HTML olarak render ediliyorsa (`dangerouslySetInnerHTML`) risk oluşurdu — bu oturumdaki genel taramada **hiçbir yerde `dangerouslySetInnerHTML` bulunamadı**, yani AI çıktısı güvenli şekilde React metin/JSX olarak render ediliyor.

## Bu oturumda YAPILMAYAN (net biçimde işaretlenen) AI çalışmaları

Kullanıcı talimatının 9. aşaması 10 potansiyel yeni AI özelliği öneriyordu (sosyal medya taslağı, metni doğallaştırma, hizmet/paket açıklaması taslağı, blog taslağı, SEO title/meta önerisi, lead özetleme, lead sınıflandırma, paket önerisi, içerik takvimi, tekrar/yapay ifade tespiti). `apps/kadexai`'de zaten **30'dan fazla benzer AI aracı mevcut** (başlık, hashtag, içerik planı, YouTube SEO, rakip analizi, yorum analizi vb. — bkz. `ROUTE_MATRIX.md`). Bu oturumda **yeni bir AI özelliği eklenmedi**; mevcutların güvenlik/mimari denetimi yapıldı. Yapısal (Zod doğrulamalı) lead-sınıflandırma/paket-önerisi özelliği açık bir boşluk olarak kalıyor.

## Öneriler

1. `server/api/chat.js`'deki sabit `gemini-2.5-flash` model adını `apps/kadexai/lib/ai/models.ts`'deki gibi merkezi bir config/env değişkenine taşı.
2. `@google/generative-ai` → `@google/genai` göçünü ayrı, test edilebilir bir değişiklik olarak planla (canlı API çağrısı gerektirir, bu ortamda güvenle doğrulanamaz).
3. Lead sınıflandırma / paket önerisi gibi karar-destek özellikleri eklenecekse Zod schema + server-side doğrulama ile (model çıktısındaki paket ID'sini asla doğrudan DB işlemine sokmadan, aktif paket listesiyle karşılaştırarak) inşa edilmeli — kullanıcı talimatı bunu açıkça istiyor ve mevcut mimari (Zod zaten var) buna hazır.
