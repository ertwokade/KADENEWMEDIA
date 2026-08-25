/* The Kade layer applied to every page of the clone: copy swaps plus the
   stylesheet/script injections. The dev server and the static build both call
   this, so what runs locally is byte-for-byte what ships. */

const COPY = [
  ['HAOQI©2026', 'Kade New Media | Dijital Pazarlama Ajansı'],
  ['Digital Product Designer &amp; Builder © 2026', 'Kade New Media — İstanbul merkezli sosyal medya ve dijital pazarlama ajansı.'],
  ['Digital Product Designer \\u0026 Builder © 2026', 'Kade New Media — İstanbul merkezli sosyal medya ve dijital pazarlama ajansı.'],
  ['>haoqi<', '>Kade<'],
  ['>.design<', '> New Media<'],
  ['>Work<', '>HİZMETLER<'],
  ['>Contact<', '>İLETİŞİM<'],
  ['>Design &amp;<', '>Sosyal Medya &amp;<'],
  ['>Engineering<', '>Dijital Pazarlama<'],
  ['>Thinking in systems. Designing with care.<', '>Markaları dijitalde büyütüyoruz.<'],
  ['>I bring<', '>Biz<'],
  ['>craft &amp; taste<', '>markanı<'],
  ['>to digital work<', '>büyütüyoruz<'],
  ["I&#x27;m Haoqi Wen, leading Design Engineering and AI exploration at ", 'Kade New Media; strateji, içerik, reklam ve prodüksiyonla markaları dijitalde büyütür. '],
  [', engineering, and AI at scale. Outside work, I build design tools for team efficiency.', ''],
  /* Footer: sunucu HTML'i ile bundle aynı metni üretmeli, yoksa hidrasyon
     uyuşmazlığı (React #418) çıkıyor — ikisi de aynı listeden besleniyor. */
  ['mailto:curiosity.wen@gmail.com', 'mailto:thekademedia@gmail.com'],
  ['<span>curiosity.wen@gmail.com</span>', '<span>thekademedia@gmail.com</span>'],
  /* Sahnedeki footer üç bağlantıyla geliyordu; beş hesabın tamamı burada
     gösterilsin diye iki bağlantı daha ekleniyor. Sunucu HTML'i ile bundle
     aynı listeden üretiliyor, aksi halde hidrasyon uyuşmuyor. */
  ['<a class="block before:absolute relative before:inset-0 p-2 lg:hover:before:border-l1 before:border-2 before:border-transparent active:before:border-l1 before:border-dotted uppercase before:content-[&#x27;&#x27;] before:transition-colors before:duration-200 cursor-pointer pointer-events-auto before:pointer-events-none" target="_blank" rel="noopener noreferrer" href="https://twitter.com/wenhaoqi"><span style="opacity:0"><span>Twitter/X</span></span></a>', '<a class="block before:absolute relative before:inset-0 p-2 lg:hover:before:border-l1 before:border-2 before:border-transparent active:before:border-l1 before:border-dotted uppercase before:content-[&#x27;&#x27;] before:transition-colors before:duration-200 cursor-pointer pointer-events-auto before:pointer-events-none" target="_blank" rel="noopener noreferrer" href="https://instagram.com/kadenewmedia"><span style="opacity:0"><span>Instagram</span></span></a>'],
  ['<a class="block before:absolute relative before:inset-0 p-2 lg:hover:before:border-l1 before:border-2 before:border-transparent active:before:border-l1 before:border-dotted uppercase before:content-[&#x27;&#x27;] before:transition-colors before:duration-200 cursor-pointer pointer-events-auto before:pointer-events-none" target="_blank" rel="noopener noreferrer" href="https://www.figma.com/@wenhaoqi"><span style="opacity:0"><span>Figma</span></span></a>', '<a class="block before:absolute relative before:inset-0 p-2 lg:hover:before:border-l1 before:border-2 before:border-transparent active:before:border-l1 before:border-dotted uppercase before:content-[&#x27;&#x27;] before:transition-colors before:duration-200 cursor-pointer pointer-events-auto before:pointer-events-none" target="_blank" rel="noopener noreferrer" href="https://tiktok.com/@kadenewmedia"><span style="opacity:0"><span>TikTok</span></span></a>'],
  ['<a class="block before:absolute relative before:inset-0 p-2 lg:hover:before:border-l1 before:border-2 before:border-transparent active:before:border-l1 before:border-dotted uppercase before:content-[&#x27;&#x27;] before:transition-colors before:duration-200 cursor-pointer pointer-events-auto before:pointer-events-none" target="_blank" rel="noopener noreferrer" href="https://github.com/wenhaoqiasd"><span style="opacity:0"><span>GitHub</span></span></a>', '<a class="block before:absolute relative before:inset-0 p-2 lg:hover:before:border-l1 before:border-2 before:border-transparent active:before:border-l1 before:border-dotted uppercase before:content-[&#x27;&#x27;] before:transition-colors before:duration-200 cursor-pointer pointer-events-auto before:pointer-events-none" target="_blank" rel="noopener noreferrer" href="https://www.youtube.com/@kadenewmedia"><span style="opacity:0"><span>YouTube</span></span></a><a class="block before:absolute relative before:inset-0 p-2 lg:hover:before:border-l1 before:border-2 before:border-transparent active:before:border-l1 before:border-dotted uppercase before:content-[&#x27;&#x27;] before:transition-colors before:duration-200 cursor-pointer pointer-events-auto before:pointer-events-none" target="_blank" rel="noopener noreferrer" href="https://x.com/kadenewmedia"><span style="opacity:0"><span>X</span></span></a><a class="block before:absolute relative before:inset-0 p-2 lg:hover:before:border-l1 before:border-2 before:border-transparent active:before:border-l1 before:border-dotted uppercase before:content-[&#x27;&#x27;] before:transition-colors before:duration-200 cursor-pointer pointer-events-auto before:pointer-events-none" target="_blank" rel="noopener noreferrer" href="https://www.linkedin.com/company/kadenewmedia"><span style="opacity:0"><span>LinkedIn</span></span></a>'],
  ['Haoqi (c) 2026', 'Kade New Media (c) 2026'],
  /* Footer başlığı ve kart etiketleri geç mount olduğu için DOM düzeltmesine
     yetişmiyordu; kaynağında çevriliyor. */
  ['text:"Let\'s"', 'text:"Hadi"'],
  ['text:"Create"', 'text:"birlikte"'],
  ['text:"Something"', 'text:"iş"'],
  ['text:"Extraordinary"', 'text:"üretelim"'],
  ['<span>Let&#x27;s</span>', '<span>Hadi</span>'],
  ['<span>Create</span>', '<span>birlikte</span>'],
  ['<span>Something</span>', '<span>iş</span>'],
  ['<span>Extraordinary</span>', '<span>üretelim</span>'],
  /* Giriş kapısı bundle'da kapatıldı; sunucu HTML'indeki çubuk da kalkmalı,
     yoksa React hidrasyonda uyuşmazlık görüyor. */
  ['<div class="left-1/2 top-1/2 z-40 fixed flex h-4 w-[140px] -translate-x-1/2 -translate-y-1/2 items-center justify-center pointer-events-none opacity-100" style="transition:opacity 250ms cubic-bezier(0.25, 1, 0.5, 1)" aria-hidden="true"><div class="relative h-1.5 w-full overflow-hidden rounded-full bg-l3"><div class="absolute inset-y-0 left-0 rounded-full bg-l1" style="width:0%;transition:width 520ms cubic-bezier(0.22, 1, 0.36, 1);will-change:width"></div></div></div>', ''],
  ['<span>tools</span>', '<span>araç</span>'],
  ['<span>event</span>', '<span>etkinlik</span>'],
  ['"TOOLS"', '"ARAÇ"'],
  /* Haoqi'nin kendi proje rotaları kaldırıldı; ana sayfadaki iş kartları
     kade-brand.js tarafından zaten Kade hizmetleri olarak etiketleniyor, bu
     yüzden bağlantılar da gerçek Kade sayfalarına gidiyor. */
  ['"/reunimos"', '"/referanslar"'],
  ['"/inspire_mono"', '"/hizmetler/sosyal-medya-yonetimi"'],
  ['"/wasm_design_utils"', '"/hizmetler/strateji-danismanlik"'],
  ['"/adrive"', '"/hizmetler/reklam-yonetimi"'],
  ['"/shore_icon"', '"/portfolio"'],
  ['"/teambition"', '"/kade-kit-business"'],
  ['haoqi-field', 'kade-field'],
  ['text:"Let\'s"', 'text:"Hadi"'],
  ['text:"Create"', 'text:"birlikte"'],
  ['text:"Something"', 'text:"iş"'],
  ['text:"Extraordinary"', 'text:"üretelim"'],
  ['"TOOLS"', '"ARAÇ"'],
  ['type:"tools"', 'type:"araç"'],
  ['type:"event"', 'type:"etkinlik"'],
  /* Ana sayfa giriş kapısı: sahne üç modelin beş kare çizmesini bekliyor ve o
     sırada dolan bir çubuk gösteriyordu. Kapı kapatıldı — sayfa diğer rotalar
     gibi doğrudan açılıyor, sahne arkada yükleniyor. Rota geçiş animasyonu
     olduğu gibi duruyor. */
  ['x={"/":{entryLoading:{enabled:!0},routeLoading:{enabled:!0}}}', 'x={"/":{entryLoading:{enabled:!1},routeLoading:{enabled:!0}}}']
]

