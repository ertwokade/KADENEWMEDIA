#!/usr/bin/env node
/**
 * public/site.html font yamalayıcı — POPPINS
 *
 * Neden ayrı bir script:
 *   Ana sayfa (`/`), kaynağı elimizde olmayan bir Next.js uygulamasının statik
 *   snapshot'ıdır ve React uygulamasının global CSS'ini (src/index.css →
 *   src/styles/kade-tokens.css) HİÇ yüklemez. Kendi Tailwind çıktısını
 *   (`/_next/static/chunks/*.css`) kullanır. Bu yüzden yalnızca React tarafını
 *   Poppins'e çevirmek ana sayfayı değiştirmez.
 *
 *   Snapshot'ın üretildiği kaynak proje elimizde olmadığından snapshot'ın
 *   KENDİSİ kaynak dosyadır. Elle düzenlemek yerine bu idempotent script
 *   kullanılır: snapshot yenilenirse script tekrar çalıştırılarak font
 *   dönüşümü birebir yeniden üretilir.
 *
 * Ne yapar (hepsi idempotent):
 *   1) <style id="kade-fonts"> bloğunu Poppins @font-face'leri + Tailwind
 *      tema değişkeni override'ı ile değiştirir. Snapshot'ın CSS'i
 *      `@layer theme { :root { --font-sans: "tiktok" ... } }` kullanır;
 *      layer'sız bir :root bloğu bunu her zaman ezer.
 *   2) TikTokSans preload'unu Poppins preload'ları ile değiştirir.
 *   3) Snapshot'a gömülü inline `font-family:tronica-mono,...` gibi
 *      bildirimleri Poppins'e çevirir.
 *
 * Kullanım: node scripts/apply-poppins-to-site.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FILE = path.join(ROOT, 'public', 'site.html');

// Bu değer hem CSS bloklarına hem de snapshot içindeki tek tırnaklı
// `style.cssText='...'` JavaScript dizgilerine yazılıyor. Aile adında tek
// tırnak kullanmak o dizgiyi bozup ana sayfada SyntaxError üretiyordu.
const STACK = 'Poppins,system-ui,-apple-system,BlinkMacSystemFont,sans-serif';

// src/styles/kade-tokens.css ile BİREBİR aynı subset/unicode-range tanımları.
// İkisi ayrı dosyada durmak zorunda (biri React bundle'ı, biri statik snapshot)
// ama aynı /fonts/poppins/*.woff2 dosyalarını paylaşır — çift indirme olmaz.
const LATIN_EXT = 'U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF';
const LATIN = 'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD';

const faces = [400, 500, 600, 700]
  .flatMap((w) => [
    `@font-face{font-family:'Poppins';font-style:normal;font-weight:${w};font-display:swap;src:url('/fonts/poppins/poppins-${w}-latin-ext.woff2') format('woff2');unicode-range:${LATIN_EXT}}`,
    `@font-face{font-family:'Poppins';font-style:normal;font-weight:${w};font-display:swap;src:url('/fonts/poppins/poppins-${w}-latin.woff2') format('woff2');unicode-range:${LATIN}}`,
  ])
  .join('');

// `tiktok` / `mono` / `tronica-mono` takma adları snapshot'ın markup'ında
// doğrudan geçtiği için Poppins'e diğer ad olarak da bağlanır; böylece
// gözden kaçan bir kullanım fallback'e düşmez.
const aliases = ['tiktok', 'mono', 'tronica-mono']
  .flatMap((name) => [400, 500, 600, 700].flatMap((w) => [
    `@font-face{font-family:'${name}';font-style:normal;font-weight:${w};font-display:swap;src:url('/fonts/poppins/poppins-${w}-latin-ext.woff2') format('woff2');unicode-range:${LATIN_EXT}}`,
    `@font-face{font-family:'${name}';font-style:normal;font-weight:${w};font-display:swap;src:url('/fonts/poppins/poppins-${w}-latin.woff2') format('woff2');unicode-range:${LATIN}}`,
  ]))
  .join('');

const FONT_BLOCK = `<style id="kade-fonts">${faces}${aliases}` +
  // Tailwind tema değişkenleri @layer theme içinde tanımlı; layer'sız :root ezer.
  `:root,:host{--font-sans:${STACK};--font-mono:${STACK};--font-mono-2:${STACK};--default-font-family:${STACK};--default-mono-font-family:${STACK}}` +
  `html,body,button,input,textarea,select,dialog{font-family:${STACK}}` +
  // Snapshot'ın bundle'ı hidrasyondan sonra bazı düğümlere çalışma anında
  // font atıyor; o kodun kaynağı elimizde olmadığı için düzeltilemiyor.
  // Takma adlar zaten Poppins dosyalarına bağlı (ekranda doğru font çizilir),
  // ancak hesaplanan aile adının da tek olması için son sözü burada söylüyoruz.
  // code/pre/kbd/samp bilerek dışarıda: onlar monospace kalmalı.
  `body *:not(code):not(pre):not(kbd):not(samp):not(code *):not(pre *){font-family:${STACK}!important}` +
  // Snapshot'ın variable-font eksenleri (wdth/wght) Poppins'te yok; kalırlarsa
  // tarayıcı sentetik genişletme uygulamaya çalışıp harfleri bozabiliyor.
  `[style*="font-variation-settings"]{font-variation-settings:normal!important;font-stretch:normal!important}` +
  `</style>`;

const PRELOADS =
  `<link rel="preload" as="font" type="font/woff2" href="/fonts/poppins/poppins-400-latin.woff2" crossorigin>` +
  `<link rel="preload" as="font" type="font/woff2" href="/fonts/poppins/poppins-600-latin.woff2" crossorigin>`;

/**
 * Snapshot'ın JS bundle'ı, CSS'ten bağımsız olarak FontFace API ile eski
 * fontları çalışma anında yüklüyor:
 *   new FontFace("tiktok", "url(.../fonts/TikTokSans.woff2)", {weight:"100 900"})
 * CSS override'ı görünümü düzeltse de bu kod TikTokSans'ı (341 KB) yine
 * indiriyordu. URL'leri Poppins'e çevirmek hem indirmeyi hem de aile
 * eşleşmesini doğru yere bağlar. Ağırlık aralığı (100 900) Poppins statik
 * dosyasında tek ağırlık olduğundan tarayıcı sentetik ara ağırlık üretmez;
 * gerçek ağırlıklar CSS @font-face'lerinden gelir.
 */
