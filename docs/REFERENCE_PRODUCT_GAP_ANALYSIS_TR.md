# Referans Ürün Boşluk Analizi (şartname §6.2)

Üç referans site canlı olarak incelendi (WebFetch ile, 2026-07-23).
Aşağıdaki özetler o sitelerin **kendi açıklamalarından** çıkarıldı —
metinleri, görselleri, animasyonları veya vaka çalışmaları kopyalanmadı,
yalnızca fikir/özellik seviyesinde değerlendirildi.

## 1. Rekt (`rekt.work`) — Influencer/creator ajansı

**Ne yapıyor:** Influencer pazarlaması + yaratıcı yönetim ajansı. "100+
yaratıcı ağı", 6 adımlı kampanya süreci (Discovery→Design→Make→
Mobilize→Measure→Maintain), AI destekli marka-influencer eşleştirme,
gerçek zamanlı ölçüm panosu, white-label modeli (medya ajansları için
arka planda kampanya yönetimi).

| Fikir | Karar | Gerekçe |
|---|---|---|
| Creator ağı (100+ yaratıcı havuzu) | MVP sonrası düşünülmeli | `docs/06_ADMIN_PANEL_SCOPE_TR.md` madde 25'te zaten "Yok, Faz 7" olarak işaretli — Kade New Media'nın önce kendi ajans hizmetlerini (mevcut CRM/teklif/paket sistemleri) sağlamlaştırması, sonra yeni bir iş modeli (creator marketplace) eklemesi daha güvenli sıralama |
| 6 adımlı kampanya akışı (Discovery→Maintain) | Kade'ye doğrudan değer katar (kavramsal olarak) | Mevcut `ProposalBuilderSection`/`kade_quotes` teklif durum makinesi (Faz 3'te güncellendi) zaten benzer bir akışın başlangıcı — creator ağı kurulursa bu akış şablonu doğrudan uyarlanabilir |
| AI destekli eşleştirme | Gereksiz/uygunsuz (şimdilik) | Eşleştirilecek gerçek bir creator havuzu olmadan bu özelliğin bir anlamı yok — önce veri, sonra algoritma |
| White-label modeli | Gereksiz/uygunsuz | Kade New Media kendi markasıyla hizmet veren bir ajans, şu an başka ajanslara arka-plan hizmeti satma stratejisi yok; bu bir iş modeli kararı, kod kararı değil |
| Gerçek zamanlı ölçüm panosu | Kade'ye doğrudan değer katar | Mevcut admin `DashboardSection`'ın genişletilmesiyle örtüşüyor, creator ağından bağımsız olarak da (mevcut CRM/kampanya verisi için) değerli |

## 2. YouMind (`youmind.com/tr-TR`) — AI yaratıcılık stüdyosu

**Ne yapıyor:** Fikir/kaynak toplamaktan üretime tek akışlı bir AI
stüdyosu. Proje çalışma alanı, kaynak birleştirme, "marka hafızası"
(kullanıcı tercih/stilini hatırlama), yeniden kullanılabilir
şablonlar ("K+ Skills"), prompt kütüphanesi, metin/görsel/slayt/video/
web çıktısını tek platformda üretme.

| Fikir | Karar | Gerekçe |
|---|---|---|
| Proje çalışma alanı (fikir/kaynak toplama) | Kade'ye doğrudan değer katar | Şartnamenin §14 "Kade Creator Studio" talebiyle doğrudan örtüşüyor — bu, Faz 5'in ana konsepti olmalı |
| Marka hafızası (kullanıcı stilini hatırlama) | MVP sonrası düşünülmeli | Değerli ama gerçek kullanım verisi/geri bildirim olmadan doğru "hafıza" modeli tasarlamak riskli — önce temel araçlar, sonra kişiselleştirme katmanı |
| Yeniden kullanılabilir şablonlar/beceriler | Kade'ye doğrudan değer katar | Mevcut kadeai'nin 35 aracıyla (docs/02 karar #2) doğrudan uyumlu bir genişleme — "kaydedilmiş prompt/şablon" özelliği kadeai'ye nispeten ucuz eklenebilir |
| Prompt kütüphanesi | Kade'ye doğrudan değer katar | Aynı gerekçe, kadeai'nin mevcut AI sağlayıcı altyapısına (`lib/ai/provider.ts`) doğal bir ek |
| Tek akışta metin+görsel+video+web üretimi | MVP sonrası düşünülmeli | Kade Studio (video) + kadeai (metin/görsel) zaten ayrı ürünler olarak var (docs/02 karar #1) — bunları TEK bir akışta birleştirmek büyük bir mimari proje, önce her biri kendi başına olgunlaşmalı |

## 3. ChatCut (`chatcut.io`) — Konuşmalı/transkript-tabanlı video kurgu

**Ne yapıyor:** Doğal dil komutuyla video düzenleme, transkript
üzerinden metin gibi düzenleme, 100+ dilde otomatik altyazı, sessizlik/
tekrar temizliği, AI motion graphics, B-roll önerisi (AI video üretimi
ile), kredi bazlı kullanım modeli (ücretsiz + $25/ay'dan başlayan
planlar).

| Fikir | Karar | Gerekçe |
|---|---|---|
| Transkript-tabanlı kurgu, altyazı, sessizlik temizliği | Kade'ye doğrudan değer katar (zaten kısmen var) | `docs/10_CHATCUT_ALTERNATIVE_FEASIBILITY_TR.md`'de doğrulandığı üzere Kade Studio'da bu özelliklerin çoğu ZATEN var (upload/transkript/sessizlik-filler tespiti/altyazı/render kuyruğu) — bu bulgu değişmedi |
| Doğal dil komutuyla düzenleme ("prompt-based editing") | MVP sonrası düşünülmeli | Kade Studio'nun mevcut kapsamında yok, büyük bir AI-video entegrasyon projesi — önce kredi/kullanım sistemi (docs/10'da eksik olarak işaretli) tamamlanmalı |
| AI motion graphics | MVP sonrası düşünülmeli | Aynı gerekçe, öncelik sırası düşük |
| B-roll önerisi (AI video üretimi) | Hukuki veya mali riskli | Üçüncü taraf AI video üretim API maliyeti + telif/kaynak belirsizliği (üretilen B-roll'un telif durumu) — dikkatli bir ayrı değerlendirme gerektirir, şimdi eklenmemeli |
| Kredi bazlı kullanım modeli | Kade'ye doğrudan değer katar | `docs/10` ve `docs/05`'te zaten "eksik, öncelikli" olarak işaretli — bu üç sitenin ortak noktası da bu modelin pazarda standart olduğunu doğruluyor |

## Genel sonuç

Üç referansın ortak teması: **kredi/kullanım bazlı erişim modeli** ve
**tek-akışlı, çoklu-format üretim** pazarda standart hale gelmiş.
Kade New Media'nın bu iki alanda net bir boşluğu var (bkz. `docs/05`
§3 UsageLimit/CreditWallet — tasarlandı, uygulanmadı) — bu, üç
referanstan da bağımsız olarak zaten bu oturumda tespit edilmiş bir
öncelikti; referans incelemesi bu önceliği DOĞRULADI, değiştirmedi.

Hiçbir referans sitenin metni, görseli veya vaka çalışması kopyalanmadı.
