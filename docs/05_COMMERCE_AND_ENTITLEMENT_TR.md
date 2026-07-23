# 05 — Ticari Veri Modeli ve Yetkilendirme Mimarisi (Faz 2/3)

## 1. Mevcut durumun özeti (docs/01'den)

İki bağımsız ticari/ödeme sistemi var:

- **Kök (`kademedia`):** `kade_customers` + `kade_customer_packages` (Supabase,
  bu oturumda MongoDB'den taşındı) + `kade_shopier_orders`. Paket = düz bir satır
  (`reference, name, features[], access{jsonb}, status, expires_at`). Entitlement
  kontrolü `buildEntitlementsFromPackages()` ile `access` JSON alanından
  türetiliyor.
- **`apps/kadeai`:** `payment_orders`, `entitlements` tablosu (`tier, period,
  api_included, features[], status, expires_at`), `kadeai_pricing_overrides`.
  Supabase Auth (`auth.users`) ile ilişkili.

**Karar (bu turda verildi): Bu iki sistemi TEK bir şemada zorla birleştirmeyeceğiz.**
Gerekçe: şartname §1.2 "mevcut mimariyi anlamadan değiştirme" ve "gereksiz
mikroservis/karmaşa ekleme" kurallarına uyarak — iki sistem zaten çalışıyor, farklı
auth modelleri kullanıyor (kök: özel JWT; kadeai: Supabase Auth), zorla birleştirme
hem veri kaybı riski hem de büyük bir auth-migration projesi doğurur ki bu şartnamenin
"veri kaybına yol açabilecek migration üretme" yasağıyla çelişir. Bunun yerine
**her ikisi de aynı KAVRAMSAL modele (aşağıda) uyacak şekilde ayrı ayrı
genişletilecek.**

## 2. Hedef kavramsal model (şartname §8.1, iki sisteme de uygulanabilir hale getirildi)

Şartnamedeki 27 varlık, mevcut iki sistemin üzerine şu şekilde eşleniyor
(yeni tablo gerektirenler işaretli):

| Şartname varlığı | Kök karşılığı | kadeai karşılığı | Aksiyon |
|---|---|---|---|
| Plan/Price | `kade_customer_packages.reference/price` (statik referans) | `kadeai_pricing_overrides` | Var, yeterli |
| Feature/FeatureValue | `kade_customer_packages.access` (JSONB) | `entitlements.features[]` | Var (JSON/array modeli), şema-zorlamalı tabloya çevirme **önerilmez** — JSON esnekliği paket çeşitliliği için avantaj |
| UsageLimit/CreditWallet | **Yok** | **Yok** | Yeni tablo gerekiyor — bkz. §3 |
| CustomOffer/OfferLine | **Yok** (yalnızca statik teklif formu var) | `payments/admin/custom-offer` route'u var ama kalıcı durum makinesi yok | Yeni — bkz. §4 |
| QuoteRequest | `kade_quotes` | — | Var |
| Order/OrderLine | `kade_shopier_orders` | `payment_orders` | Var |
| Payment/Refund | Shopier webhook state machine | Shopier webhook state machine | Var (refund state'i her ikisinde de yok — bkz. bulgular) |
| Subscription/SubscriptionChange | `kade_subscriptions` (ajans aboneliği, farklı bağlam) | **Yok** (kadeai paketleri tek-dönemli görünüyor) | Kısmi |
| Entitlement | `access` JSON | `entitlements` tablosu | Var, iki farklı şekilde |
| APIAccessPolicy / UserApiCredential (BYOK) | **Yok** | **Yok** | Yeni — bkz. §5, blocker |
| AuditLog | `kade_activity_log` | **Doğrulanmadı** | Kısmi — bkz. §6 |
| LegalDocumentVersion/LegalAcceptance | **Yok** | **Yok** | Yeni — bkz. docs/08 (Faz 8) |

## 3. UsageLimit/CreditWallet — yeni tablo gerekiyor (uygulanmadı, tasarım)

Şartname §8.3 kredi/kullanım limitleri istiyor (aylık içerik limiti, video dakika
limiti vb.). Mevcut sistemde bu **hiç yok** — paketler yalnızca "hangi özelliğe
erişim var" (boolean `access`) tutuyor, "ne kadar kullanabilir" (sayısal limit +
tüketim sayacı) tutmuyor.

Önerilen şema (uygulanmadı, ileride bir migration'da eklenecek):

```sql
CREATE TABLE kade_usage_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES kade_customers(id),
  package_id UUID REFERENCES kade_customer_packages(id),
  metric TEXT NOT NULL,        -- 'monthly_content', 'video_minutes', 'ai_credits' vb.
  limit_value NUMERIC,          -- NULL = sınırsız
  used_value NUMERIC NOT NULL DEFAULT 0,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Bu turda UYGULANMADI** çünkü: (a) canlı Supabase kredensiyali yok (bkz.
BLOCKERS #1), migration'ı test edecek ortam yok; (b) hangi metriklerin gerçekten
takip edileceği ticari bir karar (§8.3'teki 19 metrikten hangileri Kade New
Media'nın gerçek paket yapısında kullanılacak) — bu turda varsayımla dolu bir şema
yazmak yerine tasarımı belgeleyip blocker olarak bırakmak tercih edildi.

## 4. Özel teklif durum makinesi (§8.5) — kısmen tasarlandı

Kökte `kade_quotes` var ama şartnamenin istediği tam durum makinesi
(`draft→requested→reviewing→offered→revised→accepted→payment_pending→paid→
provisioning→active`, artı `expired/rejected/cancelled/payment_failed/
provisioning_failed/past_due/suspended/refunded/partially_refunded/completed`)
yok — `kade_quotes.status` şu an basit bir metin alanı (`yeni`, `gorusme-bekliyor`
vb.), şartnamenin 19 durumluk makinesiyle **örtüşmüyor**.

**Karar:** Mevcut basit durum modelini kırmadan, üzerine şartnamenin durum
makinesini **eşleyen** bir `CHECK` constraint + admin UI güncellemesi Faz 3'te
yapılacak (bu turda kapsam dışı — canlı veri olmadan migration riskli).

`apps/kadeai`'de `payments/admin/custom-offer` route'u zaten var (önceki
oturumlarda eklenmiş, PR #3) — bu, kadeai tarafında kısmi bir başlangıç.

## 5. BYOK / API anahtarı modeli (§8.4) — gerçek boşluk, blocker

Ne kökte ne kadeai'de kullanıcının kendi API anahtarını (BYOK) şifreli saklayıp
kullanabileceği bir mekanizma bulunamadı. `apps/kadeai`'nin AI sağlayıcı anahtarları
(Gemini/Claude/GPT4o/Groq/Mistral) hepsi **sunucu tarafı, tek bir merkezi env
değişkeni** — kullanıcı bazlı BYOK yok.

**Bu gerçek bir özellik boşluğu, blocker olarak kaydedildi** (şifreleme anahtarı
yönetimi, per-user credential storage, güvenli test endpoint'i gerektirir —
canlı ortam kredensiyali olmadan güvenli şekilde inşa edilip test edilemez).

## 6. Audit log — kısmen var, genişletilmeli

`kade_activity_log` (kök) zaten var ve bu oturumda MongoDB'den Supabase'e taşındı,
şu an `action, detail, type, icon, user, created_at` tutuyor. Şartname §8.7/§22
"actor, action, target, before/after özeti, timestamp, request correlation"
istiyor — mevcut şema **before/after ve target ID'yi ayrı alan olarak tutmuyor**
(`detail` serbest metin içine gömülü). Fonksiyonel olarak çalışıyor ama yapısal
olarak şartnamenin istediği kadar sorgulanabilir değil.

**Öneri (uygulanmadı):** `target_type`, `target_id`, `before` (jsonb),
`after` (jsonb) kolonları eklenmesi — küçük, geri alınabilir bir migration,
canlı veri olmadan test edilemediği için bu turda uygulanmadı, blocker olarak
not edildi.

## 7. Backend zorunluluğu — zaten sağlanıyor

Şartname §8.7 "yetkilendirmeyi hem frontend hem backend seviyesinde uygula, backend
zorunlu" diyor. Bu oturumun MongoDB→Supabase taşımasında doğrulandığı üzere kökte
`requirePermission`/`requireAdmin` her admin route'unda server-side çalışıyor;
`apps/kadeai`'de RLS (Row Level Security) + route-seviyeli kontrol var (23 testin
bir kısmı IDOR/tenant-izolasyon senaryolarını kapsıyor, bkz. docs/01). **Bu madde
zaten karşılanıyor, ek iş gerekmiyor.**

## 8. Özet — Faz 3 için öncelik sırası

1. Shopier webhook refund/chargeback durumlarının her iki sistemde de ele alınıp alınmadığı doğrulanmalı (bu turda kapsam dışı kaldı).
2. `kade_quotes` durum makinesi şartnameye hizalanmalı (canlı ortamda).
3. UsageLimit/CreditWallet şeması — hangi metriklerin gerçek iş ihtiyacı olduğu netleşince uygulanmalı.
4. BYOK — ayrı bir güvenlik-kritik alt proje olarak ele alınmalı, aceleye getirilmemeli.
5. Audit log şema genişletmesi — düşük risk, canlı ortamda kolayca yapılabilir.

Hiçbiri bu turda canlı Supabase'e karşı uygulanmadı (blocker #1, #12).
