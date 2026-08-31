/**
 * Çalışma alanı adresi (slug).
 *
 * Her kullanıcının paneli kendi adresinde açılır: /kadexai/<slug>/dashboard/...
 * Hesap sahibinin alanı `kade`.
 *
 * ÖNEMLİ: Slug bir yetki değil, yalnızca adres. Yetkilendirme her zaman
 * oturumdan yapılır; adresteki slug'a bakarak kimseye erişim verilmez. Proxy
 * katmanı oturumdaki kullanıcının slug'ıyla adresteki slug'ı karşılaştırır ve
 * eşleşmiyorsa kullanıcıyı kendi alanına gönderir.
 */

import { withBasePath } from '@/lib/appConfig'

export const OWNER_WORKSPACE_SLUG = 'kade'

/** Panelin kendi rotalarıyla çakışacağı için alan adı olarak kullanılamaz. */
const RESERVED_SLUGS = new Set([
  // app/kadexai altındaki gerçek rotalar
  'api', 'auth', 'dashboard', 'legal', 'login', 'logout', 'onboarding',
  'reset-password', 'robots.txt', 'sitemap.xml', 'favicon.ico',
  // public/kadexai altındaki statik üst düzey klasörler
  'brand', 'downloads', 'ffmpeg', 'icons', 'manifest.json', 'operations-kit',
  'sw.js', 'next.svg', 'vercel.svg', 'file.svg', 'globe.svg', 'window.svg',
  // ileride çakışmaması için ayrılanlar
  '_next', 'admin', 'assets', 'demo', 'kadeai', 'kadexai', 'public',
  'settings', 'static', 'workspace', 'hesap', 'panel',
])

// En az 2, en çok 32 karakter; başta/sonda tire yok. slugifyWorkspaceName ile
// aynı alt sınır, aksi halde üretilemeyen bir adres geçerli sayılıyordu.
const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]{0,30}[a-z0-9]$/

/** Adres olarak kullanılabilir mi? Proxy ve API doğrulaması bunu paylaşır. */
export function isValidWorkspaceSlug(value: string): boolean {
  return SLUG_PATTERN.test(value) && !RESERVED_SLUGS.has(value)
}

const TR_MAP: Record<string, string> = {
  ç: 'c', ğ: 'g', ı: 'i', ö: 'o', ş: 's', ü: 'u',
  Ç: 'c', Ğ: 'g', İ: 'i', I: 'i', Ö: 'o', Ş: 's', Ü: 'u',
}

/**
 * Görünen ad ya da e-postadan adres üretir. Türkçe harfler karşılıklarına
 * çevrilir; `İ` küçültülünce `i̇` (nokta ayrı bir karakter) olduğu için
 * toLowerCase'e bırakılmaz.
 */
export function slugifyWorkspaceName(input: string): string {
  const mapped = [...input].map((ch) => TR_MAP[ch] ?? ch).join('')
  const base = mapped
    .toLocaleLowerCase('en-US')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 32)
    .replace(/-+$/g, '')

  if (!base || base.length < 2) return ''
  return base
}

/**
 * Çakışma ya da geçersizlik durumunda kullanılacak yedek adres.
 * Kullanıcı kimliğinden türetildiği için tahmin edilebilir bir sıra oluşmaz.
 */
export function fallbackWorkspaceSlug(userId: string): string {
  return `alan-${userId.replace(/-/g, '').slice(0, 8)}`
}

/** Aday adresi geçerli hale getirir; olmuyorsa kimlikten yedek üretir. */
export function normalizeWorkspaceSlug(candidate: string, userId: string): string {
  const slug = slugifyWorkspaceName(candidate)
  if (slug && isValidWorkspaceSlug(slug)) return slug
  return fallbackWorkspaceSlug(userId)
}

export type SlugUserLike = {
  id: string
  email?: string | null
  user_metadata?: Record<string, unknown> | null
}

/** Metadata'da saklanan adres anahtarı. Çakışma yüzünden addan türetilenden
 *  farklı bir adres verildiyse burada tutulur ve türetmeye üstün gelir. */
export const WORKSPACE_SLUG_METADATA_KEY = 'workspace_slug'

function displayNameOf(user: SlugUserLike): string {
  const meta = user.user_metadata ?? {}
  const named = ['display_name', 'full_name', 'name']
    .map((key) => meta[key])
    .find((value): value is string => typeof value === 'string' && value.trim().length > 0)
  return named ?? user.email?.split('@')[0] ?? ''
}

/**
 * Kullanıcının panel adresini veritabanına gitmeden belirler; proxy her
 * istekte bunu çağırdığı için sorgu yapmaması gerekiyor.
 *
 * Sıra: sahip sabit `kade` → metadata'daki adres → addan türetilen →
 * kimlikten yedek.
 *
 * Yine hatırlatma: bu bir adres hesabıdır, yetki kararı değildir.
 */
export function workspaceSlugForUser(user: SlugUserLike, sahip: boolean): string {
  if (sahip) return OWNER_WORKSPACE_SLUG

  const kayitli = user.user_metadata?.[WORKSPACE_SLUG_METADATA_KEY]
  if (typeof kayitli === 'string' && isValidWorkspaceSlug(kayitli) && kayitli !== OWNER_WORKSPACE_SLUG) {
    return kayitli
  }

  const aday = slugifyWorkspaceName(displayNameOf(user))
  if (aday && isValidWorkspaceSlug(aday) && aday !== OWNER_WORKSPACE_SLUG) return aday

  return fallbackWorkspaceSlug(user.id)
}

/**
 * Adresin başındaki çalışma alanı bölümünü ayırır.
 * `/kade/dashboard/title` → { slug: 'kade', kalan: '/dashboard/title' }
 * Alan bölümü yoksa slug null döner ve yol olduğu gibi kalır.
 */
export function splitWorkspacePath(pathname: string): { slug: string | null; kalan: string } {
  const parca = pathname.split('/').filter(Boolean)
  if (parca.length === 0) return { slug: null, kalan: pathname || '/' }
  const ilk = parca[0]
  if (!isValidWorkspaceSlug(ilk)) return { slug: null, kalan: pathname }
  return { slug: ilk, kalan: `/${parca.slice(1).join('/')}` }
}

/**
 * Panel içi bağlantı üretir: /kadexai/<slug>/dashboard/...
 * Slug yoksa eski davranışa döner. Saf fonksiyon olduğu için hem sunucu
 * bileşenlerinden hem istemciden çağrılabilir.
 */
export function workspaceHref(path: string, slug: string | null): string {
  if (!path || /^https?:\/\//i.test(path) || path.startsWith('//') || path.startsWith('#')) {
    return path
  }
  if (!slug) return withBasePath(path)

  const normalized = path.startsWith('/') ? path : `/${path}`
  // Zaten bir alan adresi taşıyorsa iki kez eklenmesin.
  if (splitWorkspacePath(normalized).slug) return withBasePath(normalized)

  return withBasePath(`/${slug}${normalized}`)
}
