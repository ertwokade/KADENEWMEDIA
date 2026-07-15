import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const BASE = 'https://kadenewmedia.com'
const DIST = new URL('../dist/', import.meta.url)
const template = await readFile(new URL('app.html', DIST), 'utf8')

const routes = [
  ['/hakkimizda', 'Kade Media Hakkında | New Media Ajansı İstanbul', 'Kade Media; Kade New Media, Kademedia ve Kadenewmedia adlarıyla da aranan İstanbul merkezli new media ve dijital pazarlama ajansıdır.', false],
  ['/hizmetler', 'New Media ve Dijital Medya Hizmetleri | Kade Media', 'Kade Media’nın sosyal medya yönetimi, içerik üretimi, dijital reklam, video prodüksiyon, new media stratejisi ve web tasarımı hizmetleri.', false],
  ['/new-media-ajansi', 'New Media Ajansı İstanbul | Kade Media', 'İstanbul merkezli Kade Media ile new media stratejisi, sosyal medya yönetimi, içerik üretimi, dijital reklam, video prodüksiyon ve web tasarımı.', false],
  ['/iletisim', 'Kade Media İletişim | Projenizi Paylaşın', 'Sosyal medya, dijital pazarlama, içerik üretimi veya web projeniz için Kade Media ile iletişime geçin ve ihtiyacınızı paylaşın.', false],
  ['/paketler', 'Sosyal Medya Hizmet Kapsamları | Kade Media', 'Düzenli içerik, reklam yönetimi ve proje bazlı prodüksiyon ihtiyaçlarına göre şekillenen Kade Media hizmet kapsamlarını inceleyin.', false],
  ['/sss', 'Dijital Pazarlama Sık Sorulan Sorular | Kade Media', 'Kade Media’nın hizmetleri, teklif süreci, çalışma biçimi, teslimat ve iletişim adımları hakkında sık sorulan soruların yanıtlarını inceleyin.', false],
  ['/ekip', 'Kade Media Ekibi | İstanbul Dijital Pazarlama Ajansı', 'Kade Media’nın sosyal medya, içerik üretimi, reklam ve dijital projelerde birlikte çalışan İstanbul merkezli ekibiyle tanışın.', false],
  ['/kariyer', 'Kade Media Kariyer | Genel Başvuru Bilgileri', 'Kade Media’daki kariyer olanakları ve genel başvuru süreci hakkında bilgi alın; uzmanlık alanınızı ve çalışmalarınızı bizimle paylaşın.', false],
  ['/tesekkur', 'Talebiniz Alındı | Kade Media', 'Talebinizin kaydedildiğine ilişkin bilgilendirme.', true],
  ['/portfolio', 'Portfolyo | Kade Media', 'Onaylı proje detayları müşteri izniyle yayınlanır.', true],
  ['/partnerler', 'İş Ortakları | Kade Media', 'Doğrulanmış Kade Media iş ortaklığı bilgileri.', true],
  ['/blog', 'İçgörüler | Kade Media', 'Kaynağı kontrol edilmiş Kade Media yazıları.', true],
  ['/teklif-al', 'Dijital Pazarlama Teklifi Al | Kade Media', 'İhtiyacınız olan sosyal medya, içerik, reklam, video veya web hizmetlerini seçin; projeniz için Kade Media’dan yazılı teklif isteyin.', false],
  ['/referanslar', 'Müşteri Referansları | Kade Media', 'Doğrulanmış müşteri referansları.', true],
  ['/basari-hikayeleri', 'Vaka Çalışmaları | Kade Media', 'Doğrulanmış vaka çalışmaları.', true],
  ['/kvkk', 'KVKK Aydınlatma Metni | Kade Media', 'Kade Media’nın kişisel verileri hangi amaçlarla ve hukuki sebeplerle işlediğini açıklayan KVKK aydınlatma metnini inceleyin.', false],
  ['/gizlilik', 'Gizlilik Politikası | Kade Media', 'Kade Media web sitesinde kişisel verilerin nasıl toplandığı, kullanıldığı, korunduğu ve hangi haklara sahip olduğunuz hakkında bilgi alın.', false],
  ['/cerez-politikasi', 'Çerez Politikası | Kade Media', 'Kade Media web sitesinde kullanılan çerez türlerini, kullanım amaçlarını ve çerez tercihlerinizi nasıl yönetebileceğinizi öğrenin.', false],
  ['/giris', 'Giriş | Kade Media', 'Müşteri hesabı giriş sayfası.', true],
  ['/musteri-panel', 'Müşteri Paneli | Kade Media', 'Korumalı müşteri alanı.', true],
  ['/admin', 'Yönetim Paneli | Kade Media', 'Korumalı yönetim alanı.', true],
  ['/organizasyon-kiti', 'Kade Organizasyon Kiti', 'Korumalı müşteri çalışma alanı.', true],
  ['/organizasyon-kiti/plan/fractional-new-media-director', 'Danışmanlık Planı | Kade Media', 'Korumalı müşteri çalışma alanı.', true],
  ['/organizasyon-kiti/medya-yol-haritasi', 'Medya Yol Haritası | Kade Media', 'Korumalı müşteri çalışma alanı.', true],
  ['/organizasyon-kiti/yonetim-toplantilari', 'Yönetim Toplantıları | Kade Media', 'Korumalı müşteri çalışma alanı.', true],
  ['/organizasyon-kiti/ekip-surecler', 'Ekip ve Süreçler | Kade Media', 'Korumalı müşteri çalışma alanı.', true],
  ['/organizasyon-kiti/stratejik-kararlar', 'Stratejik Kararlar | Kade Media', 'Korumalı müşteri çalışma alanı.', true],
  ['/organizasyon-kiti/notlar', 'Danışmanlık Notları | Kade Media', 'Korumalı müşteri çalışma alanı.', true],
  ['/kade-kit-business', 'Kade Kit Business | Kade Media', 'Korumalı müşteri çalışma alanı.', true],
  ['/proje-takip', 'Proje Takip | Kade Media', 'Korumalı müşteri çalışma alanı.', true],
  ['/hizmetler/sosyal-medya-yonetimi', 'Sosyal Medya Yönetimi | Kade Media', 'Instagram, Facebook, TikTok ve LinkedIn için içerik planlama, yayın takvimi, topluluk yönetimi, raporlama ve marka iletişimi hizmetleri.', false],
  ['/hizmetler/icerik-uretimi', 'İçerik Üretimi | Kade Media', 'Markanıza özel görsel, video ve metin içerikleri; içerik stratejisi, grafik tasarım, metin yazımı, fotoğraf çekimi ve sosyal medya tasarımları.', false],
  ['/hizmetler/reklam-yonetimi', 'Dijital Reklam Yönetimi | Kade Media', 'Meta, Google Ads ve TikTok Ads kampanyaları için planlama, hedefleme, A/B testleri, yeniden pazarlama ve performans analizi hizmetleri.', false],
  ['/hizmetler/video-produksiyon', 'Video Prodüksiyon | Kade Media', 'Reels, TikTok, YouTube ve reklam projeleri için senaryo, çekim, kurgu, motion graphics ve proje kapsamına göre prodüksiyon hizmetleri.', false],
  ['/hizmetler/strateji-danismanlik', 'Dijital Strateji ve Danışmanlık | Kade Media', 'Marka ve rakip analizi, hedef ve KPI belirleme, dijital pazarlama yol haritası, büyüme planı ve strateji danışmanlığı hizmetleri.', false],
  ['/hizmetler/web-sitesi-tasarimi', 'Web Sitesi Tasarımı ve Geliştirme | Kade Media', 'Markanıza özel mobil uyumlu web sitesi tasarımı, UI/UX, geliştirme, CMS ve e-ticaret entegrasyonu ile performans iyileştirme hizmetleri.', false],
]