/* Bundle içi metinler: footer geç mount olduğu için kade-brand.js'in DOM
   düzeltmesi oraya yetişmiyordu; kaynağında düzeltmek daha güvenilir. */
export const SCRIPT_COPY = [
  ['HAOQI©2026', 'Kade New Media © 2026'],
  /* Alt-sol HUD etiketi şablon içinde üretiliyor: `Haoqi (c) ${yıl}` */
  ['`Haoqi (c) ${', '`Kade New Media (c) ${'],
  ['curiosity.wen@gmail.com', 'thekademedia@gmail.com'],
  ['{href:"https://twitter.com/wenhaoqi",label:"Twitter/X"}', '{href:"https://instagram.com/kadenewmedia",label:"Instagram"}'],
  ['{href:"https://www.figma.com/@wenhaoqi",label:"Figma"}', '{href:"https://tiktok.com/@kadenewmedia",label:"TikTok"}'],
  ['{href:"https://github.com/wenhaoqiasd",label:"GitHub"}', '{href:"https://www.youtube.com/@kadenewmedia",label:"YouTube"},{href:"https://x.com/kadenewmedia",label:"X"},{href:"https://www.linkedin.com/company/kadenewmedia",label:"LinkedIn"}'],
  ['"/reunimos"', '"/referanslar"'],
  ['"/inspire_mono"', '"/hizmetler/sosyal-medya-yonetimi"'],
  ['"/wasm_design_utils"', '"/hizmetler/strateji-danismanlik"'],
  ['"/adrive"', '"/hizmetler/reklam-yonetimi"'],
  ['"/shore_icon"', '"/portfolio"'],
  ['"/teambition"', '"/kade-kit-business"'],
  ['haoqi-field', 'kade-field'],
  ['text:"Let\'s"', 'text:"Hadi"'],
  ['text:"Create"', 'text:"birlikte"'],
  ['text:"Something"', 'text:"iş"'],
  ['text:"Extraordinary"', 'text:"üretelim"'],
  ['"TOOLS"', '"ARAÇ"'],
  ['type:"tools"', 'type:"araç"'],
  ['type:"event"', 'type:"etkinlik"'],
  /* Snapshot statik HTML olarak sunuluyor; ana sayfaya dönen Next Link'leri
     görünür olur olmaz `/?_rsc=...` ön-getirmesi yapıyor ve statik kökte 404
     üretiyordu. DOM çıktısını değiştirmeden yalnız bu iki kök Link'te
     prefetch'i kapat. */
  ['style:{fontVariationSettings:\'"wght" 700, "wdth" 120\'},href:"/"', 'style:{fontVariationSettings:\'"wght" 700, "wdth" 120\'},prefetch:!1,href:"/"'],
  ['useActiveClass:!0,href:"/",activeClass:""', 'useActiveClass:!0,prefetch:!1,href:"/",activeClass:""'],
  /* Ana sayfa giriş kapısı: sahne üç modelin beş kare çizmesini bekliyor ve o
     sırada dolan bir çubuk gösteriyordu. Kapı kapatıldı — sayfa diğer rotalar
     gibi doğrudan açılıyor, sahne arkada yükleniyor. Rota geçiş animasyonu
     olduğu gibi duruyor. */
  ['x={"/":{entryLoading:{enabled:!0},routeLoading:{enabled:!0}}}', 'x={"/":{entryLoading:{enabled:!1},routeLoading:{enabled:!0}}}']
]

