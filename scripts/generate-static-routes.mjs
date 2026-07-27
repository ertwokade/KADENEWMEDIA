import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'
import { FAQ_ITEMS } from '../src/data/faq.js'
import { translations } from '../src/i18n/translations.js'
import { SERVICES as NMA_SERVICES, PROCESS as NMA_PROCESS, FAQS as NMA_FAQS } from '../src/data/newMediaAgency.js'
import { PACKAGE_SCOPES, PACKAGE_FAQS } from '../src/data/packages.js'
import { SERVICE_DETAILS } from '../src/data/serviceDetails.js'

const tr = translations.tr

const BASE = 'https://kadenewmedia.com'
const DIST = fileURLToPath(new URL('../dist/', import.meta.url))
const template = await readFile(join(DIST, 'app.html'), 'utf8')

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
  ['/telif-haklari', 'Telif Hakları | Kade Media', 'Kade Media web sitesindeki içerik, görsel, video ve tasarımların telif hakları, kullanım koşulları ve izin süreçleri hakkında bilgi alın.', false],
  ['/giris', 'Çalışma Alanı Seçimi | Kade Media', 'Danışmanlık ve Content AI çalışma alanlarından kullanmak istediğinizi seçin.', true],
  ['/giris/danismanlik', 'Danışmanlık Girişi | Kade Media', 'Kade Media danışmanlık ve müşteri hesabı giriş sayfası.', true],
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
const protectedRoutes = new Set([
  '/admin', '/musteri-panel', '/organizasyon-kiti',
  '/organizasyon-kiti/plan/fractional-new-media-director',
  '/organizasyon-kiti/medya-yol-haritasi', '/organizasyon-kiti/yonetim-toplantilari',
  '/organizasyon-kiti/ekip-surecler', '/organizasyon-kiti/stratejik-kararlar',
  '/organizasyon-kiti/notlar', '/kade-kit-business', '/proje-takip',
])

function faqSection(items, heading = 'Sık Sorulan Sorular') {
  return `
      <h2>${escapeHtml(heading)}</h2>
      ${items.map((item) => `<h3>${escapeHtml(item.soru)}</h3>\n      <p>${escapeHtml(item.cevap)}</p>`).join('\n      ')}`
}

const packageFaqItems = PACKAGE_FAQS.map(({ tr: [soru, cevap] }) => ({ soru, cevap }))

function bulletList(items) {
  return `<ul>\n        ${items.map((item) => `<li>${escapeHtml(item)}</li>`).join('\n        ')}\n      </ul>`
}

function extraContent(route) {
  if (route === '/sss') return faqSection(FAQ_ITEMS)

  // Hizmet detayları ticari olarak en önemli sayfalar; ön-render çıktısında
  // yalnız H1 + tek paragraf kalması Google'ın ilk taramasında "thin content"
  // sinyali üretiyordu. Metin src/data/serviceDetails.js ile aynı kaynaktan gelir.
  if (route.startsWith('/hizmetler/')) {
    const detail = SERVICE_DETAILS[route.slice('/hizmetler/'.length)]
    if (!detail) return ''
    return `
      <h2>Bu hizmet hangi sorunu çözüyor?</h2>
      <p>${escapeHtml(detail.problemTr)}</p>
      <h2>Kapsam</h2>
      ${bulletList(detail.featuresTr)}
      <h2>Teslim edilenler</h2>
      ${bulletList(detail.deliverablesTr)}
      <h2>Diğer hizmetler</h2>
      <ul>
        ${Object.entries(SERVICE_DETAILS)
          .filter(([slug]) => slug !== route.slice('/hizmetler/'.length))
          .map(([slug, s]) => `<li><a href="/hizmetler/${slug}">${escapeHtml(s.titleTr)}</a></li>`)
          .join('\n        ')}
      </ul>`
  }

  if (route === '/hakkimizda') {
    return `
      <h2>${escapeHtml(tr.about.storyTitle)}</h2>
      <p>${escapeHtml(tr.about.storyP1)}</p>
      <p>${escapeHtml(tr.about.storyP2)}</p>
      <h2>Değerlerimiz</h2>
      ${['creativity', 'transparency', 'quality', 'passion', 'teamwork', 'reliability'].map((key) => `<h3>${escapeHtml(tr.about[key])}</h3>\n      <p>${escapeHtml(tr.about[`${key}Desc`])}</p>`).join('\n      ')}`
  }

  if (route === '/hizmetler') {
    return `
      <h2>Hizmetlerimiz</h2>
      ${NMA_SERVICES.map((s) => `<h3><a href="${s.to}">${escapeHtml(s.title)}</a></h3>\n      <p>${escapeHtml(s.description)}</p>`).join('\n      ')}`
  }

  if (route === '/paketler') {
    return `
      <h2>Hizmet Kapsamları</h2>
      ${PACKAGE_SCOPES.map((p) => `<h3>${escapeHtml(p.nameTr)}</h3>\n      <p>${escapeHtml(p.descTr)}</p>`).join('\n      ')}
      ${faqSection(packageFaqItems, 'Net Koşullar')}`
  }

  if (route === '/new-media-ajansi') {
    return `
      <h2>Yeni medya nedir?</h2>
      <p>New media; sosyal ağları, arama motorlarını, dijital reklamı, içerik formatlarını, videoyu ve web deneyimini birlikte kapsar. Kade Media bu alanları marka görünürlüğü, talep toplama ve sürdürülebilir iletişim hedefleri için ortak bir plan içinde yönetir.</p>
      <h2>Hizmetler</h2>
      ${NMA_SERVICES.map((s) => `<h3><a href="${s.to}">${escapeHtml(s.title)}</a></h3>\n      <p>${escapeHtml(s.description)}</p>`).join('\n      ')}
      <h2>Çalışma modeli</h2>
      ${NMA_PROCESS.map(([n, t, d]) => `<h3>${escapeHtml(n)}. ${escapeHtml(t)}</h3>\n      <p>${escapeHtml(d)}</p>`).join('\n      ')}
      ${faqSection(NMA_FAQS)}`
  }

  return ''
}

