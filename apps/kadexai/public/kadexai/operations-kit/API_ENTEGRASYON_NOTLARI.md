# API entegrasyon durumu

Operasyon alanı servis durumunu `/api/config` üzerinden okur. API anahtarları yalnızca sunucuda tutulur.

| Alan | Uç | Davranış |
|---|---|---|
| Operasyon asistanı | `POST /api/assistant` | Uygun metin modeli otomatik seçilir; servis yoksa yerel özet açıkça etiketlenir. |
| YouTube yorumları | `GET /api/youtube/comments` | `YOUTUBE_API_KEY` varsa yorumları çeker; yoksa kullanıcı yorumları elle yapıştırır. |
| Görsel üretimi | `POST /api/image` | Gemini veya OpenAI kullanır. Ana servis hata verirse yedek sağlayıcı kullanıldığı yanıtta belirtilir. |
| Video üretimi | — | Sağlayıcı bağlı değildir; arayüzde `Yakında` olarak devre dışıdır. |
| Operasyon kaydı | `POST /api/operations-state` | Oturum varsa Supabase'e, yoksa tarayıcıdaki yerel depoya kaydeder. |

Boş çalışma alanında örnek bütçe, prodüksiyon, görsel veya video üretilmez. Örnek yorumlar yalnızca kullanıcı ilgili düğmeye bastığında analiz alanına yüklenir.
