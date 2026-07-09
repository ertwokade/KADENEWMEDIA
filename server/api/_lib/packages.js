// Shopier ürün referansı → paket tanımı eşlemesi
// SHOPIER_PRODUCT_* env değişkenleriyle veya direkt bu dosyada yönetilir.
// Her paket için consultingArea ve features tanımlayın.

export const PACKAGE_DEFINITIONS = {
  'danismanlik-test': {
    name: 'Dijital Strateji Danışmanlığı',
    consultingArea: 'consulting',
    features: [
      'Dijital strateji danışmanlığı',
      'Aylık yol haritası',
      'KPI ve aksiyon planı',
      'Danışmanlık notları',
    ],
    durationDays: 30,
    price: 0,
    publicFree: true,
    access: {
      consultingPlan: 'fractional_new_media_director',
      consultingStatus: 'active',
      hasConsultingPanelAccess: true,
    },
  },
  'kade-organizasyon-kiti-test': {
    name: 'Kade Organizasyon Kiti',
    consultingArea: null,
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
      hasConsultingPanelAccess: true,
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
      hasConsultingPanelAccess: true,
      hasOrganizationKitAccess: true,
      hasKadeKitBusinessAccess: true,
      hasKadeRadarAccess: true,
      hasAIKnowledgeCenterAccess: true,
    },
  },

  // ===== KADE KIT — ContentAI Studio (big kit) + Kade Organizasyon Kiti birleşik =====
  // Her paketin tek-seferlik (lifetime) ve aylık (monthly) iki referansı var (hibrit satış).
  'kade-kit-baslangic-lifetime': {
    name: 'KADE KIT Başlangıç', tier: 'baslangic', billing: 'lifetime',
    consultingArea: null,
    features: [
      'ContentAI Studio — 8 AI aracı (Başlık, Açıklama, Hook, Script, Hashtag, Viral Skor, İçerik Dönüştür, Takvim)',
      'Kade Organizasyon Kiti (temel)',
      'Kendi API anahtarınla sınırsız kullanım',
      'Masaüstü + web erişimi',
    ],
    durationDays: null,
    price: 1990,
    access: { hasBigKitAccess: true, hasOrganizationKitAccess: true, maxSeats: 1 },
  },
  'kade-kit-baslangic-monthly': {
    name: 'KADE KIT Başlangıç (Aylık)', tier: 'baslangic', billing: 'monthly',
    consultingArea: null,
    features: [
      'ContentAI Studio — 8 AI aracı',
      'Kade Organizasyon Kiti (temel)',
      'Kendi API anahtarınla sınırsız kullanım',
    ],
    durationDays: 30,
    price: 299,
    access: { hasBigKitAccess: true, hasOrganizationKitAccess: true, maxSeats: 1 },
  },
  'kade-kit-pro-lifetime': {
    name: 'KADE KIT Pro', tier: 'pro', billing: 'lifetime',
    consultingArea: 'consulting',
    features: [
      'ContentAI Studio — 8 AI aracı',
      'Kade Organizasyon Kiti (tam)',
      'Qwen AI Video üretim aracı',
      'Fractional New Media Director planı',
      'Ömürlük güncellemeler',
    ],
    durationDays: null,
    price: 3990,
    access: {
      hasBigKitAccess: true, hasOrganizationKitAccess: true, hasQwenVideoAccess: true,
      hasConsultingPanelAccess: true, consultingPlan: 'fractional_new_media_director', consultingStatus: 'active', maxSeats: 1,
    },
  },
  'kade-kit-pro-monthly': {
    name: 'KADE KIT Pro (Aylık)', tier: 'pro', billing: 'monthly',
    consultingArea: 'consulting',
    features: [
      'ContentAI Studio — 8 AI aracı',
      'Kade Organizasyon Kiti (tam)',
      'Qwen AI Video üretim aracı',
      'Fractional New Media Director planı',
    ],
    durationDays: 30,
    price: 599,
    access: {
      hasBigKitAccess: true, hasOrganizationKitAccess: true, hasQwenVideoAccess: true,
      hasConsultingPanelAccess: true, consultingPlan: 'fractional_new_media_director', consultingStatus: 'active', maxSeats: 1,
    },
  },
  'kade-kit-ajans-lifetime': {
    name: 'KADE KIT Ajans', tier: 'ajans', billing: 'lifetime',
    consultingArea: 'consulting',
    features: [
      'KADE KIT Pro içeriğinin tamamı',
      '5 kullanıcı koltuğu',
      'Öncelikli destek',
      '1 saat kurulum danışmanlığı',
    ],
    durationDays: null,
    price: 7990,
    access: {
      hasBigKitAccess: true, hasOrganizationKitAccess: true, hasQwenVideoAccess: true,
      hasConsultingPanelAccess: true, hasKadeKitBusinessAccess: true,
      consultingPlan: 'fractional_new_media_director', consultingStatus: 'active', maxSeats: 5,
    },
  },
  'kade-kit-ajans-monthly': {
    name: 'KADE KIT Ajans (Aylık)', tier: 'ajans', billing: 'monthly',
    consultingArea: 'consulting',
    features: [
      'KADE KIT Pro içeriğinin tamamı',
      '5 kullanıcı koltuğu',
      'Öncelikli destek',
    ],
    durationDays: 30,
    price: 1290,
    access: {
      hasBigKitAccess: true, hasOrganizationKitAccess: true, hasQwenVideoAccess: true,
      hasConsultingPanelAccess: true, hasKadeKitBusinessAccess: true,
      consultingPlan: 'fractional_new_media_director', consultingStatus: 'active', maxSeats: 5,
    },
  },
}

const DEFAULT_PACKAGE_ENTITLEMENTS = {
  role: 'customer',
  consultingPlan: null,
  consultingStatus: 'inactive',
  hasConsultingPanelAccess: false,
  hasOrganizationKitAccess: false,
  hasKadeKitBusinessAccess: false,
  hasKadeRadarAccess: false,
  hasAIKnowledgeCenterAccess: false,
  // KADE KIT (big kit) entitlement'ları
  hasBigKitAccess: false,
  hasQwenVideoAccess: false,
  maxSeats: 1,
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
