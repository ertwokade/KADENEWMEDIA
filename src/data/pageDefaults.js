export const NAVIGATION_DEFAULTS = {
  links: [
    { labelTr: 'HİZMETLER', labelEn: 'SERVICES', path: '/hizmetler' },
    { labelTr: 'PAKETLER', labelEn: 'PACKAGES', path: '/paketler' },
    { labelTr: 'PORTFOLYO', labelEn: 'PORTFOLIO', path: '/portfolio' },
    { labelTr: 'HAKKIMIZDA', labelEn: 'ABOUT', path: '/hakkimizda' },
    { labelTr: 'BLOG', labelEn: 'BLOG', path: '/blog' },
    { labelTr: 'İLETİŞİM', labelEn: 'CONTACT', path: '/iletisim' },
  ],
  loginLabelTr: 'GİRİŞ →',
  loginLabelEn: 'LOGIN →',
}

export const HOME_HERO_DEFAULTS = {
  tr: {
    eyebrow: 'Sosyal Medya & Pazarlama',
    introLine: 'Kade Media — İstanbul merkezli dijital pazarlama ajansı.',
    title1: 'BİZ',
    title2: 'markanı',
    title3: 'büyütüyoruz',
    subtitle: 'Sosyal medya, içerik, reklam ve prodüksiyonla markanı dijitalde konumlandırıyoruz.',
    bodyText: 'Strateji, içerik ve reklamı bir araya getirerek markaların dijitalde düzenli büyümesini sağlıyoruz.',
    primaryLabel: 'Teklif al',
    primaryHref: '/teklif-al',
    secondaryLabel: 'Hizmetleri incele',
    secondaryHref: '/hizmetler',
  },
  en: {
    eyebrow: 'Social Media & Marketing',
    introLine: 'Kade Media — an Istanbul-based digital marketing agency.',
    title1: 'WE',
    title2: 'grow your',
    title3: 'brand',
    subtitle: 'We position your brand digitally through social media, content, advertising and production.',
    bodyText: 'We combine strategy, content and advertising to create consistent digital growth.',
    primaryLabel: 'Request a quote',
    primaryHref: '/teklif-al',
    secondaryLabel: 'Explore services',
    secondaryHref: '/hizmetler',
  },
}

export const HOME_STATS_DEFAULTS = {
  clients: '20+',
  followers: '500K+',
  campaigns: '60+',
  satisfaction: '4.8/5',
}

export const HOME_SERVICES_DEFAULTS = {
  items: [
    { slug: 'sosyal-medya-yonetimi', titleTr: 'Sosyal Medya Yönetimi', titleEn: 'Social Media Management', descTr: 'Planlama, yayın, topluluk ve raporlama.', descEn: 'Planning, publishing, community and reporting.', featuresTr: 'İçerik takvimi, Topluluk yönetimi, Raporlama', featuresEn: 'Content calendar, Community management, Reporting' },
    { slug: 'icerik-uretimi', titleTr: 'İçerik Üretimi', titleEn: 'Content Production', descTr: 'Görsel, video ve metin üretimini tek marka diliyle yürütüyoruz.', descEn: 'Visual, video and copy production in one brand language.', featuresTr: 'Reels, Tasarım, Metin', featuresEn: 'Reels, Design, Copy' },
    { slug: 'reklam-yonetimi', titleTr: 'Reklam Yönetimi', titleEn: 'Ad Management', descTr: 'Meta, Google ve TikTok kampanyalarını performans odaklı yönetiyoruz.', descEn: 'Performance-led Meta, Google and TikTok campaigns.', featuresTr: 'Hedefleme, A/B testleri, Optimizasyon', featuresEn: 'Targeting, A/B tests, Optimization' },
    { slug: 'video-produksiyon', titleTr: 'Video Prodüksiyon', titleEn: 'Video Production', descTr: 'Senaryodan kurguya kısa ve uzun video prodüksiyonu.', descEn: 'Short and long-form video production from script to edit.', featuresTr: 'Senaryo, Çekim, Kurgu', featuresEn: 'Script, Shoot, Edit' },
    { slug: 'strateji-danismanlik', titleTr: 'Strateji & Danışmanlık', titleEn: 'Strategy & Consulting', descTr: 'Hedef, KPI ve kanal planını uygulanabilir yol haritasına dönüştürüyoruz.', descEn: 'Goals, KPIs and channel plans turned into an actionable roadmap.', featuresTr: 'Analiz, Yol haritası, KPI', featuresEn: 'Analysis, Roadmap, KPIs' },
    { slug: 'web-sitesi-tasarimi', titleTr: 'Web Sitesi Tasarımı', titleEn: 'Website Design', descTr: 'Hızlı, mobil uyumlu ve yönetilebilir dijital deneyimler.', descEn: 'Fast, responsive and manageable digital experiences.', featuresTr: 'UI/UX, CMS, Performans', featuresEn: 'UI/UX, CMS, Performance' },
  ],
}