function staticFallback(route, title, description) {
  const pageName = title.split(' | ')[0]
  const protectedCopy = protectedRoutes.has(route)
    ? 'Bu alan yalnız yetkili kullanıcıların güvenli oturumuyla açılır.'
    : description
  return `<main data-static-route-fallback="${escapeHtml(route)}" style="max-width:880px;margin:0 auto;padding:48px 24px;font-family:Inter,system-ui,sans-serif;color:#17130a;background:#fbfaf4;line-height:1.6">
      <nav aria-label="Temel navigasyon"><a href="/">Ana sayfa</a> · <a href="/hizmetler">Hizmetler</a> · <a href="/paketler">Paketler</a> · <a href="/iletisim">İletişim</a></nav>
      <h1>${escapeHtml(pageName)}</h1>
      <p>${escapeHtml(protectedCopy)}</p>
      ${protectedRoutes.has(route) ? '<p><a href="/giris">Güvenli giriş ekranına dön</a></p>' : '<p><a href="/teklif-al">Projeniz için teklif isteyin</a></p>'}
      ${extraContent(route)}
    </main>`
}

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

  const faqSources = { '/sss': FAQ_ITEMS, '/paketler': packageFaqItems, '/new-media-ajansi': NMA_FAQS }
  if (faqSources[route]) {
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqSources[route].map((item) => ({
        '@type': 'Question',
        name: item.soru,
        acceptedAnswer: { '@type': 'Answer', text: item.cevap },
      })),
    })
  }

  const schemaIds = { Service: 'schema-service', FAQPage: 'schema-faq' }
  return schemas.map((schema) => {
    const id = schemaIds[schema['@type']] || (isServiceDetail ? 'jsonld-breadcrumb' : 'schema-breadcrumb')
    return `<script id="${id}" type="application/ld+json">${serializeJsonLd(schema)}</script>`
  }).join('\n    ')
}

// Bir replace hedefi şablonda bulunamazsa sessizce atlanması, canonical/robots
// gibi kritik etiketlerin fark edilmeden kaybolmasına yol açar. Bu yüzden
// eşleşmeyen her zorunlu değişim build'i düşürür.
function replaceRequired(html, pattern, replacement, label) {
  if (!pattern.test(html)) {
    throw new Error(`generate-static-routes: şablonda "${label}" bulunamadı — index.html değişmiş olabilir.`)
  }
  // Fonksiyon formu: başlık/açıklama metinlerindeki "$&", "$1" gibi diziler
  // replace tarafından özel desen olarak yorumlanmasın.
  return html.replace(pattern, () => replacement)
}

function render(route, title, description, noindex) {
  const canonical = `${BASE}${route}`
  const schemaMarkup = structuredData(route, title, description, noindex)
  let html = template
  html = replaceRequired(html, /<title>[^<]*<\/title>/, `<title>${escapeHtml(title)}</title>`, 'title')
  html = replaceRequired(html, /<meta name="description" content="[^"]*"\s*\/>/, `<meta name="description" content="${escapeHtml(description)}" />`, 'description')
  // `nofollow` yerine `follow`: bu sayfalar indekslenmesin ama üzerlerindeki
  // bağlantılar (ör. /partnerler -> /partnerler/:id) taranabilir kalsın.
  html = replaceRequired(html, /<meta name="robots" content="[^"]*"\s*\/>/, `<meta name="robots" content="${noindex ? 'noindex, follow' : 'index, follow'}" />`, 'robots')
  html = replaceRequired(html, /<meta property="og:title" content="[^"]*"\s*\/>/, `<meta property="og:title" content="${escapeHtml(title)}" />`, 'og:title')
  html = replaceRequired(html, /<meta property="og:description" content="[^"]*"\s*\/>/, `<meta property="og:description" content="${escapeHtml(description)}" />`, 'og:description')
  html = replaceRequired(html, /<meta name="twitter:title" content="[^"]*"\s*\/>/, `<meta name="twitter:title" content="${escapeHtml(title)}" />`, 'twitter:title')
  html = replaceRequired(html, /<meta name="twitter:description" content="[^"]*"\s*\/>/, `<meta name="twitter:description" content="${escapeHtml(description)}" />`, 'twitter:description')
  html = replaceRequired(html, /<div id="root"><\/div>/, `<div id="root">${staticFallback(route, title, description)}</div>`, 'root mount')
  html = html
    .replace(/\s*<meta name="twitter:site" content="[^"]*"\s*\/>/, '')
    .replace(/\s*<noscript>[\s\S]*?<\/noscript>/, '')

  // canonical + og:url şablonda sabit tanımlı değil (bkz. index.html yorumu);
  // her rota için doğru mutlak URL ile buradan enjekte edilir.
  const headTags = [
    `<link rel="canonical" href="${canonical}" />`,
    `<meta property="og:url" content="${canonical}" />`,
    schemaMarkup,
  ].filter(Boolean).join('\n    ')

  return replaceRequired(html, /<\/head>/, `    ${headTags}\n  </head>`, '</head>')
}

for (const [route, title, description, noindex] of routes) {
  const directory = join(DIST, route.slice(1))
  await mkdir(directory, { recursive: true })
  await writeFile(join(directory, 'index.html'), render(route, title, description, noindex))
}

console.log(`Generated ${routes.length} route entry files.`)
