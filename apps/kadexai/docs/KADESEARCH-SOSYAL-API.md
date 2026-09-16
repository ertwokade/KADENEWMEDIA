# KadeSearch — TikTok ve Instagram resmi erişim kurulumu

KadeSearch resmi bilgiler sunucu ortamına eklendiği anda **kod değişikliği veya yeniden derleme olmadan** bu API'leri kullanır (konteyneri yeni env dosyasıyla yeniden başlatmak yeterli):

| Platform | Değişkenler | Nerede devreye girer |
| --- | --- | --- |
| TikTok | `TIKTOK_RESEARCH_CLIENT_KEY`, `TIKTOK_RESEARCH_CLIENT_SECRET` | KadeSearch canlı arama, TikTok trend toplayıcı, Ayarlar durumu |
| Instagram | `INSTAGRAM_BUSINESS_ACCOUNT_ID`, `INSTAGRAM_GRAPH_ACCESS_TOKEN`, (ops.) `META_GRAPH_API_VERSION` | KadeSearch canlı Reels araması, Instagram trend toplayıcı, Ayarlar durumu |

Öncelik sırası: **resmi API → eski çerez yolu (`TIKTOK_COOKIE`, `INSTAGRAM_SESSION_ID`) → kaynak kapalı**. Hiçbir durumda tahmini sonuç üretilmez. Geçici kapatmak için: `KADE_DISABLED_INTEGRATIONS=tiktok,instagram`.

## 1. TikTok Research API

1. https://developers.tiktok.com adresinde geliştirici hesabı aç.
2. **Research API** başvurusu yap (Products → Research API). TikTok bu erişimi akademik araştırmacılar ve onaylı kurumlara verir; başvuruda kullanım amacı, veri saklama ve güvenlik açıklaması istenir. Ticari ajans başvuruları reddedilebilir — onay TikTok'un kararıdır.
3. Onaylanan uygulamanın **Client key** ve **Client secret** değerlerini al.
4. Sunucuda `/srv/kade/secrets/kadexai.env` dosyasına ekle:
   ```
   TIKTOK_RESEARCH_CLIENT_KEY=...
   TIKTOK_RESEARCH_CLIENT_SECRET=...
   ```

Sınırlar: günlük 1.000 istek / 100.000 kayıt; tarih aralığı en fazla 30 gün. Yeni videoların ölçümleri API'de birkaç gün gecikmeyle güncellenebilir.

## 2. Instagram Graph API (Hashtag Search)

1. Instagram hesabını **Business** veya **Creator** hesabına çevir ve bir Facebook Sayfasına bağla.
2. https://developers.facebook.com → **Uygulama oluştur** (tür: Business).
3. Uygulamaya **Instagram Graph API** ürününü ekle.
4. **App Review** ile şu izin/özellikleri iste: `instagram_basic`, `pages_show_list`, `pages_read_engagement` ve **Instagram Public Content Access** özelliği. Hashtag araması bu özellik onaylanmadan çalışmaz.
5. Meta Business Suite → Ayarlar → **Sistem kullanıcıları**: bir sistem kullanıcısı oluştur, uygulamayı ve Sayfayı ata, yukarıdaki izinlerle **süresiz** belirteç üret (60 günlük kullanıcı belirteci de çalışır ama süresi dolunca bağlantı kapanır).
6. IG kullanıcı kimliğini bul: `GET https://graph.facebook.com/v23.0/me/accounts?fields=instagram_business_account&access_token=...` → `instagram_business_account.id`.
7. Sunucu env dosyasına ekle:
   ```
   INSTAGRAM_BUSINESS_ACCOUNT_ID=1784...
   INSTAGRAM_GRAPH_ACCESS_TOKEN=...
   META_GRAPH_API_VERSION=v23.0
   ```

Sınırlar ve dürüstlük notu:
- Meta, **7 günde en fazla 30 farklı hashtag** aramasına izin verir. Toplayıcı 6 sabit etiket kullanır; kalan pay kullanıcı aramalarınadır. Aynı etiketi tekrar aramak kota harcamaz.
- Arama metni hashtag'e çevrilir ("yapay zeka" → `#yapayzeka`).
- Başkalarının gönderilerinde **izlenme sayısı verilmez**; yalnız beğeni ve yorum gerçektir. KadeSearch izlenmeyi uydurmaz, bu yüzden Reels sonuçları izlenmeye dayalı sıralamada geride kalabilir.
- Yalnız video medyası (Reels) listelenir.

## 3. Devreye alma ve doğrulama

1. Env dosyasını güncelledikten sonra canlı konteyneri yeniden başlat (`deploy/keyubu/deploy-release.sh` akışı veya `docker compose up -d`).
2. Hesap sahibi olarak oturum açıkken şu adresi aç:
   `https://kadexai.kadenewmedia.com/kadexai/api/kade-search/access-check`
   Her platform için `ok: true` ve açıklama döner. Instagram testi hashtag kotası harcamaz; TikTok testi tek kayıtlık bir sorgu atar. Sır değerleri yanıtta yer almaz.
3. **Ayarlar → Altyapı** bölümünde "TikTok Research API" ve "Instagram Graph API" satırları "Yapılandırıldı" görünür.
4. KadeSearch'te arama yap; kapsam kartlarında TikTok/Instagram "canlı" moduna geçer.

Hata mesajları: "belirteç süresi dolmuş" → yeni belirteç üret; "Public Content Access izni yok" → App Review eksik; "kota doldu" → süre dolana kadar bekle.
