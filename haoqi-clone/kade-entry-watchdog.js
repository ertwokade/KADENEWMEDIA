/* Kade entry watchdog
   The cloned homepage keeps its full-screen entry loader on screen until three
   WebGL models report ready, and each model only reports ready after the R3F
   render loop has drawn 5 frames. A tab that is hidden/occluded (or a browser
   that hands out no WebGL frames) never draws those frames, so the progress bar
   freezes and the page stays blank forever.
   This watchdog notices a progress bar that has not moved for a while and
   reveals the page anyway. If React finishes the entry transition later, the
   override is removed and the site behaves exactly as before. */
(function () {
  'use strict';
  var LOADER_SELECTOR = 'div[class*="left-1/2"][class*="top-1/2"][class*="z-40"]';
  var STALL_MS = 6000;
  var GRACE_MS = 2500;
  var TICK_MS = 250;
  var ATTRIBUTE = 'data-kade-entry-stalled';
  var root = document.documentElement;
  var styleElement = null;
  var lastWidth = null;
  var lastChangeAt = Date.now();

  function loaderElement() {
    return document.querySelector(LOADER_SELECTOR);
  }
  function progressWidth(loader) {
    var inner = loader && loader.querySelector('div[style*="width"]');
    return inner ? inner.style.width : '';
  }
  function ensureStyle() {
    if (styleElement) return;
    styleElement = document.createElement('style');
    styleElement.setAttribute('data-kade-entry-watchdog', '');
    styleElement.textContent = [
      'html[' + ATTRIBUTE + '] div[class*="z-40"][class*="w-[140px]"]{opacity:0!important;pointer-events:none!important}',
      'html[' + ATTRIBUTE + '] div.z-30.fixed.inset-0{opacity:0!important;pointer-events:none!important}',
      'html[' + ATTRIBUTE + '] .invisible[aria-hidden="true"]{visibility:visible!important;pointer-events:auto!important}'
    ].join('\n');
    (document.head || root).appendChild(styleElement);
  }
  function recover() {
    if (root.hasAttribute(ATTRIBUTE)) root.removeAttribute(ATTRIBUTE);
  }
  function reveal() {
    if (root.hasAttribute(ATTRIBUTE)) return;
    ensureStyle();
    root.setAttribute(ATTRIBUTE, '');
    root.setAttribute('data-kade-loaded', '');
  }

  document.addEventListener('visibilitychange', function () {
    /* Coming back to a throttled tab: give the real render loop a chance to
       finish the entry animation on its own before overriding it. */
    if (document.visibilityState !== 'visible' || root.hasAttribute(ATTRIBUTE)) return;
    var elapsed = Date.now() - lastChangeAt;
    if (elapsed > STALL_MS - GRACE_MS) lastChangeAt = Date.now() - (STALL_MS - GRACE_MS);
  });

  setInterval(function () {
    var loader = loaderElement();
    if (!loader) {
      lastWidth = null;
      lastChangeAt = Date.now();
      recover();
      return;
    }
    var width = progressWidth(loader);
    if (width !== lastWidth) {
      lastWidth = width;
      lastChangeAt = Date.now();
      return;
    }
    if (Date.now() - lastChangeAt >= STALL_MS) reveal();
  }, TICK_MS);
})();
