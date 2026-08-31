/* Snapshot varlık yolu artık /_kade/ (bkz. kade-html-transform.mjs): tek
   dağıtım mimarisinde /_next/ Next.js'in kendi çıktısına ayrıldı. Bu tespitler
   "klonlanan Next uygulaması mı" sorusunu yanıtlıyor, bu yüzden İKİ yolu da
   tanımalılar — yoksa marka yaması ve erişim düzeltmeleri sessizce atlanır. */
/* Giriş / kayıt girişi.
   KadexAI ve danışmanlık iki ayrı çalışma alanı ve ikisinin de giriş + kayıt
   adımı var; tek bir ikon "giriş mi, hesap mı?" sorusunu açıkta bırakıyor.
   Bu yüzden başlıkta ikon + kısa etiketli bir çip duruyor, açılınca iki alanı
   ve eylemlerini gösteren küçük bir panel geliyor. Mobil kontrol şeridinde
   yalnızca ikon kalıyor.
   Klonun ana sayfası ile statik rotalar iki farklı başlık işaretlemesi
   kullandığı için bu dosya ikisinden de bağımsız çalışır. */
(function () {
  'use strict';
  var AREAS = [
    {
      tr: 'KadexAI', en: 'KadexAI',
      trSub: 'İçerik ve operasyon paneli', enSub: 'Content and operations workspace',
      actions: [
        { href: '/kadexai/login', tr: 'Giriş yap', en: 'Sign in', primary: true },
        { href: '/kadexai/login', tr: 'Kayıt ol', en: 'Sign up' }
      ]
    },
    {
      tr: 'Danışmanlık', en: 'Consulting',
      trSub: 'Danışmanlık çalışma alanı', enSub: 'Consulting workspace',
      actions: [
        { href: '/giris/danismanlik', tr: 'Giriş yap', en: 'Sign in', primary: true },
        { href: '/teklif-al', tr: 'Talep oluştur', en: 'Start a request' }
      ]
    }
  ];
  var ICON = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2' stroke-linecap='square'%3E%3Cpath d='M14 3h6v18h-6'/%3E%3Cpath d='M3 12h11'/%3E%3Cpath d='M10 8l4 4-4 4'/%3E%3C/svg%3E\") center/contain no-repeat";
  var panel = null;

  function locale() {
    try { return localStorage.getItem('kade-locale') === 'en' ? 'en' : 'tr' } catch (error) { return 'tr' }
  }
  function label() { return locale() === 'tr' ? 'GİRİŞ' : 'SIGN IN' }
  function title() { return locale() === 'tr' ? 'Giriş ve kayıt' : 'Sign in and sign up' }

  function render() {
    if (!panel) return;
    var current = locale();
    panel.setAttribute('aria-label', title());
    panel.innerHTML = '<p class="kade-access-panel__label">' + (current === 'tr' ? 'ÇALIŞMA ALANI' : 'WORKSPACE') + '</p>' +
      AREAS.map(function (area) {
        return '<div class="kade-access-panel__area"><strong>' + area[current] + '</strong><small>' + area[current + 'Sub'] + '</small>' +
          '<div class="kade-access-panel__actions">' + area.actions.map(function (action) {
            return '<a href="' + action.href + '"' + (action.primary ? ' data-kade-primary' : '') + '>' + action[current] + ' ↗</a>';
          }).join('') + '</div></div>';
      }).join('');
  }

  function setOpen(open) {
    if (!panel) return;
    panel.classList.toggle('is-open', !!open);
    triggers().forEach(function (trigger) { trigger.setAttribute('aria-expanded', open ? 'true' : 'false') });
  }
  function triggers() {
    return Array.prototype.slice.call(document.querySelectorAll('[data-kade-access-trigger]'));
  }
  function isOpen() { return !!panel && panel.classList.contains('is-open') }

  function buildTrigger(iconOnly) {
    var trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'kade-access-trigger' + (iconOnly ? ' kade-access-trigger--icon' : '');
    trigger.setAttribute('data-kade-access-trigger', '');
    trigger.setAttribute('aria-controls', 'kade-access-panel');
    trigger.setAttribute('aria-expanded', 'false');
    trigger.setAttribute('aria-label', title());
    var icon = document.createElement('i');
    icon.setAttribute('aria-hidden', 'true');
    icon.style.webkitMask = ICON;
    icon.style.mask = ICON;
    trigger.appendChild(icon);
    if (!iconOnly) {
      var text = document.createElement('span');
      text.textContent = label();
      trigger.appendChild(text);
    }
    return trigger;
  }

  function install() {
    if (!panel) {
      panel = document.createElement('nav');
      panel.id = 'kade-access-panel';
      panel.className = 'kade-access-panel';
      document.body.appendChild(panel);
      render();
    }
    /* Klon başlığında tema kontrolü, statik sayfalarda .hud nav içindeki
       tema düğmesi çapa olarak kullanılıyor; ikisinde de dil düğmesinin
       solunda duruyor. */
    var anchor = document.querySelector('header [aria-label^="Theme:"],.hud nav [data-theme-toggle]');
    if (anchor && anchor.parentElement && !anchor.parentElement.querySelector('.kade-access-trigger')) {
      var language = anchor.parentElement.querySelector('.kade-language-toggle');
      anchor.parentElement.insertBefore(buildTrigger(false), language || anchor);
    }
    var mobile = document.querySelector('.kade-mobile-controls');
    if (mobile && !mobile.querySelector('.kade-access-trigger')) {
      mobile.insertBefore(buildTrigger(true), mobile.firstChild ? mobile.firstChild.nextSibling : null);
    }
  }

  document.addEventListener('click', function (event) {
    var trigger = event.target.closest && event.target.closest('[data-kade-access-trigger]');
    if (trigger) {
      event.preventDefault();
      event.stopImmediatePropagation();
      install();
      setOpen(!isOpen());
      return;
    }
    if (isOpen() && !(event.target.closest && event.target.closest('#kade-access-panel'))) setOpen(false);
  }, true);

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && isOpen()) setOpen(false);
  });

  window.addEventListener('kade:localechange', function () {
    render();
    triggers().forEach(function (trigger) {
      trigger.setAttribute('aria-label', title());
      var text = trigger.querySelector('span');
      if (text) text.textContent = label();
    });
  });

  /* Klon ana sayfasında başlık React'in kontrolünde: hidrasyon bitmeden içine
     düğüm eklemek hydration mismatch (React #418) veriyor. kade-brand.js giriş
     animasyonu bittiğinde <html data-kade-loaded> işaretini koyuyor; o gelene
     kadar bekle. Statik rotalarda React yok, hemen kurulabilir. */
  function safeToInstall() {
    if (!document.querySelector('script[src*="/_next/"], script[src*="/_kade/"]')) return true;
    return document.documentElement.hasAttribute('data-kade-loaded');
  }
  var waited = 0;
  var timer = setInterval(function () {
    if (safeToInstall()) install();
    waited += 250;
    /* Ana sayfada mobil kontrol şeridi başlıktan sonra basılıyor: ikisi de
       yerleşene kadar (ya da süre dolana kadar) beklemeye devam et. */
    var header = document.querySelector('header .kade-access-trigger,.hud nav .kade-access-trigger');
    var strip = document.querySelector('.kade-mobile-controls');
    var needsStrip = !!document.querySelector('script[src*="/_next/"], script[src*="/_kade/"]');
    var done = header && (!needsStrip || (strip && strip.querySelector('.kade-access-trigger')));
    if (done || waited > 30000) clearInterval(timer);
  }, 250);
  if (safeToInstall()) install();
})();
