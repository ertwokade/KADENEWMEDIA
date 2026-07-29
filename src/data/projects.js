/**
 * PORTFOLYO VERİ MODELİ
 *
 * Projeler admin panelinden yönetilir (`/api/content?section=portfolio`).
 * Bu dosya modelin şeklini, normalizasyonunu ve kategori listesini tanımlar;
 * public sayfalar ile admin ekranı aynı sözleşmeyi kullansın diye tek yerde
 * durur.
 *
 * Sahte proje verisi BİLEREK tanımlanmamıştır. Veri yoksa sayfalar boş
 * durum gösterir.
 *
 * Proje şekli:
 * {
 *   slug, title, client, year, category, excerpt, published, order,
 *   cover, coverAlt, emoji,
 *   summary: { problem, goal, approach, role },
 *   process:  [{ title, text }],
 *   media:    [{ type: 'image'|'video', src, poster, alt, layout }],
 *   results:  [{ label, value, note }],
 *   services: ['/hizmetler/...'],
 *   seo: { title, description, ogImage }
 * }
 */

/** Portfolyo kategorileri — filtre çubuğu ve admin seçim kutusu bunu kullanır. */
export const PROJECT_CATEGORIES = [
  'Sosyal Medya',
  'Dijital Reklam',
  'İçerik Üretimi',
  'Video Prodüksiyon',
  'Marka Tasarımı',
  'Web Tasarımı',
]

export const MEDIA_LAYOUTS = ['full', 'split', 'portrait', 'landscape']

/**
 * Kart türü — bir kaydın NE olduğunu açıkça söyler.
 *
 * Gerçek müşteri medyası ve yayın izni olmadan hiçbir kayıt "müşteri işi"
 * gibi gösterilmez. Yönetici, kaydı doğru türle işaretler; public taraf
 * bu etiketi kartın üstünde görünür biçimde basar.
 *
 *   client     → yayın izni alınmış gerçek müşteri projesi
 *   experiment → Kade'nin kendi denemesi/iç çalışması
 *   capability → müşteri işi değil; ne yapabildiğimizi anlatan kart
 */
export const PROJECT_KINDS = {
  client: 'Müşteri projesi',
  experiment: 'Kade Studio Deneyi',
  capability: 'Hizmet Kabiliyeti',
}

/** Bilinmeyen/boş tür güvenli tarafa düşer: müşteri işi SAYILMAZ. */
export function projectKind(value) {
  return Object.prototype.hasOwnProperty.call(PROJECT_KINDS, value) ? value : 'capability'
}

/** Türkçe karakterleri URL-güvenli karşılıklarına çevirir. */
export function slugify(value) {
  const map = { ı: 'i', İ: 'i', ğ: 'g', Ğ: 'g', ü: 'u', Ü: 'u', ş: 's', Ş: 's', ö: 'o', Ö: 'o', ç: 'c', Ç: 'c' }
  return String(value || '')
    .replace(/[ıİğĞüÜşŞöÖçÇ]/g, (ch) => map[ch] || ch)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

/** Tek bir kaydı public sayfaların beklediği şekle getirir. */
export function normalizeProject(raw) {
  if (!raw || typeof raw !== 'object') return null
  const title = str(raw.title)
  if (!title) return null

  return {
    slug: str(raw.slug) || slugify(title),
    title,
    client: str(raw.client),
    year: str(raw.year),
    category: str(raw.category) || PROJECT_CATEGORIES[0],
    // Tür belirtilmemişse "müşteri projesi" VARSAYILMAZ.
    kind: projectKind(raw.kind),
    excerpt: str(raw.excerpt),
    // Yayın durumu açıkça false değilse yayında sayılır (eski kayıtlarla uyum).
    published: raw.published !== false,
    order: Number.isFinite(Number(raw.order)) ? Number(raw.order) : 0,
    cover: str(raw.cover),
    coverAlt: str(raw.coverAlt),
    emoji: str(raw.emoji),
    summary: {
      problem: str(raw.summary?.problem),
      goal: str(raw.summary?.goal),
      approach: str(raw.summary?.approach),
      role: str(raw.summary?.role),
    },
    process: list(raw.process).map((step) => ({
      title: str(step?.title),
      text: str(step?.text),
    })).filter((step) => step.title || step.text),
    media: list(raw.media).map((item) => ({
      type: item?.type === 'video' ? 'video' : 'image',
      src: str(item?.src),
      poster: str(item?.poster),
      alt: str(item?.alt),
      layout: MEDIA_LAYOUTS.includes(item?.layout) ? item.layout : 'full',
    })).filter((item) => item.src),
    // Sonuç rakamları YALNIZCA girilmişse gösterilir; boşsa bölüm gizlenir.
    results: list(raw.results).map((result) => ({
      label: str(result?.label),
      value: str(result?.value),
      note: str(result?.note),
    })).filter((result) => result.label && result.value),
    services: list(raw.services).map(str).filter(Boolean),
    seo: {
      title: str(raw.seo?.title),
      description: str(raw.seo?.description),
      ogImage: str(raw.seo?.ogImage),
    },
  }
}

/** Kayıt listesini normalize eder, sıralar ve yinelenen slug'ları eler. */
export function normalizeProjects(items) {
  const seen = new Set()
  return list(items)
    .map(normalizeProject)
    .filter((project) => {
      if (!project || seen.has(project.slug)) return false
      seen.add(project.slug)
      return true
    })
    .sort((a, b) => (a.order - b.order) || String(b.year).localeCompare(String(a.year)))
}

/** Yalnız yayındaki projeler — public sayfalar ve sitemap bunu kullanır. */
export function publishedProjects(items) {
  return normalizeProjects(items).filter((project) => project.published)
}

/**
 * Bir projenin detay sayfası göstermeye yetecek içeriği var mı?
 * Yoksa listede karta tıklanabilir bağlantı verilmez — boş detay sayfası
 * açılmasın diye.
 */
export function hasDetailContent(project) {
  if (!project) return false
  const { summary, process, media, results } = project
  return Boolean(
    summary.problem || summary.goal || summary.approach || summary.role ||
    process.length || media.length || results.length,
  )
}

function str(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function list(value) {
  return Array.isArray(value) ? value : []
}

/**
 * Ana sayfada gösterilecek çalışmalar.
 *
 * Yalnızca YAYINDA olanlar alınır ve en fazla dört tanesi gösterilir:
 * ana sayfa bir portfolyo arşivi değil, giriş noktasıdır. Tam liste
 * /portfolio adresindedir.
 */
export function homeProjects(items, limit = 4) {
  return publishedProjects(items).slice(0, limit)
}