export const HOME_TESTIMONIALS_DEFAULTS = { items: [] }

export const HOME_FAQ_DEFAULTS = {
  tr: [
    { q: 'Nasıl çalışmaya başlıyoruz?', a: 'İhtiyacı netleştiren kısa bir keşif görüşmesinden sonra yazılı kapsam, takvim ve teklif paylaşıyoruz.' },
    { q: 'Reklam bütçesi hizmet bedeline dahil mi?', a: 'Hayır. Reklam harcaması doğrudan platformlara ödenir ve hizmet bedelinden ayrı gösterilir.' },
    { q: 'Raporlama yapıyor musunuz?', a: 'Evet. Kapsama göre aylık veya daha sık performans raporu ve değerlendirme görüşmesi sunuyoruz.' },
  ],
  en: [
    { q: 'How do we get started?', a: 'After a short discovery call, we share a written scope, timeline and proposal.' },
    { q: 'Is ad spend included?', a: 'No. Media spend is paid directly to platforms and shown separately from the service fee.' },
    { q: 'Do you provide reports?', a: 'Yes. Depending on scope, we provide monthly or more frequent performance reports and reviews.' },
  ],
}

export const BASIN_DEFAULTS = {
  contactEmail: 'thekademedia@gmail.com',
  responseTime: '24 saat içinde',
  ctaTitle: 'Röportaj veya iş birliği mi istiyorsunuz?',
  ctaSubtitle: 'Sosyal medya, dijital pazarlama ve ajansçılık konularında görüş almak için bize ulaşın.',
  companyInfo: [
    { etiket: 'Şirket Adı', deger: 'Kade New Media' },
    { etiket: 'Kuruluş', deger: 'İstanbul' },
    { etiket: 'Merkez', deger: 'Biruni Teknopark, İstanbul' },
  ],
  logoPackages: [],
  news: [],
}

export const NEDEN_BIZ_DEFAULTS = {
  heroBadge: 'Fark Yaratan Ajans',
  heroSubtitle: 'Süreci, kapsamı ve sonuçları görünür kılan bir çalışma modeli.',
  ctaTitle: 'Farkı kendiniz görün',
  ctaSubtitle: '30 dakikalık ücretsiz keşif görüşmesiyle başlayın.',
  rakamlar: [
    { sayi: '20+', etiket: 'Yönetilen Marka', ikon: '📱' },
    { sayi: '4.8/5', etiket: 'Memnuniyet', ikon: '⭐' },
    { sayi: '60+', etiket: 'Kampanya', ikon: '📈' },
  ],
  karsilastirma: [
    { kriter: 'İçerik Onay Süreci', biz: 'Yazılı takvim ve net onay', diger: 'Değişken süreç' },
    { kriter: 'Raporlama', biz: 'Karşılaştırmalı ve düzenli', diger: 'Sınırlı görünürlük' },
    { kriter: 'Kapsam', biz: 'Teklifte açıkça tanımlı', diger: 'Belirsiz kalemler' },
  ],
  avantajlar: [
    { ikon: '🎯', baslik: 'İhtiyaca Özel Strateji', aciklama: 'Kanal ve içerik planı markanın hedefine göre şekillenir.', renk: '#6C63FF' },
    { ikon: '⚡', baslik: 'Hızlı Başlangıç', aciklama: 'Onaylanan kapsamı net bir takvimle hayata geçiririz.', renk: '#eac321' },
  ],
}