/* KLON VARLIK YOLU: /_next/ → /_kade/

   Klonlanan anasayfa da bir Next.js snapshot'ı ve chunk'larını /_next/ altından
   çağırıyor. Site tek bir Next.js dağıtımına taşındığında o yol Next'in kendi
   build çıktısına ayrılır (Vercel public/_next'i sunmaz), dolayısıyla klonun
   13 chunk'ı 404 olur ve anasayfa açılmaz.

   Yol adı burada yeniden yazılır; klasörün kendisini build-static.mjs aynı ada
   kopyalar. Değişim hem HTML'de hem chunk içeriğinde geçerli olmalı, çünkü
   snapshot kendi içinde de mutlak yolla referans veriyor. */
const ASSET_PATH = ['/_next/', '/_kade/']

export function transformScript(code) {
  for (const [from, to] of SCRIPT_COPY) code = code.split(from).join(to)
  code = code.split(ASSET_PATH[0]).join(ASSET_PATH[1])
  return code
}

const BOOTSTRAP = `<script data-kade-bootstrap>(function(){try{var root=document.documentElement;var migration='kade-light-default-2026-08-17';if(localStorage.getItem(migration)!=='1'){localStorage.setItem('theme','light');localStorage.setItem(migration,'1')}var locale=localStorage.getItem('kade-locale')==='en'?'en':'tr';root.setAttribute('data-locale',locale);root.lang=locale;localStorage.setItem('sound','off');var nativePlay=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(){if(this instanceof HTMLAudioElement){this.pause();return Promise.resolve()}return nativePlay.apply(this,arguments)}}catch(error){}})();</script>`

