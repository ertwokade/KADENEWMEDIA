// Single source of truth for the /paketler page content — used by the live
// page and scripts/generate-static-routes.mjs for the static prerender.
export const PACKAGE_SCOPES = [
  {
    id: 'baslangic',
    nameTr: 'Başlangıç',
    nameEn: 'Starter',
    descTr: 'Dijital iletişim temelini ve düzenli yayın akışını kurmak isteyen markalar için.',
    descEn: 'For brands establishing their digital communication foundation and publishing rhythm.',
    featuresTr: ['Marka ve kanal değerlendirmesi', 'İçerik planı', 'Yayın akışı', 'Dönemsel değerlendirme'],
    featuresEn: ['Brand and channel review', 'Content plan', 'Publishing workflow', 'Periodic review'],
  },
  {
    id: 'buyume',
    nameTr: 'Büyüme',
    nameEn: 'Growth',
    descTr: 'İçerik üretimiyle reklam yönetimini aynı plan içinde yürütmek isteyen markalar için.',
    descEn: 'For brands managing content production and advertising in one plan.',
    featuresTr: ['İçerik üretim planı', 'Kanal yönetimi', 'Reklam operasyonu', 'Performans raporlaması'],
    featuresEn: ['Content production plan', 'Channel management', 'Ad operations', 'Performance reporting'],
  },
  {
    id: 'ozel',
    nameTr: 'Özel Kapsam',
    nameEn: 'Custom Scope',
    descTr: 'Prodüksiyon, kampanya veya çok kanallı ihtiyaçları proje bazında planlanan markalar için.',
    descEn: 'For project-based production, campaign, or multi-channel requirements.',
    featuresTr: ['İhtiyaç analizi', 'Özel teslim planı', 'Kapsama göre ekip', 'Teklif öncesi netleştirme'],
    featuresEn: ['Needs analysis', 'Custom delivery plan', 'Scope-based team', 'Pre-quote clarification'],
  },
]

export const PACKAGE_FAQS = [
  {
    tr: ['Fiyatlar neden listelenmiyor?', 'Hizmet bedeli kanal, üretim adedi, reklam operasyonu ve teslim kapsamına göre değişir. KDV ve ek maliyetler yazılı teklifte ayrıca belirtilir.'],
    en: ['Why are prices not listed?', 'Fees vary by channel, production volume, advertising operations, and delivery scope. Taxes and additional costs are stated separately in the written quote.'],
  },
  {
    tr: ['Reklam bütçesi pakete dahil mi?', 'Dahil olduğu varsayılmaz. Medya bütçesi ile hizmet bedeli, hazırlanacak teklifte ayrı kalemler olarak açıklanır.'],
    en: ['Is media spend included?', 'It is not assumed to be included. Media spend and service fees are described as separate items in the quote.'],
  },
]