function patchBundleFontUrls() {
  const dir = path.join(ROOT, 'public', '_next', 'static', 'chunks');
  if (!fs.existsSync(dir)) return [];
  const REPLACEMENTS = [
    [/\/fonts\/TikTokSans\.woff2/g, '/fonts/poppins/poppins-400-latin.woff2'],
    [/\/fonts\/GeistMono\[wght\]\.woff2/g, '/fonts/poppins/poppins-400-latin.woff2'],
    [/\/fonts\/DepartureMono-Regular\.woff2/g, '/fonts/poppins/poppins-400-latin.woff2'],
  ];
  const touched = [];
  for (const name of fs.readdirSync(dir)) {
    if (!name.endsWith('.js')) continue;
    const file = path.join(dir, name);
    const src = fs.readFileSync(file, 'utf8');
    let next = src;
    for (const [re, to] of REPLACEMENTS) next = next.replace(re, to);
    if (next !== src) {
      fs.writeFileSync(file, next);
      touched.push(name);
    }
  }
  return touched;
}

const patchedChunks = patchBundleFontUrls();

let html = fs.readFileSync(FILE, 'utf8');
const before = html;

// Önceki yama sürümündeki JS-dizgisiyle çakışan stack'i güvenli biçime taşı.
html = html.replaceAll(
  `Poppins,system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif`,
  STACK,
);

// 1) kade-fonts bloğunu değiştir (yoksa </head> önüne ekle).
if (/<style id="kade-fonts">[\s\S]*?<\/style>/.test(html)) {
  html = html.replace(/<style id="kade-fonts">[\s\S]*?<\/style>/, () => FONT_BLOCK);
} else if (html.includes('</head>')) {
  html = html.replace('</head>', `${FONT_BLOCK}</head>`);
} else {
  throw new Error('site.html: </head> bulunamadı');
}

// 2) Eski font preload'larını Poppins ile değiştir (tekrar çalıştırmada çoğaltma).
html = html.replace(
  /<link rel="preload" as="font" type="font\/woff2" href="\/fonts\/(TikTokSans|GeistMono\[wght\]|DepartureMono-Regular)\.woff2" crossorigin>/g,
  '',
);
if (!html.includes('/fonts/poppins/poppins-400-latin.woff2" crossorigin>')) {
  html = html.replace('<style id="kade-fonts">', `${PRELOADS}<style id="kade-fonts">`);
}

// 3) Snapshot'a gömülü inline font-family bildirimleri.
html = html.replace(/font-family:tronica-mono,ui-monospace,monospace/g, `font-family:${STACK}`);
html = html.replace(/font-family:"tronica-mono",monospace/g, `font-family:${STACK}`);
// Snapshot'ın gömülü JS'i logoya çalışma anında font atıyor.
html = html.replace(
  /\.style\.fontFamily\s*=\s*"tronica-mono,ui-monospace,monospace"/g,
  `.style.fontFamily="${STACK}"`,
);

if (patchedChunks.length) {
  console.log(`_next chunk font URL'leri Poppins'e çevrildi: ${patchedChunks.join(', ')}`);
}

if (html === before) {
  console.log('site.html: font yaması zaten güncel');
} else {
  fs.writeFileSync(FILE, html);
  const stale = ['TikTokSans.woff2', 'GeistMono[wght].woff2', 'DepartureMono-Regular.woff2']
    .filter((f) => html.includes(f));
  console.log('site.html: Poppins uygulandı (@font-face + tema değişkenleri + preload).');
  if (stale.length) console.warn('  UYARI — hâlâ eski font referansı var:', stale.join(', '));
}
