# Eski (26 Haziran) Sürüm — Güncel Sistemle Karşılaştırma

Tarih: 23 Temmuz 2026.

## Eski sürümün konumu ve nasıl bulunduğu

Kullanıcının belirttiği "26 Haziran" tarihli dosya, proje kökünün **dışında**,
komşu bir klasörde bulundu: `../kademedia_backup_20260717_104653` — 17 Temmuz'da
alınmış bir yedek klasörü, ama kendi içinde **18 Mart 2026'dan 17 Temmuz 2026'ya
kadar 257 commit'lik tam bir git geçmişi** barındırıyor. Bu geçmişte 26 Haziran
2026 tarihine ait tek commit bulundu:

```
960370f  2026-06-26  remove: exit intent popup kaldırıldı
```

(Bir sonraki gerçek commit 7 Mayıs'tan sonra 7 haftalık bir aradan sonra geliyor —
26 Haziran, bu aradan hemen sonraki ilk aktif geliştirme günü.)

**Doğrulama yöntemi:** Üç farklı arama denendi: (1) proje kökü ve Desktop altında
`*yedek*`/`*backup*` deseniyle klasör taraması, (2) bulunan yedek klasörün kendi git
`log --all` geçmişinde tarih araması, (3) tarihe en yakın commit'in mesaj/diff
içeriğiyle "KadeMedia" kimliğinin doğrulanması. Silinmedi, değiştirilmedi.

## İzolasyon

Orijinal yedek klasörüne dokunulmadan, `git worktree add` ile ayrı bir klasöre
(`../kademedia-26-haziran`) **detached HEAD** olarak çıkarıldı, `npm install` ile
bağımlılıkları kuruldu, `npm run dev` ile yalnızca frontend (Vite) çalıştırıldı ve
altı kritik public sayfa ekran görüntüsüyle incelendi: `/`, `/hakkimizda`,
`/hizmetler`, `/paketler`, `/iletisim`, `/blog`. (Backend/API o worktree'de
çalıştırılmadı — API proxy hataları bekleniyor ve zararsız, sadece statik
sayfa/tasarım karşılaştırması amaçlanmıştı.)

## Bulgular

### 1. Header/navigasyon — güncel sistemde eksik olabilecek öğeler

Eski sürümün header'ında şunlar var, güncel `src/App.jsx`/`Navbar` içinde
**doğrulanmadı, ayrıca kontrol edilmeli**:

- Header içinde **TR/EN dil değiştirici** (mevcut sistemde `useLanguage` context'i var ama header'da görünür bir switcher olup olmadığı bu turda ayrıca doğrulanmadı)
- **"Kaynaklar" açılır menüsü** — güncel route listesinde (`docs/03_ROUTE_INVENTORY_TR.md`) böyle bir üst menü grubu yok
- Sağ altta sabit **WhatsApp hızlı iletişim butonu**
- Arama ikonu (header'da)

### 2. `/paketler` — restore edilmemesi gereken bir dark pattern bulundu

Eski sayfada şu banner görüldü: **"Bu ay yalnızca 3 müşteri yerimiz kaldı — Şimdi
yerinizi ayırtın"**. Bu, doğrulanabilir bir kapasite verisine dayanmıyorsa klasik bir
**sahte kıtlık/aciliyet dark pattern'idir** ve şartnamenin hem §7 ("doğrulanmamış ...
sonuç uydurma") hem §19 ("kullanıcıyı istemediği üst pakete manipülatif dark pattern
ile itme") hem de Kesin Yasaklar (§35) maddeleriyle doğrudan çelişir.

**Karar: Bu banner güncel sisteme taşınmamalı**, gerçek ve o anda doğrulanabilir bir
kapasite kısıtı yoksa. Blocker olarak kaydedildi (bkz. `docs/BLOCKERS_TR.md`).

Buna karşılık eski sayfadaki paket adları ve açıklamaları güncel statik
`src/data/packages.js`'ten **daha zengin**: "Start-Up" (Strateji ve dikey video
önce), "Büyüme" (Tam yönetim + reklam + 12 Reels), "Premium" (Tam prodüksiyon +
influencer marketing) gibi somut, ölçülebilir vaatler içeriyor. Güncel 3-kapsamlı
("Başlangıç/Büyüme/Özel Kapsam") metin daha soyut. **Bu içerik yapısı Faz 2 içerik
çalışmasında referans alınabilir — ancak rakam/vaat içeren kısımlar güncel, onaylı
verilerle yeniden doğrulanmadan kopyalanmamalı.**

