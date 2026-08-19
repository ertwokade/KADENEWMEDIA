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
  ['href="https://twitter.com/wenhaoqi"', 'href="https://instagram.com/kadenewmedia"'],
  ['<span>Twitter/X</span>', '<span>Instagram</span>'],
  ['href="https://www.figma.com/@wenhaoqi"', 'href="https://x.com/kadenewmedia"'],
  ['<span>Figma</span>', '<span>X</span>'],
  ['href="https://github.com/wenhaoqiasd"', 'href="https://www.youtube.com/@kadenewmedia"'],
  ['<span>GitHub</span>', '<span>YouTube</span>'],
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
  ['type:"event"', 'type:"etkinlik"']
]

/* Bundle içi metinler: footer geç mount olduğu için kade-brand.js'in DOM
   düzeltmesi oraya yetişmiyordu; kaynağında düzeltmek daha güvenilir. */
export const SCRIPT_COPY = [
  ['HAOQI©2026', 'Kade New Media © 2026'],
  /* Alt-sol HUD etiketi şablon içinde üretiliyor: `Haoqi (c) ${yıl}` */
  ['`Haoqi (c) ${', '`Kade New Media (c) ${'],
  ['curiosity.wen@gmail.com', 'thekademedia@gmail.com'],
  ['{href:"https://twitter.com/wenhaoqi",label:"Twitter/X"}', '{href:"https://instagram.com/kadenewmedia",label:"Instagram"}'],
  ['{href:"https://www.figma.com/@wenhaoqi",label:"Figma"}', '{href:"https://x.com/kadenewmedia",label:"X"}'],
  ['{href:"https://github.com/wenhaoqiasd",label:"GitHub"}', '{href:"https://www.youtube.com/@kadenewmedia",label:"YouTube"}'],
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
  ['type:"event"', 'type:"etkinlik"']
]

export function transformScript(code) {
  for (const [from, to] of SCRIPT_COPY) code = code.split(from).join(to)
  return code
}

const BOOTSTRAP = `<script data-kade-bootstrap>(function(){try{var migration='kade-light-default-2026-08-17';if(localStorage.getItem(migration)!=='1'){localStorage.setItem('theme','light');localStorage.setItem(migration,'1')}localStorage.setItem('sound','off');var nativePlay=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(){if(this instanceof HTMLAudioElement){this.pause();return Promise.resolve()}return nativePlay.apply(this,arguments)}}catch(error){}})();</script>`

const HEAD_ASSETS = [
  ['/kade-brand.css', '<link rel="preload" href="/fonts/kade/montserrat-400.ttf" as="font" type="font/ttf" crossorigin><link rel="preload" href="/fonts/kade/montserrat-700.ttf" as="font" type="font/ttf" crossorigin><link rel="stylesheet" href="/kade-brand.css">'],
  ['/kade-routes.css', '<link rel="stylesheet" href="/kade-routes.css">']
]

const BODY_ASSETS = ['/kade-routes.js', '/kade-access.js', '/kade-footer.js', '/kade-brand.js', '/kade-entry-watchdog.js']

export function transformHtml(html) {
  for (const [from, to] of COPY) html = html.split(from).join(to)
  if (!html.includes('data-kade-bootstrap')) html = html.replace('<head>', '<head>' + BOOTSTRAP)
  for (const [marker, tag] of HEAD_ASSETS) {
    if (!html.includes(marker)) html = html.replace('</head>', tag + '</head>')
  }
  for (const src of BODY_ASSETS) {
    if (!html.includes(src)) html = html.replace('</body>', `<script src="${src}" defer></script></body>`)
  }
  return html
}