export const REFERRAL_DEFAULTS = {
  heroBadge: 'Referans Programı',
  heroTitleBefore: 'İyi işi',
  heroTitleHighlight: 'iyi markalarla',
  heroTitleAfter: ' buluşturun',
  heroSubtitle: 'Kade Media ile çalışmasını önerdiğiniz marka müşterimiz olduğunda ödülünüzü birlikte netleştirelim.',
  rewardKicker: 'Ödül modeli',
  rewardTitle: 'İlk ay hizmet bedelinden %10’a kadar referral ödülü',
  rewardText: 'Ödül oranı proje kapsamına göre netleşir ve anlaşma aktif olduktan sonra takip edilir.',
  steps: [
    { ikon: '🤝', baslik: 'Tanıştırın', aciklama: 'Markayı ve iletişim kişisini bizimle paylaşın.' },
    { ikon: '🔎', baslik: 'İhtiyacı doğrulayalım', aciklama: 'Uygun ihtiyaç varsa ücretsiz keşif görüşmesi planlayalım.' },
    { ikon: '💰', baslik: 'Ödül kazanın', aciklama: 'Anlaşma başladığında referral ödülünüzü tanımlayalım.' },
  ],
  serviceOptions: ['Sosyal Medya Yönetimi', 'İçerik Üretimi', 'Reklam Yönetimi', 'Video Prodüksiyon', 'Web Sitesi', 'Strateji Danışmanlığı'],
}

export const PODCAST_DEFAULTS = {
  heroBadge: 'Podcast & Webinar',
  heroTitleBefore: 'Ajans bilgisini',
  heroTitleHighlight: 'açık kaynak',
  heroTitleAfter: ' paylaşıyoruz',
  heroSubtitle: 'Webinar, canlı yayın ve podcast içerikleriyle dijital ekiplere pratik rehberler.',
  ctaLabel: 'Katılım bilgisi al',
  ctaLink: '/iletisim',
  items: [],
}

export const NEWSLETTER_DEFAULTS = {
  items: [],
}

export const PRICE_CALCULATOR_DEFAULTS = {
  base: 3000,
  perPlatform: 1800,
  perPost: 300,
  perReel: 1500,
  adsFlat: 4500,
  reportBiweekly: 1500,
  reportWeekly: 3000,
  disclaimer: 'Bu yaklaşık tutar reklam harcamasını içermez. Kesin kapsam ve fiyat yazılı teklif ile netleşir.',
}

export const PORTFOLIO_DEFAULTS = {
  items: [
    { id: 'flavora-sosyal-medya', titleTr: 'Flavora Sosyal Medya Kampanyası', titleEn: 'Flavora Social Media Campaign', category: 'Social Media', partner: 'Flavora', emoji: '🍕', color: '#eac321', metricKey: 'Erişim', metricVal: '2M+' },
    { id: 'techvibe-lansman', titleTr: 'TechVibe Ürün Lansmanı', titleEn: 'TechVibe Product Launch', category: 'Launch', partner: 'TechVibe', emoji: '💻', color: '#6C63FF', metricKey: 'İndirme', metricVal: '500K+' },
    { id: 'greenlife-buyume', titleTr: 'GreenLife E-Ticaret Büyümesi', titleEn: 'GreenLife E-Commerce Growth', category: 'E-Commerce', partner: 'GreenLife', emoji: '🌿', color: '#2ECC71', metricKey: 'Satış', metricVal: '%400' },
  ],
}
