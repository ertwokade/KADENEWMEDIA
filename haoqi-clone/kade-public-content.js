/* Public CMS sections. Values are inserted as text, never executable HTML.
   Empty and failed responses remain distinct; no sample counts/testimonials. */
(function () {
  'use strict';
  function text(value) { return typeof value === 'string' || typeof value === 'number' ? String(value).trim() : ''; }
  function node(tag, value, className) {
    var el = document.createElement(tag);
    el.textContent = text(value);
    if (className) el.className = className;
    return el;
  }
  document.querySelectorAll('[data-kade-public-content]').forEach(function (mount) {
    var section = mount.getAttribute('data-kade-public-content');
    if (section !== 'testimonials' && section !== 'nedenBiz') return;
    var key = section === 'testimonials' ? 'items' : 'rakamlar';
    function load() {
      mount.replaceChildren(node('p', 'İçerik yükleniyor…'));
      fetch('/api/content?section=' + encodeURIComponent(section) + (section === 'nedenBiz' ? '&view=public-stats' : ''), { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(15000) })
        .then(function (response) { if (!response.ok) throw new Error('Content unavailable'); return response.json(); })
        .then(function (payload) {
          if (!payload || !Object.prototype.hasOwnProperty.call(payload, 'data')) throw new Error('Invalid content');
          var content = payload.data;
          if (content != null && (typeof content !== 'object' || Array.isArray(content))) throw new Error('Invalid content');
          var rows = content && content[key];
          if (rows != null && !Array.isArray(rows)) throw new Error('Invalid section');
          rows = (rows || []).filter(function (row) {
            return row && row.published !== false && (section === 'testimonials'
              ? text(row.nameTr || row.nameEn) && text(row.textTr || row.textEn)
              : text(row.sayi) && text(row.etiket));
          });
          if (!rows.length) {
            mount.replaceChildren(node('p', section === 'testimonials' ? 'Henüz yayınlanmış müşteri yorumu yok. Çalıştığımız markaları portfolyoda inceleyebilirsiniz.' : 'Sayısal sonuçlar henüz yayınlanmadı.', 'empty-state'));
            return;
          }
          var grid = node('div', '', 'cards');
          rows.forEach(function (row) {
            var card = node('article', '', 'card');
            if (section === 'testimonials') {
              card.appendChild(node('blockquote', row.textTr || row.textEn));
              card.appendChild(node('strong', row.nameTr || row.nameEn));
              card.appendChild(node('p', row.roleTr || row.roleEn));
            } else {
              card.appendChild(node('strong', row.sayi));
              card.appendChild(node('p', row.etiket));
            }
            grid.appendChild(card);
          });
          mount.replaceChildren(grid);
        }).catch(function () {
          var error = node('div', '', 'error-state');
          error.setAttribute('role', 'alert');
          error.appendChild(node('p', 'İçerik şu anda yüklenemedi.'));
          var retry = node('button', 'Yeniden dene', 'arrow-link');
          retry.type = 'button';
          retry.addEventListener('click', load);
          error.appendChild(retry);
          mount.replaceChildren(error);
        });
    }
    load();
  });
})();
