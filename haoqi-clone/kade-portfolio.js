/* /portfolio — panelden yönetilen projeler.

   Sayfanın üstündeki müşteri vitrini elle tasarlanmış ve öyle kalıyor.
   Eksik olan, panelin Portföy bölümüydü: oraya girilen projeler
   kade_site_content'e yazılıyor ama canlı sayfa bu kaydı hiç okumuyordu,
   yani panelde proje eklemek hiçbir yerde görünmüyordu.

   Detay sayfası (/portfolio/:slug) yalnız özet, süreç, medya veya sonuç
   girilmiş projeler için açılıyor — sunucu tarafı da aynı koşulu arıyor
   (server/api/dynamicPage.js). İçeriği olmayan proje bu yüzden bağlantısız
   basılıyor; aksi halde kart 404'e götürürdü.

   Metinler textContent ile basılıyor: içerik panelden geliyor, HTML olarak
   yorumlanmamalı. */
(function () {
  'use strict';
  var mount = document.querySelector('[data-kade-portfolio-list]');
  if (!mount) return;

  var EN = document.documentElement.getAttribute('data-locale') === 'en';

  function element(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }

  function metin(value) {
    return typeof value === 'string' ? value.trim() : '';
  }

  function detayVar(item) {
    var ozet = item.summary || {};
    return Boolean(
      metin(ozet.problem) || metin(ozet.goal) || metin(ozet.approach) || metin(ozet.role) ||
      (Array.isArray(item.process) && item.process.length) ||
      (Array.isArray(item.media) && item.media.length) ||
      (Array.isArray(item.results) && item.results.length),
    );
  }

  function kart(item, index) {
    var card = element('article', 'card');

    var etiketler = [String(index + 1).padStart(2, '0')];
    [item.category, item.client, item.year].forEach(function (parca) {
      if (metin(parca)) etiketler.push(metin(parca));
    });
    card.appendChild(element('span', 'index', etiketler.join(' · ')));
    card.appendChild(element('h3', null, metin(item.title)));

    if (metin(item.excerpt)) card.appendChild(element('p', null, metin(item.excerpt)));

    if (detayVar(item) && metin(item.slug)) {
      var link = element('a', 'arrow-link', EN ? 'View the project →' : 'Projeyi incele →');
      link.href = '/portfolio/' + metin(item.slug);
      card.appendChild(link);
    }

    return card;
  }

  fetch('/api/content?section=portfolio', { headers: { Accept: 'application/json' } })
    .then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    })
    .then(function (payload) {
      var items = payload && payload.data && Array.isArray(payload.data.items) ? payload.data.items : [];
      var yayinda = items.filter(function (item) {
        return item && typeof item === 'object' && metin(item.title) && item.published !== false;
      });
      if (!yayinda.length) return;

      yayinda.sort(function (a, b) {
        return (Number(a.order) || 0) - (Number(b.order) || 0);
      });

      var bolum = element('section');
      bolum.appendChild(element('p', 'eyebrow', EN ? 'Projects' : 'Projeler'));
      var grid = element('div', 'cards');
      yayinda.forEach(function (item, index) { grid.appendChild(kart(item, index)); });
      bolum.appendChild(grid);
      mount.appendChild(bolum);
    })
    .catch(function () {
      /* Sayfanın kendi içeriği zaten duruyor; liste çekilemezse sessizce
         atlanıyor, ziyaretçiye boş veya hatalı bir bölüm gösterilmiyor. */
    });
})();
