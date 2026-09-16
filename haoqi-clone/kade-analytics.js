/* Çerez onayı + ziyaret ölçümü (statik sayfalar).
   React uygulamasındaki CookieBanner ile aynı `cookie_consent` anahtarını
   kullanır. Onay verilmeden hiçbir ölçüm isteği atılmaz ve GA yüklenmez. */
(function () {
  'use strict';
  var path = location.pathname;
  if (/^\/(admin|giris|kadexai)(\/|$)/.test(path)) return;

  var KEY = 'cookie_consent';
  var started = false;

  function readConsent() {
    try { return localStorage.getItem(KEY); } catch (e) { return null; }
  }
  function writeConsent(value) {
    try { localStorage.setItem(KEY, value); } catch (e) { /* depolama kapalı: yalnız bu ziyaret */ }
    window.dispatchEvent(new CustomEvent('kade:cookie-consent', { detail: { consent: value } }));
  }

  function post(action, body, keepalive) {
    try {
      fetch('/api/content?action=' + action, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        keepalive: Boolean(keepalive)
      }).catch(function () {});
    } catch (e) { /* ölçüm kritik değil */ }
  }

  function sessionId() {
    try {
      var sid = sessionStorage.getItem('kade_visitor_sid');
      if (!sid) {
        sid = (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : Date.now() + '-' + Math.random().toString(36).slice(2, 10);
        sessionStorage.setItem('kade_visitor_sid', sid);
      }
      return sid;
    } catch (e) {
      return Date.now() + '-' + Math.random().toString(36).slice(2, 10);
    }
  }

  function loadGa(id) {
    if (!id || document.querySelector('script[data-kade-analytics]')) return;
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
    window.gtag('consent', 'default', { analytics_storage: 'granted' });
    window.gtag('js', new Date());
    window.gtag('config', id, { page_path: path, page_title: document.title });
    var script = document.createElement('script');
    script.async = true;
    script.dataset.kadeAnalytics = 'true';
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(id);
    document.head.appendChild(script);
  }

  function start() {
    if (started) return;
    started = true;
    post('pageview', { path: path, referrer: document.referrer || '' });
    var sid = sessionId();
    var ping = function () { if (document.visibilityState !== 'hidden') post('heartbeat', { sessionId: sid, path: path }, true); };
    ping();
    setInterval(ping, 15000);
    document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible') ping(); });
    fetch('/api/content?action=analytics-config', { headers: { Accept: 'application/json' } })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (config) { if (config && config.gaMeasurementId) loadGa(config.gaMeasurementId); })
      .catch(function () {});
  }

  function banner() {
    var box = document.createElement('div');
    box.className = 'kade-consent';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-live', 'polite');
    box.setAttribute('aria-label', 'Çerez tercihi');
    var text = document.createElement('p');
    text.appendChild(document.createTextNode('Siteyi iyileştirmek için ziyaret istatistiklerini yalnızca onay verirseniz topluyoruz. Ayrıntılar: '));
    var link = document.createElement('a');
    link.href = '/cerez-politikasi';
    link.textContent = 'Çerez Politikası';
    text.appendChild(link);
    text.appendChild(document.createTextNode('.'));
    var actions = document.createElement('div');
    actions.className = 'kade-consent__actions';
    function button(label, value, primary) {
      var b = document.createElement('button');
      b.type = 'button';
      b.textContent = label;
      if (primary) b.className = 'is-primary';
      b.addEventListener('click', function () {
        writeConsent(value);
        box.remove();
        if (value === 'accepted') start();
      });
      return b;
    }
    actions.appendChild(button('Reddet', 'declined', false));
    actions.appendChild(button('Kabul et', 'accepted', true));
    box.appendChild(text);
    box.appendChild(actions);
    var style = document.createElement('style');
    style.textContent = '.kade-consent{position:fixed;left:16px;right:16px;bottom:16px;z-index:9999;max-width:560px;margin:0 auto;padding:16px 18px;background:var(--bg);color:var(--text);border:1px solid var(--line);box-shadow:0 18px 48px -24px rgba(0,0,0,.45);font:14px/1.5 Montserrat,system-ui,sans-serif}'
      + '.kade-consent p{margin:0 0 12px}.kade-consent a{color:inherit;text-decoration:underline;text-underline-offset:.15em}'
      + '.kade-consent__actions{display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap}'
      + '.kade-consent button{min-height:44px;padding:0 18px;border:1px solid var(--line);background:transparent;color:var(--text);font:inherit;font-weight:600;cursor:pointer}'
      + '.kade-consent button.is-primary{background:var(--accent);border-color:var(--accent);color:#000}'
      + '.kade-consent button:focus-visible,.kade-consent a:focus-visible{outline:2px solid var(--text);outline-offset:2px}';
    document.head.appendChild(style);
    document.body.appendChild(box);
  }

  var consent = readConsent();
  if (consent === 'accepted') start();
  else if (consent !== 'declined') banner();
  window.addEventListener('kade:cookie-consent', function (event) {
    if (event.detail && event.detail.consent === 'accepted') start();
  });
})();
