// Hizmet detay sayfalarının METİN içeriği — tek kaynak.
//
// Bu veri hem React tarafında (src/pages/ServiceDetail.jsx) hem de build sırasında
// statik ön-render için (scripts/generate-static-routes.mjs) kullanılır. Ön-render
// script'i Node üzerinde çalıştığından burada React/ikon importu BULUNMAMALIDIR;
// ikon, renk ve platform gibi sunum alanları ServiceDetail.jsx içinde tutulur.

export const SERVICE_DETAILS = {
  'sosyal-medya-yonetimi': {
    titleTr: 'Sosyal Medya Yönetimi',
    titleEn: 'Social Media Management',
    descTr: 'Instagram, Facebook, TikTok ve LinkedIn için içerik planlama, yayın takvimi, topluluk yönetimi, raporlama ve marka iletişimi hizmetleri.',
    descEn: 'We professionally manage your Instagram, Facebook, TikTok, and LinkedIn accounts. We strengthen your brand in the digital world with content planning, posting schedules, and community management.',
    featuresTr: ['İçerik Takvimi Oluşturma', 'Topluluk Yönetimi', 'Kriz Yönetimi', 'Aylık Raporlama', 'Hashtag Stratejisi', 'Rakip Analizi'],
    featuresEn: ['Content Calendar Creation', 'Community Management', 'Crisis Management', 'Monthly Reporting', 'Hashtag Strategy', 'Competitor Analysis'],
    problemTr: 'Düzensiz paylaşım ve tutarsız marka sesi, sosyal medyada görünürlüğü ve güveni düşürür. Planlı, tutarlı bir yayın akışıyla bunu çözeriz.',
    problemEn: 'Irregular posting and an inconsistent brand voice reduce visibility and trust. We fix this with a planned, consistent publishing flow.',
    deliverablesTr: ['Aylık içerik takvimi', 'Yayın ve topluluk yönetimi', 'Aylık performans raporu'],
    deliverablesEn: ['Monthly content calendar', 'Publishing and community management', 'Monthly performance report'],
  },
  'icerik-uretimi': {
    titleTr: 'İçerik Üretimi',
    titleEn: 'Content Production',
    descTr: 'Markanıza özel görsel, video ve metin içerikleri; içerik stratejisi, grafik tasarım, metin yazımı, fotoğraf çekimi ve sosyal medya tasarımları.',
    descEn: 'We produce unique, creative, and engaging content for your brand. We prepare your visual, video, and text content with our professional team.',
    featuresTr: ['Grafik Tasarım', 'Copywriting', 'Marka Kimliği', 'İçerik Stratejisi', 'Fotoğraf Çekimi', 'Story Tasarımları'],
    featuresEn: ['Graphic Design', 'Copywriting', 'Brand Identity', 'Content Strategy', 'Photography', 'Story Designs'],
    problemTr: 'Çoğu marka “ne paylaşacağını” bulmakta zorlanır. Marka diline uygun, ölçekli bir içerik hattı kurarak bu boşluğu doldururuz.',
    problemEn: 'Most brands struggle to decide what to post. We fill that gap by building an on-brand, scalable content pipeline.',
    deliverablesTr: ['İçerik konsepti ve şablonlar', 'Görsel, video ve metin üretimi', 'Marka kimliği tutarlılığı'],
    deliverablesEn: ['Content concept and templates', 'Visual, video and copy production', 'Brand identity consistency'],
  },
  'reklam-yonetimi': {
    titleTr: 'Reklam Yönetimi',
    titleEn: 'Ad Management',
    descTr: 'Meta, Google Ads ve TikTok Ads kampanyaları için planlama, hedefleme, A/B testleri, yeniden pazarlama ve performans analizi hizmetleri.',
    descEn: 'We manage your ad campaigns on Meta (Facebook & Instagram), Google Ads, and TikTok Ads platforms. We use your budget most efficiently.',
    featuresTr: ['Meta Ads', 'Google Ads', 'TikTok Ads', 'A/B Test', 'Retargeting', 'Performans Analizi'],
    featuresEn: ['Meta Ads', 'Google Ads', 'TikTok Ads', 'A/B Testing', 'Retargeting', 'Performance Analysis'],
    problemTr: 'Yanlış hedefleme ve ölçümsüz kampanyalar bütçeyi tüketir. Veriyle hedefler, test eder ve bütçeyi verimli kullanırız.',
    problemEn: 'Poor targeting and unmeasured campaigns burn budget. We target with data, test, and spend efficiently.',
    deliverablesTr: ['Kampanya kurulumu ve hedefleme', 'A/B testleri ve optimizasyon', 'Şeffaf performans raporu'],
    deliverablesEn: ['Campaign setup and targeting', 'A/B tests and optimization', 'Transparent performance report'],
  },
  'video-produksiyon': {
    titleTr: 'Video Prodüksiyon',
    titleEn: 'Video Production',
    descTr: 'Reels, TikTok, YouTube ve reklam projeleri için senaryo, çekim, kurgu, motion graphics ve proje kapsamına göre prodüksiyon hizmetleri.',
    descEn: 'We offer professional video production services for Reels, TikTok videos, YouTube content, and commercials.',
    featuresTr: ['Reels & TikTok', 'YouTube İçerikleri', 'Reklam Filmleri', 'Motion Graphics', 'Drone Çekimi', 'Senaryo Yazımı'],
    featuresEn: ['Reels & TikTok', 'YouTube Content', 'Commercials', 'Motion Graphics', 'Drone Footage', 'Scriptwriting'],
    problemTr: 'Dikkat süresi kısa; sıradan video iş görmez. Platforma özel, performans için tasarlanmış video üretiriz.',
    problemEn: 'Attention spans are short; generic video does not work. We produce platform-native video designed for performance.',
    deliverablesTr: ['Senaryo ve çekim planı', 'Çekim, kurgu ve motion', 'Platforma özel formatlar'],
    deliverablesEn: ['Script and shoot plan', 'Filming, editing and motion', 'Platform-specific formats'],
  },
  'strateji-danismanlik': {
    titleTr: 'Strateji & Danışmanlık',
    titleEn: 'Strategy & Consulting',
    descTr: 'Marka ve rakip analizi, hedef ve KPI belirleme, dijital pazarlama yol haritası, büyüme planı ve strateji danışmanlığı hizmetleri.',
    descEn: 'We create your digital marketing strategy and map out the path to reach your goals.',
    featuresTr: ['Marka Analizi', 'Rakip Analizi', 'Strateji Planı', 'KPI Belirleme', 'Büyüme Stratejisi', 'Pazar Araştırması'],
    featuresEn: ['Brand Analysis', 'Competitor Analysis', 'Strategy Plan', 'KPI Setting', 'Growth Strategy', 'Market Research'],
    problemTr: 'Net hedef ve yol haritası olmadan kanallar dağınık çalışır. Ölçülebilir bir plan çıkararak yönü netleştiririz.',
    problemEn: 'Without clear goals and a roadmap, channels work in silos. We create a measurable plan that sets the direction.',
    deliverablesTr: ['Marka ve rakip analizi', 'Kanal planı ve KPI seti', 'Dijital yol haritası'],
    deliverablesEn: ['Brand and competitor analysis', 'Channel plan and KPI set', 'Digital roadmap'],
  },
  'web-sitesi-tasarimi': {
    titleTr: 'Web Sitesi Tasarımı',
    titleEn: 'Web Design',
    descTr: 'Markanıza özel mobil uyumlu web sitesi tasarımı, UI/UX, geliştirme, CMS ve e-ticaret entegrasyonu ile performans iyileştirme hizmetleri.',
    descEn: 'We design and develop modern, mobile-friendly websites tailored to your brand. We provide SEO-optimized, fast, and impactful web solutions.',
    featuresTr: ['Responsive Tasarım', 'SEO Optimizasyonu', 'UI/UX Tasarım', 'E-ticaret Çözümleri', 'CMS Entegrasyonu', 'Performans Optimizasyonu'],
    featuresEn: ['Responsive Design', 'SEO Optimization', 'UI/UX Design', 'E-commerce Solutions', 'CMS Integration', 'Performance Optimization'],
    problemTr: 'Yavaş, mobil-uyumsuz veya dönüşüm getirmeyen siteler müşteri kaybettirir. Hızlı, mobil-öncelikli ve dönüşüm odaklı tasarlarız.',
    problemEn: 'Slow, non-mobile or low-converting sites lose customers. We design fast, mobile-first and conversion-focused.',
    deliverablesTr: ['UI/UX tasarım', 'Mobil-öncelikli geliştirme', 'SEO ve hız optimizasyonu'],
    deliverablesEn: ['UI/UX design', 'Mobile-first development', 'SEO and speed optimization'],
  },
}

export const SERVICE_SLUGS = Object.keys(SERVICE_DETAILS)
