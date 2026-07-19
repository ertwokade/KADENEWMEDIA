# E2E Test Matrix

| Alan | Rol | Beklenen | Sonuç | Not |
|---|---|---|---|---|
| Public root routes | Anonymous | 200/308/404 kontratı, title/H1/canonical | PASS (41 root public/missing/redirect örneklemi içinde) | Raw HTML/passive HTTP |
| KadeAI public/auth shell | Anonymous | 200/307, noindex | PASS (3 runtime sonucu) | Görsel render yok |
| Root admin | Anonymous | Login/401, no-store | BLOCKED | Browser fixture yok |
| Root admin | Admin/editor/viewer | Role/permission matrisi | BLOCKED | Staging DB hesabı yok |
| Customer portal | Customer A/B | Tenant izolasyonu | BLOCKED | Seed/credential yok |
| KadeAI dashboard/settings | User/owner | Settings yalnız owner | CODE PASS / E2E BLOCKED | Unit test var; browser yok |
| KadeAI profile/history/template | User A/B | Başka kullanıcı satırı yok | CODE PASS / RLS BLOCKED | Ownership unit var; staging RLS yok |
| Shopier webhook | Signed fixture | Tek reservation/entitlement | PASS | Unit/mock; gerçek ödeme yok |
| AI generation | Auth user | Distributed cost/quota/idempotency | PASS / LIVE BLOCKED | Unit; Upstash credential yok |
| FastAPI | Anonymous/token | Fail-closed, schema, limits, timeout | PASS | 5/5 pytest |

Çalıştırılamayan browser matrisi: Chromium tüm public route'lar ve 10 viewport; Firefox/WebKit ana sayfa, hizmetler, paketler, blog, iletişim, teklif, giriş, admin, müşteri, KadeAI auth/dashboard/payment/upload/generation. Bağlı browser olmadığından test binary kurulumu ile farklı bir kontrol yüzeyine geçilmedi.
