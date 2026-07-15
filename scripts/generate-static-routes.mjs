import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const BASE = 'https://www.kademedia.com.tr'
const DIST = new URL('../dist/', import.meta.url)
const template = await readFile(new URL('app.html', DIST), 'utf8')

const routes = [
  ['/portfolio', 'Portfolyo | Kade Media', 'Onaylı proje detayları müşteri izniyle yayınlanır.', true],
  ['/partnerler', 'İş Ortakları | Kade Media', 'Doğrulanmış Kade Media iş ortaklığı bilgileri.', true],
  ['/blog', 'İçgörüler | Kade Media', 'Kaynağı kontrol edilmiş Kade Media yazıları.', true],
  ['/teklif-al', 'Teklif Al | Kade Media', 'Hizmet kapsamınızı paylaşın ve yazılı teklif isteyin.', false],
  ['/referanslar', 'Müşteri Referansları | Kade Media', 'Doğrulanmış müşteri referansları.', true],
  ['/basari-hikayeleri', 'Vaka Çalışmaları | Kade Media', 'Doğrulanmış vaka çalışmaları.', true],
  ['/kvkk', 'KVKK Aydınlatma Metni | Kade Media', 'Kişisel verilerin işlenmesine ilişkin bilgilendirme.', false],
  ['/gizlilik', 'Gizlilik Politikası | Kade Media', 'Kade Media gizlilik politikası.', false],
  ['/cerez-politikasi', 'Çerez Politikası | Kade Media', 'Kade Media çerez politikası.', false],
  ['/giris', 'Giriş | Kade Media', 'Müşteri hesabı giriş sayfası.', true],
  ['/musteri-panel', 'Müşteri Paneli | Kade Media', 'Korumalı müşteri alanı.', true],
  ['/admin', 'Yönetim Paneli | Kade Media', 'Korumalı yönetim alanı.', true],
  ['/organizasyon-kiti', 'Kade Organizasyon Kiti', 'Korumalı müşteri çalışma alanı.', true],
  ['/organizasyon-kiti/plan/fractional-new-media-director', 'Danışmanlık Planı | Kade Media', 'Korumalı müşteri çalışma alanı.', true],
  ['/kade-kit-business', 'Kade Kit Business | Kade Media', 'Korumalı müşteri çalışma alanı.', true],
  ['/proje-takip', 'Proje Takip | Kade Media', 'Korumalı müşteri çalışma alanı.', true],
  ['/links', 'Kade Media Bağlantıları', 'Kade Media bağlantı sayfası.', true],
  ['/hizmetler/sosyal-medya-yonetimi', 'Sosyal Medya Yönetimi | Kade Media', 'Sosyal medya yönetimi hizmet kapsamı.', false],
  ['/hizmetler/icerik-uretimi', 'İçerik Üretimi | Kade Media', 'İçerik üretimi hizmet kapsamı.', false],
  ['/hizmetler/reklam-yonetimi', 'Reklam Yönetimi | Kade Media', 'Dijital reklam yönetimi hizmet kapsamı.', false],
  ['/hizmetler/video-produksiyon', 'Video Prodüksiyon | Kade Media', 'Video prodüksiyon hizmet kapsamı.', false],
  ['/hizmetler/strateji-danismanlik', 'Strateji ve Danışmanlık | Kade Media', 'Dijital strateji danışmanlığı hizmet kapsamı.', false],
  ['/hizmetler/web-sitesi-tasarimi', 'Web Sitesi Tasarımı | Kade Media', 'Web sitesi tasarım ve geliştirme hizmet kapsamı.', false],
]

const escapeHtml = (value) => String(value).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')

function render(route, title, description, noindex) {
  const canonical = `${BASE}${route}`
  let html = template
    .replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(title)}</title>`)
    .replace(/<meta name="description" content="[^"]*"\s*\/>/, `<meta name="description" content="${escapeHtml(description)}" />`)
    .replace(/<meta name="robots" content="[^"]*"\s*\/>/, `<meta name="robots" content="${noindex ? 'noindex, nofollow' : 'index, follow'}" />`)
    .replace(/<link rel="canonical" href="[^"]*"\s*\/>/, `<link rel="canonical" href="${canonical}" />`)
    .replace(/<meta property="og:title" content="[^"]*"\s*\/>/, `<meta property="og:title" content="${escapeHtml(title)}" />`)
    .replace(/<meta property="og:description" content="[^"]*"\s*\/>/, `<meta property="og:description" content="${escapeHtml(description)}" />`)
    .replace(/<meta property="og:url" content="[^"]*"\s*\/>/, `<meta property="og:url" content="${canonical}" />`)
    .replace(/<meta name="twitter:title" content="[^"]*"\s*\/>/, `<meta name="twitter:title" content="${escapeHtml(title)}" />`)
    .replace(/<meta name="twitter:description" content="[^"]*"\s*\/>/, `<meta name="twitter:description" content="${escapeHtml(description)}" />`)
    .replace(/\s*<meta name="twitter:site" content="[^"]*"\s*\/>/, '')
  return html
}

for (const [route, title, description, noindex] of routes) {
  const directory = join(DIST.pathname, route.slice(1))
  await mkdir(directory, { recursive: true })
  await writeFile(join(directory, 'index.html'), render(route, title, description, noindex))
}

console.log(`Generated ${routes.length} route entry files.`)
