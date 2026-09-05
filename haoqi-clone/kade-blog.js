/* /blog listesi.

   Bu sayfanın gövdesi derleme anında donmuştu: içinde düz metin olarak
   "Şu anda yayında doğrulanmış bir yazı yok." yazıyordu ve hiçbir zaman
   /api/blog'u okumuyordu. Veritabanında yayında 3 yazı vardı; üçü de
   /blog/:slug adresinden açılıyor ve sitemap.xml'de duruyordu, yani yazılar
   yalnız siteyi gezen insandan gizliydi — liste tek keşif yolunu kapatıyordu.

   Liste artık istekte çekiliyor. Metinler textContent ile basılıyor: içerik
   panelden geliyor, HTML olarak yorumlanmamalı. */
(function () {
  'use strict';
  var mount = document.querySelector('[data-kade-blog-list]');
  if (!mount) return;

  var EN = document.documentElement.getAttribute('data-locale') === 'en';

  function t(tr, en) { return EN ? en : tr; }

  function element(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }

  /* date alanı panelde serbest metin ("26 Ağu 2026"); ayrıştırılamıyorsa
     olduğu gibi gösteriliyor, aksi halde "Invalid Date" basılırdı. */
  function tarih(post) {
    var raw = post.date || post.publishAt || post.createdAt;
    if (!raw) return '';
    var parsed = new Date(raw);
    if (isNaN(parsed.getTime())) return String(raw);
    return parsed.toLocaleDateString(EN ? 'en-US' : 'tr-TR', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  function kart(post, index) {
    var href = '/blog/' + post.slug;
    var card = element('article', 'card');

    var etiketler = [String(index + 1).padStart(2, '0')];
    var kategori = (EN && post.categoryEn) || post.category;
    if (kategori) etiketler.push(kategori);
    var gun = tarih(post);
    if (gun) etiketler.push(gun);
    card.appendChild(element('span', 'index', etiketler.join(' · ')));

    card.appendChild(element('h3', null, (EN && post.titleEn) || post.titleTr || post.slug));

    var ozet = (EN && post.excerptEn) || post.excerptTr;
    if (ozet) card.appendChild(element('p', null, ozet));

    var oku = element('a', 'arrow-link', t('Yazıyı oku →', 'Read the article →'));
    oku.href = href;
    card.appendChild(oku);

    return card;
  }

  function durum(className, mesaj) {
    var box = element('div', className);
    box.appendChild(element('p', null, mesaj));
    var link = element('a', null, t('İletişime geç', 'Get in touch'));
    link.href = '/iletisim';
    box.appendChild(link);
    return box;
  }

  function goster(node) {
    mount.textContent = '';
    mount.appendChild(node);
  }

  fetch('/api/blog', { headers: { Accept: 'application/json' } })
    .then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    })
    .then(function (data) {
      var posts = Array.isArray(data) ? data.filter(function (p) { return p && p.slug; }) : [];
      if (!posts.length) {
        goster(durum('empty-state', t(
          'Şu anda yayında doğrulanmış bir yazı yok. Yakında tekrar kontrol edin.',
          'No verified articles are published right now. Please check back soon.',
        )));
        return;
      }
      var grid = element('div', 'cards');
      posts.forEach(function (post, index) { grid.appendChild(kart(post, index)); });
      goster(grid);
    })
    .catch(function () {
      /* Liste çekilemedi. "Yazı yok" demek yanlış olurdu: yazılar duruyor,
         yalnız bu istek başarısız oldu. */
      goster(durum('error-state', t(
        'Yazı listesi şu anda yüklenemedi. Sayfayı yenilemeyi deneyin.',
        'The article list could not be loaded. Please try refreshing the page.',
      )));
    });
})();