/* The real page finishes behind three lightweight CSS panels, then enters as a
   single composed frame. The panels reuse the site's grid and fold away in 3D;
   there is no progress indicator, temporary copy or extra model to download. */
const CRITICAL_FIRST_PAINT = `<style data-kade-critical-first-paint>html::before,body::before,body::after{content:"";position:fixed;top:0;bottom:0;width:calc(33.334vw + 1px);z-index:2147483000;background-color:#fbfaf4;background-image:linear-gradient(rgba(54,54,48,.1) 1px,transparent 1px);background-size:100% 33.333vh;box-shadow:inset -1px 0 rgba(54,54,48,.1);backface-visibility:hidden;will-change:transform,opacity;pointer-events:none}html::before{left:0;transform-origin:left center}body::before{left:33.333vw;transform-origin:center center}body::after{left:66.666vw;transform-origin:right center}html[data-kade-loaded]::before{transform:perspective(1200px) rotateY(-102deg);opacity:0;visibility:hidden;transition:transform .72s cubic-bezier(.77,0,.18,1),opacity .18s ease .42s,visibility 0s linear .76s}html[data-kade-loaded] body::before{transform:perspective(1200px) rotateY(96deg);opacity:0;visibility:hidden;transition:transform .72s cubic-bezier(.77,0,.18,1) .06s,opacity .18s ease .48s,visibility 0s linear .82s}html[data-kade-loaded] body::after{transform:perspective(1200px) rotateY(102deg);opacity:0;visibility:hidden;transition:transform .72s cubic-bezier(.77,0,.18,1) .12s,opacity .18s ease .54s,visibility 0s linear .88s}html.dark::before,html.dark body::before,html.dark body::after{background-color:#000;background-image:linear-gradient(rgba(251,250,244,.14) 1px,transparent 1px);box-shadow:inset -1px 0 rgba(251,250,244,.14)}@media(prefers-reduced-motion:reduce){html[data-kade-loaded]::before,html[data-kade-loaded] body::before,html[data-kade-loaded] body::after{transform:none;opacity:0;transition:opacity .12s ease;visibility:hidden}}</style><link rel="preload" href="/model/hello.gltf" as="fetch" crossorigin><link rel="preload" href="/model/hello.bin" as="fetch" crossorigin><link rel="preload" href="/model/cnt.gltf" as="fetch" crossorigin><link rel="preload" href="/model/cnt.bin" as="fetch" crossorigin><link rel="preload" href="/model/cursor.glb" as="fetch" crossorigin>`

const HEAD_ASSETS = [
  ['/kade-brand.css', '<link rel="preload" href="/fonts/kade/montserrat-400.ttf" as="font" type="font/ttf" crossorigin><link rel="preload" href="/fonts/kade/montserrat-700.ttf" as="font" type="font/ttf" crossorigin><link rel="stylesheet" href="/kade-brand.css">'],
  ['/kade-routes.css', '<link rel="stylesheet" href="/kade-routes.css">']
]

const BODY_ASSETS = ['/kade-routes.js', '/kade-access.js', '/kade-footer.js', '/kade-brand.js', '/kade-entry-watchdog.js']

const KADE_FAVICONS = '<link rel="icon" href="/favicon.ico" sizes="48x48"><link rel="icon" type="image/png" sizes="16x16" href="/favicon-16.png"><link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png"><link rel="icon" type="image/png" sizes="192x192" href="/favicon-192.png"><link rel="icon" type="image/png" sizes="512x512" href="/favicon.png"><link rel="apple-touch-icon" sizes="180x180" href="/favicon.png">'

