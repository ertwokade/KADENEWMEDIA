# Ajans + Tool Satan İş Modeli (şartname §19)

## Gelir katmanları — mevcut mimari karşılığı

| Katman | Mevcut karşılığı | Durum |
|---|---|---|
| Ajans retainer paketleri | `kade_customer_packages` (`durationDays`, `price`, `access`) | Var — mevcut paket sistemi zaten bu model |
| Proje bazlı hizmet | `kade_quotes` (teklif talebi) + `ProposalBuilderSection` | Var, durum makinesi Faz 3'te şartnameye kısmen hizalandı |
| Tool aboneliği | kadexai'nin `entitlements`/`payment_orders` tablosu | Var (ayrı sistem, docs/02 karar #3 gereği kasıtlı olarak birleştirilmedi) |
| Kredi paketi | **Yok** | `docs/05` §3'te tasarlandı (`kade_usage_wallets`), uygulanmadı — canlı kredensiyal + hangi metriklerin gerçekten satılacağına dair ticari karar bekliyor |
| Add-on | `kade_customer_packages` çoklu-paket stacking | Var (farklı isimle, Faz 4'te doğrulandı — bkz. `docs/06`) |
| Creator campaign management fee | **Yok** | Creator ağı hiç yok (Faz 7), bu gelir katmanı da yok — birbirine bağımlı |
| Enterprise özel teklif | `kade_quotes`/`ProposalBuilderSection` üzerinden manuel | Var, kısmi — özel fiyatlandırma admin tarafından teklif formunda giriliyor, ayrı bir "enterprise" paket tipi yok |
| White-label/reseller | **Yok** | Hiçbir kod yolu bunu desteklemiyor — `docs/REFERENCE_PRODUCT_GAP_ANALYSIS_TR.md`'de Rekt'in white-label modeli "gereksiz/uygunsuz" olarak değerlendirildi (şu an stratejik öncelik değil) |
| Eğitim/danışmanlık | `consultingArea`/`consultingPlan`/`hasConsultingPanelAccess` alanları | Var — `PACKAGE_DEFINITIONS`'da zaten "Dijital Strateji Danışmanlığı" gibi paketler tanımlı |
| Şablon/dijital ürün | **Yok** | Gerçekten sunulacaksa (şartnamenin kendi şartı: "gerçekten sunulacaksa") — şu an böyle bir ürün/hizmet yok, uydurulmadı |

**Sonuç: 10 katmandan 6'sı zaten bir ölçüde destekleniyor, 4'ü
(kredi paketi, creator campaign fee, white-label, şablon/dijital ürün)
gerçek bir iş kararı/talep olmadan kod yazılmadı** — şartnamenin kendi
"ticari olarak anlamsız kombinasyon açma" ve anti-fabrikasyon kuralına
uygun.

## Paket ailesi

Mevcut `PACKAGE_DEFINITIONS` (`server/api/_lib/packages.js`) örnek
isimlerle (Başlangıç/Büyüme/Pro vb.) BİREBİR eşleşmiyor — gerçek paket
adları Kade New Media'nın kendi konumlandırmasına göre (örn. "Sosyal
Medya Başlangıç Paketi", "Sosyal Medya Büyüme Paketi") zaten
tanımlanmış ve admin panelden **isim/fiyat/not alanları düzenlenebilir**
(önceki oturumda gerçek admin-editable hale getirildi, commit `9c2a6aa`).
Şartnamenin "isimleri admin değiştirilebilir yap" şartı bu ölçüde
karşılanıyor — tam paket YAPISI (özellik listesi, süre, erişim JSON'u)
şu an admin panelden değil, koddan yönetiliyor (`PACKAGE_DEFINITIONS`
sabit obje). Bunu tam admin-yönetilebilir yapmak `docs/06` madde 8
("Ürünler ve araçlar — Kısmen") ile aynı gerçek boşluk.

"Creator"/"Agency"/"Enterprise" özel paket kategorileri şu an ayrı bir
paket tipi olarak yok — Enterprise ihtiyacı şu an manuel teklif akışıyla
(`kade_quotes`) karşılanıyor, bu şartnamenin izin verdiği bir durum
("her ailede haftalık/aylık/yıllık zorunlu olmak zorunda değil").

## Satış prensipleri — mevcut durum denetimi

| Prensip | Durum | Kanıt |
|---|---|---|
| Hizmet bedeli / üçüncü taraf maliyeti ayrımı | Kısmen | `Packages.jsx`'te "Bu tutar reklam harcamasını içermez, reklam bütçesi platformlara ayrıca ödenir" notu var — ayrım metinde açık ama veri modelinde ayrı alan olarak tutulmuyor |
| Paket kapsamı belirsiz değil | Var | Her paket `features[]` dizisiyle net listeleniyor |
| Limit aşımı davranışı açık | **Yok** | Sayısal kullanım limiti sistemi (kredi paketi ile aynı boşluk) olmadığı için "aşım" kavramı henüz tanımlı değil |
| Otomatik yenileme görünür | Belirsiz | `kade_subscriptions` var ama otomatik yenileme UI/bildirim akışı bu oturumda doğrulanmadı |
| İptal akışı saklı değil | **Kısmen sorunlu** | Müşteri panelinde kendi kendine iptal akışı bulunamadı — yalnızca admin taraflı paket durumu değiştirme var (bkz. `docs/08` — Cayma/İptal politikası sayfası da yok, aynı boşluğun iki yüzü) |
| Özel teklif ↔ public paket tutarlı entitlement | Var | İkisi de aynı `access` JSON modelini ve `buildEntitlementsFromPackages()`'ı kullanıyor |
| Dark pattern yok | Var (düzeltildi) | `docs/LEGACY_PAGE_GAP_ANALYSIS_TR.md`'de bulunan sahte kıtlık banner'ı ("Bu ay yalnızca 3 müşteri yerimiz kaldı") mevcut sürüme taşınmadı — bilinçli karar |

## En kritik iki boşluk (öncelik sırası)

1. **İptal akışı + Cayma/İptal politikası sayfası** — hem UX hem hukuki (blocker #17 ile aynı kök).
2. **Kredi paketi / kullanım limiti sistemi** — 4 gelir katmanından biri bu olmadan hiç açılamıyor, ayrıca `docs/REFERENCE_PRODUCT_GAP_ANALYSIS_TR.md`'deki 3 referans sitenin ortak noktası da bu — pazar bunu bekliyor.

Her ikisi de gerçek ticari/hukuki karar gerektiriyor, kod tek başına
çözemez — bu yüzden bu turda uygulanmadı, yalnızca netleştirildi.
