/* Shared route furniture for the static pages: a breadcrumb/meta strip under
   the page head and a full site index above the footer, so every route links
   to every other one instead of ending in a dead stop. */
(function () {
  'use strict';
  var shell = document.querySelector('.article-shell');
  if (!shell || document.querySelector('script[src*="/_next/"]')) return;

  var GROUPS = [
    ['Hizmetler', [
      ['/hizmetler', 'Tüm hizmetler'],
      ['/hizmetler/sosyal-medya-yonetimi', 'Sosyal Medya Yönetimi'],
      ['/hizmetler/icerik-uretimi', 'İçerik Üretimi'],
      ['/hizmetler/reklam-yonetimi', 'Reklam Yönetimi'],
      ['/hizmetler/video-produksiyon', 'Video Prodüksiyon'],
      ['/hizmetler/strateji-danismanlik', 'Strateji & Danışmanlık'],
      ['/hizmetler/web-sitesi-tasarimi', 'Web Sitesi Tasarımı']
    ]],
    ['Ajans', [
      ['/hakkimizda', 'Hakkımızda'],
      ['/neden-biz', 'Neden Biz'],
      ['/ekip', 'Ekip'],
      ['/new-media-ajansi', 'New Media Ajansı'],
      ['/kariyer', 'Kariyer'],
      ['/basin', 'Basın']
    ]],
    ['Çalışmalar', [
      ['/portfolio', 'Portfolyo'],
      ['/referanslar', 'Referanslar'],
      ['/basari-hikayeleri', 'Başarı Hikâyeleri'],
      ['/partnerler', 'Partnerler'],
      ['/referans-programi', 'Referans Programı']
    ]],
    ['Kaynaklar', [
      ['/blog', 'Blog'],
      ['/sss', 'Sık Sorulanlar'],
      ['/podcast-webinar', 'Podcast & Webinar'],
      ['/bulten-arsivi', 'Bülten Arşivi'],
      ['/organizasyon-kiti', 'Organizasyon Kiti'],
      ['/kade-kit-business', 'Kade Kit Business']
    ]],
    ['Teklif & Yasal', [
      ['/teklif-al', 'Teklif Al'],
      ['/fiyat-hesaplama', 'Fiyat Hesaplama'],
      ['/paketler', 'Paketler'],
      ['/iletisim', 'İletişim'],
      ['/kvkk', 'KVKK'],
      ['/gizlilik', 'Gizlilik'],
      ['/cerez-politikasi', 'Çerez Politikası']
    ]]
  ];

  var path = location.pathname.replace(/\/$/, '') || '/';

  function element(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }

  /* Breadcrumb + last update, read from the metadata the page already ships. */
  function buildMeta() {
    var head = shell.querySelector('.page-head');
    if (!head || document.querySelector('.kade-meta')) return;
    var strip = element('nav', 'kade-meta');
    strip.setAttribute('aria-label', 'Sayfa konumu');
    var home = element('a', null, 'Kade New Media');
    home.href = '/';
    strip.appendChild(home);
    var walked = '';
    path.split('/').filter(Boolean).forEach(function (part, index, parts) {
      walked += '/' + part;
      strip.appendChild(element('span', null, '/'));
      var label = (index === parts.length - 1 && shell.querySelector('h1'))
        ? shell.querySelector('h1').textContent.trim()
        : part.replace(/-/g, ' ');
      if (index === parts.length - 1) {
        var current = element('span', null, label);
        current.setAttribute('aria-current', 'page');
        strip.appendChild(current);
      } else {
        var link = element('a', null, label);
        link.href = walked;
        strip.appendChild(link);
      }
    });
    var updated = shell.querySelector('.metadata-grid dd');
    if (updated) {
      var stamp = element('span', null, 'Güncelleme · ' + updated.textContent.trim());
      stamp.style.marginLeft = 'auto';
      strip.appendChild(stamp);
    }
    head.parentNode.insertBefore(strip, head.nextSibling);
  }

  function buildIndex() {
    if (document.querySelector('.kade-routes')) return;
    var footer = shell.querySelector('.article-footer');
    var wrap = element('nav', 'kade-routes');
    wrap.setAttribute('aria-label', 'Site haritası');
    wrap.appendChild(element('p', 'eyebrow', 'Tüm sayfalar'));
    var grid = element('div', 'kade-routes__grid');
    GROUPS.forEach(function (group) {
      var column = element('div', 'kade-routes__col');
      column.appendChild(element('strong', null, group[0]));
      group[1].forEach(function (route) {
        var link = element('a', null, route[1]);
        link.href = route[0];
        if (route[0] === path) link.setAttribute('aria-current', 'page');
        column.appendChild(link);
      });
      grid.appendChild(column);
    });
    wrap.appendChild(grid);
    if (footer) footer.parentNode.insertBefore(wrap, footer);
    else shell.querySelector('article').appendChild(wrap);
  }

  buildMeta();
  buildIndex();
})();

/* İlk ekrandaki içerik beklemesin: gözlemciye bırakılan öğeler sayfa açılır
   açılmaz görünür olsun, gözlemci hiç tetiklenmezse de hiçbir şey gizli
   kalmasın. Aşağıdaki bölümler yine kaydırdıkça açılıyor. */
(function () {
  'use strict';
  var shell = document.querySelector('.article-shell');
  if (!shell) return;

  function ac(el) { el.classList.add('is-visible') }

  function ilkEkran() {
    var sinir = window.innerHeight * 1.5;
    document.querySelectorAll('.reveal, .page-head h1').forEach(function (el) {
      if (el.getBoundingClientRect().top < sinir) ac(el);
    });
  }

  function hepsi() {
    document.querySelectorAll('.reveal, .page-head h1').forEach(ac);
  }

  ilkEkran();
  requestAnimationFrame(ilkEkran);
  setTimeout(ilkEkran, 400);
  /* Emniyet ağı: gözlemci bir sebeple çalışmazsa içerik görünmeden kalmasın. */
  setTimeout(hepsi, 2500);
})();