const HOMEPAGE_SEO = `<link rel="canonical" href="https://kadenewmedia.com/"><meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"><meta name="author" content="Kade New Media"><meta name="geo.region" content="TR-34"><meta name="geo.placename" content="İstanbul"><meta property="og:type" content="website"><meta property="og:site_name" content="Kade New Media"><meta property="og:title" content="Kade New Media | New Media ve Dijital Pazarlama Ajansı"><meta property="og:description" content="İstanbul merkezli new media ve dijital pazarlama ajansı. Sosyal medya yönetimi, içerik üretimi, reklam, video prodüksiyon ve web tasarımı."><meta property="og:url" content="https://kadenewmedia.com/"><meta property="og:image" content="https://kadenewmedia.com/og-image.png"><meta property="og:locale" content="tr_TR"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="Kade New Media | New Media ve Dijital Pazarlama Ajansı"><meta name="twitter:description" content="Strateji, içerik, reklam, prodüksiyon ve yapay zekâ destekli dijital büyüme hizmetleri."><meta name="twitter:image" content="https://kadenewmedia.com/og-image.png"><script type="application/ld+json">{"@context":"https://schema.org","@graph":[{"@type":["Organization","ProfessionalService"],"@id":"https://kadenewmedia.com/#organization","name":"Kade New Media","alternateName":["Kade Media","Kademedia","Kadenewmedia","Kade"],"url":"https://kadenewmedia.com/","logo":"https://kadenewmedia.com/favicon.png","image":"https://kadenewmedia.com/og-image.png","description":"İstanbul merkezli new media, dijital medya ve pazarlama ajansı.","email":"thekademedia@gmail.com","areaServed":{"@type":"Country","name":"Türkiye"},"knowsAbout":["New media","Dijital pazarlama","Sosyal medya yönetimi","İçerik üretimi","Dijital reklam","Video prodüksiyon","Web tasarımı","Yapay zekâ destekli içerik üretimi"],"sameAs":["https://instagram.com/kadenewmedia","https://tiktok.com/@kadenewmedia","https://www.youtube.com/@kadenewmedia","https://x.com/kadenewmedia","https://www.linkedin.com/company/kadenewmedia"]},{"@type":"WebSite","@id":"https://kadenewmedia.com/#website","url":"https://kadenewmedia.com/","name":"Kade New Media","inLanguage":"tr-TR","publisher":{"@id":"https://kadenewmedia.com/#organization"}}]}</script>`

const HOMEPAGE_H1 = '<h1 data-kade-seo-title style="position:absolute!important;width:1px!important;height:1px!important;padding:0!important;margin:-1px!important;overflow:hidden!important;clip:rect(0,0,0,0)!important;white-space:nowrap!important;border:0!important">Kade New Media — New Media ve Dijital Pazarlama Ajansı</h1>'

function normalizeTitle(html) {
  return html.replace(/<title>([\s\S]*?)<\/title>/i, (tag, rawTitle) => {
    const title = rawTitle
      .trim()
      .replace(/(?:\s*\|\s*Kade New Media){2,}/g, ' | Kade New Media')
    return `<title>${title}</title>`
  })
}

function normalizeFavicons(html) {
  html = html.replace(/<link\b[^>]*\brel=["'](?:shortcut\s+)?icon["'][^>]*\/?\s*>/gi, '')
  html = html.replace(/<link\b[^>]*\brel=["']apple-touch-icon["'][^>]*\/?\s*>/gi, '')
  return html.replace('</head>', KADE_FAVICONS + '</head>')
}

export function transformHtml(html) {
  const isHomepageSnapshot = /<title>HAOQI©2026<\/title>/i.test(html)
  for (const [from, to] of COPY) html = html.split(from).join(to)
  html = html.split(ASSET_PATH[0]).join(ASSET_PATH[1])
  if (isHomepageSnapshot) {
    html = html.replace(/<html\b[^>]*\blang=["']en["']/i, (tag) => tag.replace(/lang=["']en["']/i, 'lang="tr"'))
    if (!html.includes('https://kadenewmedia.com/#website')) html = html.replace('</head>', HOMEPAGE_SEO + '</head>')
    if (!html.includes('data-kade-seo-title')) html = html.replace('<body>', `<body>${HOMEPAGE_H1}`)
  }
  html = normalizeTitle(html)
  html = normalizeFavicons(html)
  if (!html.includes('data-kade-bootstrap')) html = html.replace('<head>', '<head>' + BOOTSTRAP + CRITICAL_FIRST_PAINT)
  for (const [marker, tag] of HEAD_ASSETS) {
    if (!html.includes(marker)) html = html.replace('</head>', tag + '</head>')
  }
  for (const src of BODY_ASSETS) {
    if (!html.includes(src)) html = html.replace('</body>', `<script src="${src}" defer></script></body>`)
  }
  return html
}
