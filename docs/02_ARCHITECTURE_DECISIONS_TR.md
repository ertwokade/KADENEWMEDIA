# 02 — Mimari Kararlar (Faz 2)

Bu belge, kullanıcının "sen karar ver, sormadan bitir" talimatı üzerine bu oturumda
verilen bağlayıcı mimari kararları kayıt altına alır. Her karar, kod incelemesine
dayanıyor (spekülasyon değil) — kanıt olarak dosya yolları verildi.

---

## KARAR 1 — Video editör (şartname §17) temeli: Kade Studio

**Soru:** `apps/studio-web`/`apps/studio-worker` (Kade Studio), `apps/kadexai`'nin
video sayfaları (video-factory/clip-generator/dubbing) ve şartnamenin istediği
"ChatCut alternatifi, özgün AI video editör" — üçü aynı şey mi, hangisi temel
alınmalı?

**Bulgu (kod incelemesiyle doğrulandı):**

- **Kade Studio zaten şartname §17.1'in (MVP kapsamı) neredeyse tamamını
  içeriyor**: presigned upload, Whisper transkripsiyon, sessizlik/filler tespiti
  (Türkçe doğal dil komut ayrıştırıcı dahil — "sessizlikleri kaldır" gibi),
  kelime-bazlı otomatik altyazı (3 stil preseti, ASS format), 9:16/1:1/16:9
  dönüşüm (crop/pad filtre grafiği), BullMQ render job kuyruğu, ilerleme takibi,
  proje/timeline/export API'leri, versiyonlama (timeline snapshot). Bu, 20 Temmuz
  2026'da tek bir yoğun oturumda inşa edilmiş, gerçek ve çalışan bir mimari — iskelet
  değil.
- `apps/kadexai`'nin video sayfaları **birer editör değil, tekil AI araçları**:
  `video-factory` sunucu tarafında prompt-to-video üretiyor (mpturbo/
  MoneyPrinterTurbo motoruyla), `clip-generator` tamamen tarayıcı-içi (ffmpeg.wasm)
  çalışıyor ve sunucu tarafı proje/kuyruk/kredi durumu yok (sayfa kapanınca kaybolur),
  `dubbing` boş bir "yakında" sayfası.
- **İki taraf arasında sıfır kod paylaşımı/referansı** — birbirinden habersiz,
  bağımsız geliştirilmiş.

**Karar: Şartname §17'nin temeli olarak Kade Studio kullanılacak.** Sıfırdan
dördüncü bir video ürünü inşa edilmeyecek — bu hem şartnamenin §1.2 "gereksiz
karmaşa ekleme" kuralına hem de mühendislik mantığına aykırı olurdu. `kadexai`'nin
`video-factory`/`clip-generator` sayfaları **ayrı, tamamlayıcı tekil araçlar**
olarak kalacak (kaldırılmayacak, ama ChatCut-alternatifi kapsamına dahil
edilmeyecek — mimarileri buna uygun değil).

**Kalan iş** (bkz. `docs/10_CHATCUT_ALTERNATIVE_FEASIBILITY_TR.md`): kredi/kullanım
limiti sistemi (kodda hiç yok), retry/cancel, admin maliyet paneli, watermark/
intro-outro şablonları, güvenlik sertleştirmesi (signed URL süre testleri, dosya
doğrulama), prod Whisper entegrasyonunun doğrulanması.

---

## KARAR 2 — Sosyal medya araçları (§15/§16): mevcut olanı genişlet, kopyalama

**Bulgu:** `apps/kadexai`'nin 35 dashboard sayfasının çoğu şartnamenin §15
listesiyle **kısmen ila tam** örtüşüyor (metin/caption, içerik fikri, hashtag,
içerik takvimi, kısa-içerik-çıkarma tam; hook/başlık-analizi/platform-yeniden-yazma
kısmi). **Gerçek boşluklar**: CTA oluşturucu, marka tonu kontrolü, içerik kalite
kontrol listesi, yayın öncesi risk/telif/marka kontrolü — bunlar hiç yok, yeni
araç sayfaları olarak eklenmeli.

