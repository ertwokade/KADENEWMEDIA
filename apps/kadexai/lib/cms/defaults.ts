/**
 * CMS varsayılanları (§25).
 *
 * Bunlar kodda kalır ve HER ZAMAN geçerli bir içerik kümesi üretir. Veritabanı
 * override'ı bunların üzerine biner; tablo boşsa veya okunamazsa sayfa yine
 * eksiksiz görünür. Yeni bir alan eklerken önce buraya varsayılanını yaz.
 */

export interface CtaContent {
  label: string
  href: string
}

export interface TitledText {
  title: string
  text: string
}

export interface FaqItem {
  question: string
  answer: string
}

export interface DemoPageContent {
  eyebrow: string
  title: string
  description: string
  panelTitle: string
  panelFieldLabel: string
  panelRunLabel: string
  panelRunningLabel: string
  panelLimitNote: string
  ctas: CtaContent[]
  resultsTitle: string
  results: TitledText[]
  featuresTitle: string
  features: TitledText[]
  faq: FaqItem[]
  seo: {
    title: string
    description: string
    ogTitle: string
    ogDescription: string
  }
}

export const DEMO_CONTENT_KEY = 'kadexai-demo'

export const DEMO_CONTENT_DEFAULTS: DemoPageContent = {
  eyebrow: 'KadexAI interaktif demo',
  title: 'İçerik verisini eyleme dönüştüren AI çalışma alanı.',
  description: 'Sosyal Medya Analizcisi’nin kanıta dayalı örnek akışını dene. Bu demo gerçek hesap verisi çekmez, metrik uydurmaz ve ücretli AI API’si tüketmez.',
  panelTitle: 'Sosyal Medya Analizcisi',
  panelFieldLabel: 'Marka / içerik odağı',
  panelRunLabel: 'Örnek analizi çalıştır',
  panelRunningLabel: 'Kanıtlar analiz ediliyor…',
  panelLimitNote: 'Tarayıcı başına günde en fazla 3 örnek.',
  ctas: [
    { label: 'KadexAI’yi Dene', href: '/kadexai/login' },
    { label: 'Planları İncele', href: '/paketler' },
    { label: 'Teklif Al', href: '/teklif-al' },
  ],
  resultsTitle: 'Örnek analiz sonucu',
  results: [
    { title: 'Kanıt kapsamı', text: 'Bio, son içerik örnekleri ve hedef mevcut. Erişim/etkileşim metrikleri olmadığı için performans oranı hesaplanmadı.' },
    { title: 'Konumlandırma fırsatı', text: 'AI ve yeni medya uzmanlığını tek cümlede tanımlayan, sonucu öne çıkaran bir profil vaadi kullan.' },
    { title: 'İçerik sistemi', text: 'Haftada 2 öğretici kısa video, 1 vaka analizi ve 1 sektör yorumu ile üç içerik sütununu test et.' },
    { title: 'Ölçüm planı', text: '30 gün boyunca erişim, kayıt, profil tıklaması ve nitelikli talebi içerik formatına göre kaydet.' },
  ],
  featuresTitle: 'KadexAI ne yapar?',
  features: [
    { title: 'Analiz', text: 'Sosyal medya, SEO, rakip ve içerik sinyallerini yapılandırır.' },
    { title: 'Üretim', text: 'Başlık, metin, video, görsel ve yayın planı araçlarını bir araya getirir.' },
    { title: 'Operasyon', text: 'İçerik takvimi, onay, raporlama ve güvenli araç akışlarını tek panelde toplar.' },
  ],
  faq: [
    {
      question: 'KadexAI nedir?',
      answer: 'KadexAI sosyal medya analizi, içerik üretimi, planlama ve yeni medya operasyon araçlarını tek panelde birleştiren Kade New Media ürünüdür.',
    },
    {
      question: 'Demo gerçek hesap verisi kullanır mı?',
      answer: 'Hayır. Kamuya açık demo yalnızca örnek veriyle çalışır; sosyal hesaplara bağlanmaz ve veri olmayan yerde metrik üretmez.',
    },
  ],
  seo: {
    title: 'KadexAI Demo | AI Sosyal Medya ve İçerik Platformu',
    description: 'KadexAI sosyal medya analizcisi, içerik üretimi ve yeni medya operasyon araçlarının kanıta dayalı interaktif demosunu deneyin.',
    ogTitle: 'KadexAI Demo | AI İçerik ve Sosyal Medya Platformu',
    ogDescription: 'Kanıta dayalı sosyal medya analiz akışını ücretsiz deneyin.',
  },
}

export const CONTENT_DEFAULTS = {
  [DEMO_CONTENT_KEY]: DEMO_CONTENT_DEFAULTS,
} as const

export type ContentKey = keyof typeof CONTENT_DEFAULTS

/**
 * Override'ı varsayılanın üzerine biner. Dizi alanları TAMAMEN değiştirilir
 * (kısmi birleştirme, sıralaması anlamlı listelerde beklenmedik sonuç verir);
 * nesne alanları alan alan birleşir.
 */
export function mergeContent<T>(defaults: T, override: unknown): T {
  if (!override || typeof override !== 'object' || Array.isArray(override)) return defaults
  const result = { ...(defaults as Record<string, unknown>) }
  for (const [key, value] of Object.entries(override as Record<string, unknown>)) {
    // Varsayılanda olmayan anahtarları görmezden gel: şemayı kod belirler.
    if (!(key in result)) continue
    const base = result[key]
    if (value === null || value === undefined) continue
    if (Array.isArray(base)) {
      if (Array.isArray(value)) result[key] = value
      continue
    }
    if (base && typeof base === 'object') {
      result[key] = mergeContent(base, value)
      continue
    }
    if (typeof value === typeof base) result[key] = value
  }
  return result as T
}