const escapeHtml = (value) => String(value).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
const serializeJsonLd = (value) => JSON.stringify(value).replaceAll('<', '\\u003c')

function structuredData(route, title, description, noindex) {
  if (noindex) return ''

  const pageName = title.split(' | ')[0]
  const isServiceDetail = route.startsWith('/hizmetler/')
  const hasServiceSchema = isServiceDetail || route === '/new-media-ajansi'
  const items = [
    { '@type': 'ListItem', position: 1, name: 'Ana Sayfa', item: `${BASE}/` },
  ]

  if (isServiceDetail) {
    items.push({ '@type': 'ListItem', position: 2, name: 'Hizmetler', item: `${BASE}/hizmetler` })
  }

  items.push({ '@type': 'ListItem', position: items.length + 1, name: pageName, item: `${BASE}${route}` })

  const schemas = [{
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items,
  }]

  if (hasServiceSchema) {
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'Service',
      name: pageName,
      description,
      url: `${BASE}${route}`,
      provider: { '@type': 'Organization', name: 'Kade Media', url: `${BASE}/` },
      areaServed: { '@type': 'Country', name: 'Türkiye' },
    })
  }

  return schemas.map((schema) => {
    const id = schema['@type'] === 'Service'
      ? 'schema-service'
      : isServiceDetail ? 'jsonld-breadcrumb' : 'schema-breadcrumb'
    return `<script id="${id}" type="application/ld+json">${serializeJsonLd(schema)}</script>`
  }).join('\n    ')
}

function render(route, title, description, noindex) {
  const canonical = `${BASE}${route}`
  const schemaMarkup = structuredData(route, title, description, noindex)
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
  if (schemaMarkup) html = html.replace('</head>', `    ${schemaMarkup}\n  </head>`)
  return html
}

for (const [route, title, description, noindex] of routes) {
  const directory = join(DIST.pathname, route.slice(1))
  await mkdir(directory, { recursive: true })
  await writeFile(join(directory, 'index.html'), render(route, title, description, noindex))
}

console.log(`Generated ${routes.length} route entry files.`)
