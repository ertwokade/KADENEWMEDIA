// Shopier ürün referansı → paket tanımı eşlemesi
// SHOPIER_PRODUCT_* env değişkenleriyle veya direkt bu dosyada yönetilir.
// Her paket için consultingArea ve features tanımlayın.

export const PACKAGE_DEFINITIONS = {
  'kade-organizasyon-kiti-test': {
    name: 'Kade Organizasyon Kiti',
    consultingArea: 'consulting',
    features: [
      'Kade Organizasyon Kiti erişimi',
      'Medya yol haritası',
      'Yönetim toplantıları',
      'Danışmanlık notları',
    ],
    durationDays: 30,
    price: 0,
    publicFree: true,
    access: {
      consultingPlan: 'fractional_new_media_director',
      consultingStatus: 'active',
      hasOrganizationKitAccess: true,
    },
  },
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
    access: {
      consultingPlan: 'fractional_new_media_director',
      consultingStatus: 'active',
      hasOrganizationKitAccess: true,
    },
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
    access: {
      consultingPlan: 'fractional_new_media_director',
      consultingStatus: 'active',
      hasOrganizationKitAccess: true,
      hasKadeKitBusinessAccess: true,
      hasKadeRadarAccess: true,
      hasAIKnowledgeCenterAccess: true,
    },
  },
}

const DEFAULT_PACKAGE_ENTITLEMENTS = {
  role: 'customer',
  consultingPlan: null,
  consultingStatus: 'inactive',
  hasOrganizationKitAccess: false,
  hasKadeKitBusinessAccess: false,
  hasKadeRadarAccess: false,
  hasAIKnowledgeCenterAccess: false,
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
    access: { ...(def.access || {}) },
    purchasedAt: now,
    expiresAt,
    status: 'active',
    source: extra.source || 'manual',
    shopierOrderId: extra.shopierOrderId || null,
    price: extra.price ?? def.price ?? null,
  }
}

export function isPackageCurrentlyActive(pkg, now = new Date()) {
  if (!pkg || pkg.status !== 'active') return false
  if (!pkg.expiresAt) return true
  const expiresAt = new Date(pkg.expiresAt)
  return Number.isNaN(expiresAt.getTime()) || expiresAt >= now
}

export function buildEntitlementsFromPackages(packages = []) {
  const entitlements = { ...DEFAULT_PACKAGE_ENTITLEMENTS }
  const activePackages = Array.isArray(packages) ? packages.filter(isPackageCurrentlyActive) : []

  activePackages.forEach((pkg) => {
    const access = pkg.access || getPackageByReference(pkg.reference)?.access || {}
    if (!access || typeof access !== 'object') return

    Object.entries(access).forEach(([key, value]) => {
      if (typeof value === 'boolean') {
        entitlements[key] = Boolean(entitlements[key] || value)
      } else if (value != null) {
        entitlements[key] = value
      }
    })
  })

  if (entitlements.hasOrganizationKitAccess && !entitlements.consultingStatus) {
    entitlements.consultingStatus = 'active'
  }

  return entitlements
}
