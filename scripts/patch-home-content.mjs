#!/usr/bin/env node
/**
 * public/site.html yamalayıcı — ANA SAYFA H1 + İÇERİK
 *
 * Neden gerekli:
 *   Ana sayfa, kaynağı elimizde olmayan bir Next.js uygulamasının statik
 *   snapshot'ı. Hydration sırasında React sunucu HTML'ini atıp istemci
 *   tarafında yeniden çiziyor (hydration mismatch #418) ve bu sırada:
 *     - snapshot'taki <h1> yerine <div> basıyor  -> sayfada H1 KALMIYOR
 *     - sayfada hiç H2 yok, render sonrası ~80 kelime kalıyor (ince içerik)
 *
 * Bu script iki şeyi idempotent biçimde enjekte eder:
 *   1) #kade-about   : gerçek, görünür içerik bölümü (H2'ler + iç linkler).
 *                      Hem ham HTML'e (JS çalıştırmayan tarayıcılar için)
 *                      hem de </body> öncesine <template> olarak konur.
 *   2) #kade-h1-fix  : hydration sonrası çalışan, hero <div>'ini <h1>'e
 *                      yükselten ve #kade-about silinmişse geri koyan script.
 *
 * Tek kaynak bu dosyadır. Metni değiştirmek için SECTION_HTML'i düzenleyip
 * `node scripts/patch-home-content.mjs` komutunu tekrar çalıştırın.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FILE = path.join(ROOT, 'public', 'site.html');

const SERVICES = [
  ['/hizmetler/sosyal-medya-yonetimi', 'Sosyal Medya Yönetimi',
    'Instagram, Facebook, TikTok ve LinkedIn için içerik planlama, yayın takvimi, topluluk yönetimi ve aylık raporlama.'],
  ['/hizmetler/icerik-uretimi', 'İçerik Üretimi',
    'Markanıza özel görsel, video ve metin içerikleri; içerik stratejisi, grafik tasarım, metin yazımı ve fotoğraf çekimi.'],
  ['/hizmetler/reklam-yonetimi', 'Reklam Yönetimi',
    'Meta, Google Ads ve TikTok Ads kampanyalarında hedefleme, A/B testleri, yeniden pazarlama ve performans analizi.'],
  ['/hizmetler/video-produksiyon', 'Video Prodüksiyon',
    'Reels, TikTok, YouTube ve reklam projeleri için senaryo, çekim, kurgu ve motion graphics.'],
  ['/hizmetler/strateji-danismanlik', 'Strateji & Danışmanlık',
    'Marka ve rakip analizi, hedef ve KPI belirleme, dijital pazarlama yol haritası ve büyüme planı.'],
  ['/hizmetler/web-sitesi-tasarimi', 'Web Sitesi Tasarımı',
    'Mobil uyumlu web sitesi tasarımı, UI/UX, geliştirme, CMS ve e-ticaret entegrasyonu.'],
];

const STEPS = [
  ['Keşif ve analiz', 'Markanın mevcut dijital varlıklarını, rakipleri ve hedef kitleyi inceleyerek başlıyoruz.'],
  ['Strateji ve plan', 'Hedefleri ve ölçülebilir KPI’ları belirliyor, kanal bazında bir yol haritası çıkarıyoruz.'],
  ['Üretim ve yayın', 'İçerik, tasarım ve reklam üretimini planlanan takvime göre yürütüyoruz.'],
  ['Ölçüm ve raporlama', 'Sonuçları düzenli raporluyor, veriye göre içerik ve reklam kurgusunu güncelliyoruz.'],
];

const CSS = `
#kade-about{position:relative;z-index:10;pointer-events:auto;padding:4.5rem 1rem;width:100%;color:inherit;font-family:inherit}
@media(min-width:1024px){#kade-about{padding:6rem 3.5rem}}
#kade-about .kade-about-inner{max-width:64rem;margin:0 auto;display:flex;flex-direction:column;gap:2.75rem}
#kade-about h2{font-weight:700;text-transform:uppercase;line-height:1.05;font-size:clamp(1.5rem,4.2vw,2.75rem);margin:0 0 .85rem}
#kade-about h3{font-weight:600;font-size:1rem;margin:0 0 .2rem}
#kade-about p{margin:0 0 .85rem;font-size:1rem;line-height:1.6;max-width:60ch;opacity:.92}
#kade-about ul,#kade-about ol{margin:0;padding:0;list-style:none;display:grid;gap:1.15rem}
@media(min-width:768px){#kade-about ul.kade-grid{grid-template-columns:1fr 1fr}}
#kade-about li{font-size:.95rem;line-height:1.55;opacity:.92}
#kade-about li p{margin:0;font-size:.95rem}
#kade-about ol{counter-reset:kade-step}
#kade-about ol li{counter-increment:kade-step}
#kade-about ol li h3::before{content:counter(kade-step,decimal-leading-zero) " ";opacity:.55;font-variant-numeric:tabular-nums}
#kade-about a{color:inherit;text-decoration:underline;text-underline-offset:.12em}
#kade-about a:hover{opacity:.7}
#kade-about .kade-about-cta{font-size:1rem;line-height:1.6}
`.trim();

const li = (href, title, desc) =>
  `<li><h3><a href="${href}">${title}</a></h3><p>${desc}</p></li>`;

const SECTION_HTML = `<section id="kade-about" aria-labelledby="kade-about-title"><div class="kade-about-inner">` +
  `<div><h2 id="kade-about-title">İstanbul merkezli sosyal medya ve dijital pazarlama ajansı</h2>` +
  `<p>Kade New Media; strateji, içerik, reklam ve prodüksiyonu tek bir ekipte birleştiren İstanbul merkezli bir dijital pazarlama ajansıdır. Sosyal medya hesaplarının günlük yönetiminden performans reklamlarına, video prodüksiyondan web sitesi tasarımına kadar dijital iletişimin bütün adımlarını yürütüyoruz.</p>` +
  `<p>Amacımız tek seferlik kampanyalar değil, markanın dijitalde düzenli ve ölçülebilir biçimde büyümesi. Bu yüzden her işe marka ve rakip analiziyle başlıyor, üretimi net bir yayın takvimine bağlıyor ve sonuçları düzenli olarak raporluyoruz. <a href="/hakkimizda">Ajans hakkında daha fazla bilgi</a> alabilir veya <a href="/portfolio">çalışmalarımızı</a> inceleyebilirsiniz.</p></div>` +
  `<div><h2>Hizmetlerimiz</h2>` +
  `<p>Markaların dijitalde ihtiyaç duyduğu altı ana hizmeti tek çatı altında sunuyoruz. Tümünü birlikte ya da ihtiyacınıza göre ayrı ayrı yürütebiliriz.</p>` +
  `<ul class="kade-grid">${SERVICES.map((s) => li(s[0], s[1], s[2])).join('')}</ul>` +
  `<p class="kade-about-cta"><a href="/hizmetler">Tüm hizmetleri ve kapsamlarını görüntüleyin</a>.</p></div>` +
  `<div><h2>Nasıl çalışıyoruz?</h2>` +
  `<ol>${STEPS.map(([t, d]) => `<li><h3>${t}</h3><p>${d}</p></li>`).join('')}</ol></div>` +
  `<div><h2>Projenizi konuşalım</h2>` +
  `<p class="kade-about-cta">Markanız için nereden başlayacağınızdan emin değilseniz, mevcut hesaplarınıza bakıp size uygun bir yol haritası çıkarabiliriz. <a href="/iletisim">İletişim formundan</a> bize ulaşabilir, sık merak edilenler için <a href="/sss">SSS sayfasına</a> göz atabilir ya da doğrudan <a href="mailto:thekademedia@gmail.com">thekademedia@gmail.com</a> adresine yazabilirsiniz.</p></div>` +
  `</div></section>`;

const GUARD_JS = `
(function(){
  var TPL='kade-about-tpl';
  function heroDiv(){
    var c=document.querySelectorAll('div.font-bold');
    for(var i=0;i<c.length;i++){
      var e=c[i], cl=e.className||'';
      if(cl.indexOf('self-end')>-1 && cl.indexOf('uppercase')>-1 && /BÜYÜTÜYORUZ/i.test(e.textContent||'')) return e;
    }
    return null;
  }
  function promote(){
    var d=heroDiv();
    if(!d) return;
    if(document.querySelector('h1')){ return; }        // zaten H1 var
    var h=document.createElement('h1');
    for(var i=0;i<d.attributes.length;i++){ h.setAttribute(d.attributes[i].name,d.attributes[i].value); }
    while(d.firstChild) h.appendChild(d.firstChild);
    d.parentNode.replaceChild(h,d);
  }
  function restoreAbout(){
    if(document.getElementById('kade-about')) return;
    var t=document.getElementById(TPL); if(!t) return;
    var sw=document.getElementById('selected-work');
    var host=sw&&sw.parentNode; if(!host) return;
    var node=t.content.firstElementChild.cloneNode(true);
    if(sw.nextSibling) host.insertBefore(node,sw.nextSibling); else host.appendChild(node);
  }
  function run(){ try{ promote(); restoreAbout(); }catch(e){} }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',run); else run();
  window.addEventListener('load',run);
  [300,800,1500,2500,4000,6000].forEach(function(d){ setTimeout(run,d); });
})();
`.trim();

// ---------------------------------------------------------------- patch
let html = fs.readFileSync(FILE, 'utf8');
const before = html;

// idempotent: önceki enjeksiyonları temizle
html = html
  .replace(/<style id="kade-about-css">[\s\S]*?<\/style>/g, '')
  .replace(/<section id="kade-about"[\s\S]*?<\/section>/g, '')
  .replace(/<template id="kade-about-tpl">[\s\S]*?<\/template>/g, '')
  .replace(/<script id="kade-h1-fix">[\s\S]*?<\/script>/g, '');

// 1) CSS -> </head>
if (!html.includes('</head>')) throw new Error('site.html: </head> bulunamadı');
html = html.replace('</head>', `<style id="kade-about-css">${CSS}</style></head>`);

// 2) görünür bölüm -> section#selected-work'ten hemen sonra
const anchor = '</section>';
const ai = html.indexOf(anchor, html.indexOf('id="selected-work"'));
if (ai === -1) throw new Error('site.html: #selected-work kapanışı bulunamadı');
html = html.slice(0, ai + anchor.length) + SECTION_HTML + html.slice(ai + anchor.length);

// 3) template + guard -> </body> öncesi (React kökünün dışı)
if (!html.includes('</body>')) throw new Error('site.html: </body> bulunamadı');
html = html.replace(
  '</body>',
  `<template id="kade-about-tpl">${SECTION_HTML}</template>` +
  `<script id="kade-h1-fix">${GUARD_JS}</script></body>`,
);

if (html === before) {
  console.log('site.html: değişiklik yok');
} else {
  fs.writeFileSync(FILE, html);
  const words = SECTION_HTML.replace(/<[^>]+>/g, ' ').trim().split(/\s+/).length;
  console.log(`site.html yamalandı — #kade-about (${words} kelime), H1 guard, template.`);
}
