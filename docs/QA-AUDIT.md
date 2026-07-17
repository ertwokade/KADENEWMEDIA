# KADE AI — Full-stack ve QA denetimi

Son doğrulama: 16 Temmuz 2026  
Üretim yolu: `https://kadenewmedia.com/kadeai`

## Ürün kapsamı

Tek doğruluk kaynağı `lib/tools/registry.ts` dosyasıdır. Kullanıcı kütüphanesinde beş ana kategori ve 38 aktif araç bulunur. Dublaj & Çeviri yalnızca “Yakında” durumundadır. Satış Merkezi `owner` yetkisine bağlıdır. Video editör, script yazarı, podcast scripti, blog, newsletter, sponsor scripti, çekiliş metni, altyazı üretici, storyboard, B-roll, story dizisi, strateji ve büyüme araçları aktif kayıt, menü veya sayfa olarak sunulmaz.

| Alan | Durum | Kalıcı veri / dış servis |
|---|---|---|
| Genel Bakış | Aktif | Araç registry’si |
| Operasyon | Aktif | Supabase `operations_state`; çevrimdışı yerel yedek |
| Üretim (9) | Aktif | Sunucu AI yönlendiricisi + `tool_runs` |
| Medya | Thumbnail ve Klip aktif; Dublaj yakında | OpenAI/Gemini image, FFmpeg/Whisper |
| Analiz (13) | Aktif | Doğrulanmış AI çıktısı + `tool_runs` |
| Planlama (6) | Aktif | Supabase takvim, şablon ve geçmiş; yerel yedek |
| Satış Merkezi | Yalnız sahip | Shopier yapılandırması |
| Ayarlar | Aktif | Profil, marka, tercihler, sağlayıcı sağlık durumu |

## Giderilen kritik sorunlar

- `/kadeai` base path; istemci istekleri, statik dosyalar, iframe, manifest, service worker, auth callback ve parola sıfırlama boyunca korundu.
- Operasyon Merkezi’ndeki sonsuz iskelet/yüklenme yarışı kaldırıldı; hata ve yeniden dene durumları eklendi.
- Kategori menüleri merkezi registry’den üretiliyor; arama, aç/kapat, aktif route ve “Yakında” durumu çalışıyor.
- Önceden dekoratif veya sahte olan analiz fallbacks kaldırıldı. Şema dışı AI cevabı başarı gibi gösterilmiyor.
- Başarılı ve hatalı araç çalıştırmaları kullanıcıya ait geçmişte tutuluyor; arama, filtre, detay, silme ve yeniden çalıştırma destekleniyor.
- Profil, çalışma alanı, marka ve tercihler bütün üretim isteklerine veri bağlamı olarak ekleniyor.
- Otomatik model görevin türü, uzunluğu, istenen çıktı ve kullanılabilir sağlayıcılara göre seçiliyor. Tercih kapatılırsa son manuel seçim korunuyor.
- Yerel cache, bulut yanıtı gelmeden başka kullanıcıya gösterilmiyor; çıkışta kullanıcıya özel cache temizleniyor.
- Görsel üretim varsayılanı GPT Image 2 oldu; yalnızca desteklenen boyutlar gönderiliyor. Gizli ücretsiz görsel servisi fallback’i kaldırıldı.
- Video/ses yüklemesinde boyut ve MIME doğrulaması, oranlı progress/hata durumu ve kullanıcı doğrulaması uygulanıyor.

## Veri modeli ve güvenlik

Migration: `supabase/migrations/202607160001_kadeai_profiles_and_runs.sql`

Tablolar: `profiles`, `workspaces`, `workspace_members`, `brands`, `user_preferences`, `integrations`, `tool_runs`, `content_calendar`, `content_templates`. Kullanıcı oluşturulduğunda kişisel workspace ve tercihler trigger ile hazırlanır. Tüm kullanıcı verisi RLS ile `auth.uid()` ve workspace üyeliğine bağlıdır. API’ler ayrıca kullanıcı ID’siyle filtreler ve profil/marka güncellemesinde workspace üyeliğini doğrular.

Üretimde dashboard, onboarding, operations-kit, owner alanı ve health dışındaki bütün API’ler oturum gerektirir. Değişiklik yapan isteklerde Origin denetimi vardır. Sahip alanı `KADE_OWNER_EMAIL` ile sınırlandırılır. API cevapları ve kişisel sayfalar public cache’e girmez; dashboard `noindex` olur. Yükleme uçları MIME ve 25 MB sınırı uygular.

## Model yönlendirme

`auto`, aracın adıyla sabit bir model seçmez. İstek sırasında görev sınıfını, metin uzunluğunu, JSON/yapılandırılmış çıktı ihtiyacını, analiz/kod niteliğini ve sunucuda gerçekten yapılandırılmış sağlayıcıları değerlendirir. Elle model seçimi hâlâ mümkündür. Sunucu, istenen sağlayıcı yoksa sessiz sahte sonuç üretmek yerine uygun yapılandırılmış sağlayıcıya yönlendirir veya açık hata döndürür.

## Production doğrulama matrisi

Otomatik test dosyası: `tests/e2e/basepath.spec.ts`

- `/kadeai` ve `/kadeai/` açılışı
- `/kadeai/login`, parola sıfırlama ve manifest
- Korumalı derin route’un base path’i iki kez eklemeden login’e dönmesi
- Operations iframe route’unun oturum koruması
- `/kadeai` dışındaki route’un uygulama tarafından sahiplenilmemesi
- Health cevabında secret bulunmaması
- Profil, geçmiş, takvim ve şablon API’lerinin anonim erişimi reddetmesi
- Cross-site değişiklik isteğinin 403 alması
- Masaüstü ve mobil Chromium projeleri

Build kabul kapısı: `npm run verify && npm run test:e2e && npm audit`.

## Bilinen dış bağımlılıklar

Kod ve migration hazırdır; ancak uzak Supabase projesine migration repository’den otomatik uygulanmaz. Deployment öncesi SQL Editor’da migration çalıştırılmalı, production environment değerleri girilmeli ve Supabase Auth redirect allow-list’e `https://kadenewmedia.com/kadeai/auth/callback` ile `https://kadenewmedia.com/kadeai/reset-password` eklenmelidir. AI ve Shopier anahtarları olmadan ilgili özellikler açık “yapılandırılmadı” durumu gösterir; sahte başarı üretmez.

Nginx snippet’i `deploy/nginx-kadeai.conf`, çalıştırılabilir kurulum ve rollback adımları `deploy/README.md` içindedir. Snippet yalnızca `/kadeai` konumunu proxy eder ve ana sitenin diğer route’larına dokunmaz.