### 3. `/hakkimizda` — doğrulanmamış istatistik bulundu

Eski sayfada: *"Kurulduğumuz günden bu yana **yüzlerce markaya** dijital dünyada
büyümeleri için yol gösterdik"* ve sayısal rozetler (**3+ / 4+ / 20+**, muhtemelen
yıl/ekip/müşteri sayısı). Bu rakamların kaynağı/doğrulaması bu turda tespit
edilemedi. Şartname §7 ve §35 gereği **doğrulanmadan güncel sisteme taşınmamalı** —
blocker olarak kaydedildi.

### 4. Metin içeriği — büyük ölçüde ZATEN güncel sisteme taşınmış

Beklenmedik ve olumlu bir bulgu: eski sayfalardaki birçok cümle, güncel
`src/i18n/translations.js` dosyasındaki metinlerle **birebir veya çok yakın
eşleşiyor** — örneğin `/hizmetler` sayfasının eski başlığı *"Dijital Başarınız İçin
Her Şey Burada"* ve alt metni *"Sosyal medya yönetiminden reklam kampanyalarına,
içerik üretiminden video prodüksiyona kadar tüm dijital ihtiyaçlarınızı
karşılıyoruz"*, güncel `translations.js`'teki `services.subtitle` ile aynı. Yani
**metin içeriği anlamında büyük bir kayıp yok** — eski sayfa metinleri zaten güncel
mimariye (farklı bir render yoluyla, i18n context üzerinden) taşınmış durumda. (Not:
bu oturumun daha önceki bir turunda `services.title`/`titleHighlight` gibi bazı
klişe ifadeler zaten "insansılaştırma" geçişinden geçirildi — bkz. konuşma geçmişi.)

**Sonuç: Kayıp olan şey metin değil, görsel tasarım dili ve birkaç header/etkileşim
bileşeni** (yukarıdaki madde 1).

### 5. Tasarım dili farkı — kasıtlı, geri dönülmemeli

Eski sürüm koyu/altın parçacık temalı, "KADE" (şimşek ikonlu) marka kimliğini
kullanıyor. Güncel anasayfa (`src/pages/Home.jsx`) tamamen farklı, daha minimal
bir tasarım dili kullanıyor. *(29 Tem 2026: bu paragraf önceden `public/site.html`
snapshot'ına atıfta bulunuyordu; snapshot kaldırıldı, ana sayfa React kaynağında
yeniden yazıldı.)* Şartname §6 açıkça **"eski tasarımı körlemesine geri getirme; güncel
kadenewmedia.com ana sayfa tasarım diliyle yeniden uygula"** diyor — yani bu fark
**beklenen ve doğru bir mimari karardır**, eksiklik değil.

## Taşınması değerlendirilecek, taşınmaması gereken

| Öğe | Karar | Gerekçe |
|---|---|---|
| "Kaynaklar" nav menüsü, WhatsApp butonu, header dil switcher | Doğrulanmalı/değerlendirilmeli | Güncel sistemde karşılığı net değil, Faz 2 tasarım sistemi çalışmasında ele alınmalı |
| Zengin paket açıklamaları (Start-Up/Büyüme/Premium taglines) | İçerik YAPISI referans alınabilir | Somut vaat/rakam güncel veriyle yeniden doğrulanmadan kopyalanmamalı |
| "Sadece 3 müşteri yeri kaldı" aciliyet banner'ı | **Taşınmayacak** | Doğrulanamayan sahte kıtlık — şartname yasaklıyor |
| "Yüzlerce marka" / 3+,4+,20+ istatistikleri | **Taşınmayacak** (doğrulanmadan) | Kaynağı belirsiz, şartname §7/§35 yasaklıyor |
| Genel marketing metni (hizmet açıklamaları vb.) | Zaten taşınmış | `translations.js` ile örtüşüyor, ek işlem gerekmiyor |
| Koyu/altın "KADE" tasarım dili | Taşınmayacak (kasıtlı) | Şartname güncel tasarım dilini esas alıyor |

## Kapsam notu

Bu tur yalnızca 6 public sayfayı kapsadı (ana sayfa, hakkımızda, hizmetler,
paketler, iletişim, blog). Eski sürümdeki admin paneli, API'ler ve diğer alt
sayfalar (partnerler detay, blog detay, kariyer vb.) bu turda incelenmedi —
gerekirse Faz 2'de genişletilebilir. Worktree (`../kademedia-26-haziran`) ve
`../kademedia-7-mayis` (7 Mayıs karşılaştırması için daha önce açılmıştı) hâlâ
diskte duruyor, silinmedi.