**"İçerik neden izlenir/izlenmez" aracı (§15, 15-faktörlü açıklanabilir skor) —
mevcut `viral-score` sayfasıyla YANLIŞ eşleşiyordu.** `viral-score` yalnızca
başlık+açıklama+hashtag metnine bakan 5 kriterlik basit bir araç; şartnamenin
istediği video/tempo/hook-gücü/görsel-değişim/ses-okunabilirlik analizi hiç yok.
**Karar: Bu, ayrı, yeni bir araç olarak ele alınmalı**, `viral-score`'un yerine
geçmeyecek, onunla karıştırılmayacak.

**§16 (kişisel sosyal medya analizcisi):** `social-audit`/`competitor`/
`analytics`/`performance`/`retention-analysis` sayfalarının **hiçbiri resmî
platform API'sine bağlı değil** — kullanıcının elle girdiği metni LLM'e
yorumlatıyorlar (tahmin/heuristic). Tek istisna: `comment-analysis`, gerçekten
YouTube Data API v3 kullanıyor (resmî, API-key'li). **Şartnamenin §16'da istediği
"resmî API ile gerçek veri" şartı büyük ölçüde karşılanmıyor** — bu bilinçli bir
ürün kararı mı (kullanıcı verisiyle çalışmak, entegrasyon karmaşıklığından
kaçınmak) yoksa eksik mi, netleşmedi. **Instagram Graph API / TikTok API
entegrasyonu olmadan §16 tam anlamıyla karşılanamaz** — bu, OAuth consent akışı,
platform onayı (Meta app review vb.) gerektiren, haftalar sürebilecek ayrı bir
alt proje. Blocker olarak kaydedildi.

**Karar: Mevcut 35 araç korunacak ve genişletilecek** (üstüne yazılmayacak),
yukarıdaki gerçek boşluklar (CTA, marka tonu, kalite kontrolü, risk kontrolü,
15-faktörlü izlenir/izlenmez skoru) **yeni araç sayfaları olarak eklenecek**,
resmî platform API entegrasyonu ayrı bir blocker olarak işaretli kalacak.

---

## KARAR 3 — İki ayrı ticaret/kimlik sistemi birleştirilmeyecek

Bkz. `docs/05_COMMERCE_AND_ENTITLEMENT_TR.md` §1 — gerekçe orada detaylı: kök
(özel JWT) ve kadexai (Supabase Auth) farklı auth modelleri kullanıyor, zorla
birleştirme büyük bir migration riski taşır ve şartnamenin "mevcut mimariyi
anlamadan değiştirme" ve "veri kaybı riski taşıyan migration üretme" yasaklarıyla
çelişir. Her iki sistem de aynı KAVRAMSAL modele ayrı ayrı hizalanacak.

---

## KARAR 4 — Paket yöneticisi: npm kalacak

Kökte 3 paralel lockfile var (`bun.lock`, `package-lock.json`, `pnpm-lock.yaml`).
Bu oturumun tamamında (MongoDB→Supabase taşıması dahil) `npm run` komutları
sorunsuz çalıştı. **Karar: npm/package-lock.json birincil kaynak olarak kalacak**,
diğer iki lock dosyasının kaldırılması ayrı, düşük riskli bir temizlik işi olarak
not edildi (bu turda dokunulmadı — kaldırma işlemi başka bir araç zincirinin
kullanılmadığını doğrulamayı gerektirir).

---

## Sonraki mimari kararlar (henüz verilmedi, ilgili fazda verilecek)

- BYOK şifreleme yöntemi (Faz 3)
- UsageLimit/CreditWallet hangi metrikleri takip edecek (Faz 3)
- Audit log şema genişletmesi zamanlaması (Faz 3, düşük risk)
- Odoo kararı (Faz 7, ayrı belge `docs/09_ODOO_DECISION_TR.md`)
