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
  [', engineering, and AI at scale. Outside work, I build design tools for team efficiency.', '']
]

const BOOTSTRAP = `<script data-kade-bootstrap>(function(){try{var migration='kade-light-default-2026-08-17';if(localStorage.getItem(migration)!=='1'){localStorage.setItem('theme','light');localStorage.setItem(migration,'1')}localStorage.setItem('sound','off');var nativePlay=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(){if(this instanceof HTMLAudioElement){this.pause();return Promise.resolve()}return nativePlay.apply(this,arguments)}}catch(error){}})();</script>`

const HEAD_ASSETS = [
  ['/kade-brand.css', '<link rel="preload" href="/fonts/kade/montserrat-400.ttf" as="font" type="font/ttf" crossorigin><link rel="preload" href="/fonts/kade/montserrat-700.ttf" as="font" type="font/ttf" crossorigin><link rel="stylesheet" href="/kade-brand.css">'],
  ['/kade-routes.css', '<link rel="stylesheet" href="/kade-routes.css">']
]

const BODY_ASSETS = ['/kade-routes.js', '/kade-brand.js', '/kade-entry-watchdog.js']

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
