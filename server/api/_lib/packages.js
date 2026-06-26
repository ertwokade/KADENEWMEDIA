// Shopier ürün referansı → paket tanımı eşlemesi
// SHOPIER_PRODUCT_* env değişkenleriyle veya direkt bu dosyada yönetilir.
// Her paket için consultingArea ve features tanımlayın.

export const PACKAGE_DEFINITIONS = {
  // Anahtar = Shopier product_reference değeri
  'sosyal-medya-starter': {
    name: 'Sosyal Medya Başlangıç Paketi',
    consultingArea: 'social-media',
    features: [
      'Instagram yönetimi',
      'Facebook yönetimi',
      'Aylık 30 gönderi',
      'Haftalık story',
    ],
    durationDays: 30,
  },
  'sosyal-medya-growth': {
    name: 'Sosyal Medya Büyüme Paketi',
    consultingArea: 'social-media',
    features: [
      'Instagram + Facebook + LinkedIn yönetimi',
      'Aylık 60 gönderi',
      'Günlük story',
      'Reels üretimi (4/ay)',
      'Aylık performans raporu',
    ],
    durationDays: 30,
  },
  'seo-starter': {
    name: 'SEO Başlangıç Paketi',
    consultingArea: 'seo',
    features: [
      'Teknik SEO denetimi',
      'Anahtar kelime araştırması',
      'Aylık 2 blog yazısı',
      'Google Search Console kurulumu',
    ],
    durationDays: 30,
  },
  'seo-professional': {
    name: 'SEO Profesyonel Paketi',
    consultingArea: 'seo',
    features: [
      'Teknik SEO denetimi',
      'Anahtar kelime araştırması',
      'Aylık 8 blog yazısı',
      'Backlink inşası',
      'Rakip analizi',
      'Aylık SEO raporu',
    ],
    durationDays: 30,
  },
  'dijital-danismanlik': {
    name: 'Dijital Strateji Danışmanlığı',
    consultingArea: 'consulting',
    features: [
      'Aylık 4 saat birebir danışmanlık',
      'Dijital strateji planı',
      'Rakip analizi',
      'KPI belirleme',
    ],
    durationDays: 30,
  },
  'reklam-yonetimi': {
    name: 'Reklam Yönetimi Paketi',
    consultingArea: 'ads',
    features: [
      'Google Ads yönetimi',
      'Meta Ads yönetimi',
      'A/B test optimizasyonu',
      'Haftalık performans raporu',
    ],
    durationDays: 30,
  },
  'icerik-uretimi': {
    name: 'İçerik Üretimi Paketi',
    consultingArea: 'content',
    features: [
      'Aylık 8 blog yazısı',
      'Grafik tasarım (16 adet)',
      'Video script yazımı',
      'İçerik takvimi',
    ],
    durationDays: 30,
  },
  'tam-dijital': {
    name: 'Tam Dijital Paket',
    consultingArea: 'consulting',
    features: [
      'Sosyal medya yönetimi (tüm platformlar)',
      'SEO optimizasyonu',
      'Google + Meta reklam yönetimi',
      'İçerik üretimi',
      'Aylık strateji toplantısı',
      'Haftalık raporlama',
    ],
    durationDays: 30,
  },
}

export function getPackageByReference(reference) {
  return PACKAGE_DEFINITIONS[reference] || null
}

export function buildPackageObject(reference, extra = {}) {
  const def = getPackageByReference(reference)
  if (!def) return null

  const now = new Date()
  const expiresAt = def.durationDays
    ? new Date(now.getTime() + def.durationDays * 24 * 60 * 60 * 1000)
    : null

  return {
    id: `${reference}-${Date.now()}`,
    reference,
    name: def.name,
    consultingArea: def.consultingArea,
    features: [...def.features],
    purchasedAt: now,
    expiresAt,
    status: 'active',
    source: extra.source || 'manual',
    shopierOrderId: extra.shopierOrderId || null,
    price: extra.price || null,
  }
}
