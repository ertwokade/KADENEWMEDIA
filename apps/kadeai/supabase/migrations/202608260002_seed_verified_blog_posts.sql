-- Kade New Media'nın kendi süreçlerinden türetilen, doğrulanabilir evergreen içerik temeli.
-- Müşteri ismi, sıralama vaadi veya kaynaksız performans iddiası içermez.

INSERT INTO public.kade_blogs (
  slug, title_tr, title_en, excerpt_tr, excerpt_en, content_tr, content_en,
  category, category_en, color, read_time, published, publish_at, display_date
) VALUES
(
  'new-media-ajansi-secerken-nelere-bakilmali',
  'New Media Ajansı Seçerken Nelere Bakılmalı?',
  'What to Look for When Choosing a New Media Agency',
  'Ajans seçimini takipçi vaadine değil; ölçüm, üretim sistemi, şeffaflık ve sahipliğe göre değerlendirmek için pratik kontrol listesi.',
  'A practical checklist for evaluating an agency through measurement, production systems, transparency and ownership.',
  '<p>Bir new media ajansı seçerken ilk soru “kaç takipçi getirirsiniz?” olmamalı. Sağlıklı iş birliği; hedef, ölçüm, üretim kapasitesi ve karar alma biçiminin açık olmasına dayanır.</p><h2>1. Hedefi iş sonucuna bağlayın</h2><p>Erişim ve izlenme değerlidir; ancak tek başına başarı değildir. Ajansın içerik metriklerini talep, satış, kayıt veya marka araması gibi iş sonuçlarıyla nasıl ilişkilendirdiğini sorun.</p><h2>2. Üretim sistemini görün</h2><p>Fikir, onay, çekim, kurgu, yayın ve raporlama adımlarının sahibi belli olmalıdır. İyi bir sistem, tek bir kişiye veya mesaj geçmişine bağlı kalmaz.</p><h2>3. Ölçümün kaynağını sorun</h2><p>Raporlarda dönem, platform ve veri kaynağı görünmelidir. Tahmin ile gerçekleşen sonuç aynı tabloda ama farklı etiketlerle sunulmalıdır.</p><h2>4. Hesap sahipliğini netleştirin</h2><p>Reklam hesabı, alan adı, analitik, piksel ve içerik arşivinin kime ait olduğunu sözleşmeden önce belirleyin. Marka kritik varlıklarının erişimi müşteride kalmalıdır.</p><h2>5. Küçük bir pilotla başlayın</h2><p>Kapsamı net bir pilot dönem; iletişim hızını, içerik kalitesini ve raporlama disiplinini gerçek iş üzerinde görmenizi sağlar.</p><h2>Kısa kontrol listesi</h2><ul><li>Hedef ve başarı metriği yazılı mı?</li><li>Onay ve revizyon akışı belli mi?</li><li>Veri kaynağı raporda görünüyor mu?</li><li>Hesapların sahibi marka mı?</li><li>Kapsam dışı işler önceden tanımlı mı?</li></ul><p>Kade New Media’da bu başlıkları teklif aşamasında kapsam dokümanına dönüştürüyoruz.</p>',
  '<p>Choosing a new media agency should start with goals, measurement, production capacity and clear ownership—not follower promises.</p><h2>Use a practical checklist</h2><ul><li>Are goals and success metrics written down?</li><li>Is the approval and revision flow clear?</li><li>Are reporting sources visible?</li><li>Does the brand retain account ownership?</li><li>Is out-of-scope work defined?</li></ul>',
  'Strateji', 'Strategy', '#eac321', '6 dk', TRUE, NULL, '26 Ağu 2026'
),
(
  'sosyal-medya-icerik-sistemi-nasil-kurulur',
  'Sosyal Medya İçerik Sistemi Nasıl Kurulur?',
  'How to Build a Social Media Content System',
  'Fikirden yayına kadar tekrar edilebilir bir içerik operasyonu kurmak için rol, durum ve kalite kontrol modeli.',
  'A repeatable operating model for roles, status and quality control from idea to publishing.',
  '<p>Düzenli içerik üretiminin temel sorunu çoğu zaman fikir eksikliği değil, kararların dağınık olmasıdır. Sağlam bir içerik sistemi her içeriğin hangi durumda olduğunu ve sıradaki kararın kimde olduğunu gösterir.</p><h2>Tek bir içerik kuyruğu kurun</h2><p>Trend, müşteri sorusu, ürün özelliği ve evergreen fikirleri aynı havuzda toplayın. Her kayıtta hedef platform, format, kanca, kaynak ve sorumlu bulunsun.</p><h2>Durumları azaltın</h2><p>Bekliyor, onaylandı, üretimde, planlandı ve yayınlandı çoğu ekip için yeterlidir. Çok fazla durum, ilerlemeyi görünmez yapar.</p><h2>Onayı üretimden ayırın</h2><p>Önce fikir ve açı onaylanmalı; ardından caption, görsel brief ve çekim listesi hazırlanmalıdır. Böylece ekip, reddedilecek bir fikrin üretimine zaman harcamaz.</p><h2>Kalite kapıları ekleyin</h2><ul><li>İddia ve kaynak kontrolü</li><li>Marka dili ve görsel tutarlılık</li><li>Mobilde ilk iki saniyenin okunabilirliği</li><li>CTA ve hedef bağlantı kontrolü</li><li>Yayın sonrası ölçüm tarihi</li></ul><h2>Haftalık ritim oluşturun</h2><p>Haftanın başında seçim, ortasında üretim, sonunda ölçüm yapılması karar yükünü azaltır. Günlük bildirimler yalnızca yeni karar gerektiğinde gelmelidir.</p><p>KadeSearch Onay Merkezi bu akışı trend seçimi, üretim paketi ve WhatsApp bildirimiyle tek ekranda birleştirir.</p>',
  '<p>A reliable content system shows the state of every idea and who owns the next decision.</p><h2>Keep the workflow small</h2><p>Backlog, approved, in production, scheduled and published are enough for most teams.</p><h2>Add quality gates</h2><ul><li>Claim and source review</li><li>Brand consistency</li><li>Mobile readability</li><li>CTA verification</li><li>Post-publish measurement</li></ul>',
  'İçerik Operasyonu', 'Content Operations', '#34d399', '7 dk', TRUE, NULL, '26 Ağu 2026'
),
(
  'yapay-zeka-destekli-icerikte-kalite-kontrol',
  'Yapay Zekâ Destekli İçerikte Kalite Kontrol',
  'Quality Control for AI-Assisted Content',
  'AI ile hız kazanırken yanlış bilgi, benzerlik ve marka dili risklerini azaltan insan onaylı yayın modeli.',
  'A human-approved publishing model that reduces factual, similarity and brand voice risks while using AI for speed.',
  '<p>Yapay zekâ içerik üretimini hızlandırabilir; fakat yayın sorumluluğunu üstlenmez. Kaliteli bir süreçte AI taslak üretir, kaynakları ve bağlamı insan doğrular, yayın kararını yetkili kişi verir.</p><h2>AI çıktısını taslak kabul edin</h2><p>Başlık, caption ve görsel brief önerileri doğrudan yayınlanmamalıdır. Özellikle sayı, tarih, kişi, fiyat ve hukuki ifade içeren cümleler bağımsız olarak doğrulanmalıdır.</p><h2>Kaynağı içerikle birlikte saklayın</h2><p>Trend veya haber tabanlı içerikte kaynak URL’si, erişim tarihi ve ana iddia aynı kayıtta tutulmalıdır. Böylece editör hangi cümleyi neden kullandığını görebilir.</p><h2>Marka kontrolü yapın</h2><p>Ton, yasaklı ifadeler, hedef kitle ve CTA için kısa bir kontrol listesi oluşturun. Aynı model farklı bağlamlarda farklı sonuç verebildiği için son kontrol markaya özgü olmalıdır.</p><h2>Görsel güvenliği unutmayın</h2><p>Gerçek kişilerin görüntüsü, telifli karakterler ve yanıltıcı önce/sonra anlatımları ayrıca incelenmelidir. Üretilmiş görsel gerekiyorsa bunun kullanım bağlamı açık tutulmalıdır.</p><h2>İnsan onaylı akış</h2><ol><li>AI araştırma ve taslak üretir.</li><li>Editör iddiaları ve kaynakları kontrol eder.</li><li>Marka sahibi açıyı onaylar veya reddeder.</li><li>Üretim paketi hazırlanır.</li><li>Yayın sonrası sonuç ölçülür.</li></ol><p>KadeAI’da onay merkezi, AI’ın öneri rolü ile insanın yayın sorumluluğunu bilinçli olarak ayırır.</p>',
  '<p>AI can accelerate drafting but it does not own publishing responsibility. A reliable workflow keeps a human approval step.</p><h2>Core controls</h2><ul><li>Treat output as a draft</li><li>Store sources with claims</li><li>Check brand voice</li><li>Review visual rights and context</li><li>Measure after publishing</li></ul>',
  'Yapay Zekâ', 'Artificial Intelligence', '#60a5fa', '6 dk', TRUE, NULL, '26 Ağu 2026'
)
ON CONFLICT (slug) DO UPDATE SET
  title_tr = EXCLUDED.title_tr,
  title_en = EXCLUDED.title_en,
  excerpt_tr = EXCLUDED.excerpt_tr,
  excerpt_en = EXCLUDED.excerpt_en,
  content_tr = EXCLUDED.content_tr,
  content_en = EXCLUDED.content_en,
  category = EXCLUDED.category,
  category_en = EXCLUDED.category_en,
  color = EXCLUDED.color,
  read_time = EXCLUDED.read_time,
  published = EXCLUDED.published,
  publish_at = EXCLUDED.publish_at,
  display_date = EXCLUDED.display_date,
  updated_at = NOW();
