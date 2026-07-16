/* =====================================================================
   KADE MOTION — anasayfa editoryal diline hafif hareket (2026-07-16)
   · scroll-reveal: kart/grid öğeleri görünüme girince kademeli belirir
   · kart spotlight: imleç takipli yumuşak gold ışık + hover kalkma
   Global çalışır; JS yoksa/reduced-motion'da hiçbir şey gizlenmez.
   Hero, nav, footer, admin/panel/login hariç tutulur.
   ===================================================================== */
(function () {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  const root = document.documentElement;
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  root.classList.add('kade-motion');
  if (reduce) return; // hareket kapalı: içerik hiç gizlenmez

  const REVEAL = [
    '.glass-card', '.value-card', '.feature-card', '.service-card', '.package-card',
    '.pricing-card', '.contact-card', '.bento-item', '.team-card', '.stat-card',
    '.faq-item', '.process-step', '.info-card', '[class*="-grid"] > *'
  ].join(',');
  const SPOT = [
    '.glass-card', '.value-card', '.feature-card', '.service-card', '.package-card',
    '.pricing-card', '.contact-card', '.bento-item', '.team-card', '.stat-card'
  ].join(',');
  const excluded = (el) => el.closest(
    '[class*="-hero"], .navbar, footer, [class*="admin"], [class*="login"], [class*="cp-"], [class*="musteri"], [class*="panel"]'
  );

  const io = 'IntersectionObserver' in window
    ? new IntersectionObserver((entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          const t = e.target;
          t.classList.add('in-view');
          io.unobserve(t);
          // kart ise: reveal bitince sürekli 3D süzülme animasyonunu başlat (faz kaydır)
          if (t.classList.contains('kade-spot')) {
            setTimeout(() => {
              t.style.animationDelay = (-(Math.random() * 7)).toFixed(2) + 's';
              t.classList.add('kade-idle');
            }, 900);
          }
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 })
    : null;

  function enhance() {
    document.querySelectorAll(REVEAL).forEach((el) => {
      if (el.dataset.kmr || excluded(el)) return;
      el.dataset.kmr = '1';
      el.classList.add('kade-reveal');
      const sibs = el.parentElement
        ? Array.from(el.parentElement.children).filter((c) => c === el || !c.dataset.kmr)
        : [el];
      const i = Math.max(0, sibs.indexOf(el));
      el.style.transitionDelay = Math.min(i, 6) * 70 + 'ms';
      if (io) io.observe(el); else el.classList.add('in-view');
    });

    document.querySelectorAll(SPOT).forEach((el) => {
      if (el.dataset.kms || excluded(el)) return;
      el.dataset.kms = '1';
      el.classList.add('kade-spot');
      const glow = document.createElement('span');
      glow.className = 'kade-spot-glow';
      glow.setAttribute('aria-hidden', 'true');
      const ring = document.createElement('span');
      ring.className = 'kade-spot-ring';
      ring.setAttribute('aria-hidden', 'true');
      const glare = document.createElement('span');
      glare.className = 'kade-spot-glare';
      glare.setAttribute('aria-hidden', 'true');
      el.insertBefore(ring, el.firstChild);
      el.insertBefore(glow, el.firstChild);
      el.appendChild(glare);
      const TILT = 12; // derece — belirgin 3D eğim
      el.addEventListener('pointermove', (ev) => {
        const r = el.getBoundingClientRect();
        if (!r.width || !r.height) return;
        const px = (ev.clientX - r.left) / r.width;
        const py = (ev.clientY - r.top) / r.height;
        el.style.setProperty('--mx', px * 100 + '%');
        el.style.setProperty('--my', py * 100 + '%');
        // !important: sürekli süzülme animasyonunu hover boyunca ez
        el.style.setProperty('transform',
          'perspective(760px) rotateY(' + ((px - 0.5) * 2 * TILT) + 'deg) rotateX(' +
          (-(py - 0.5) * 2 * TILT) + 'deg) translateY(-8px) scale(1.02)', 'important');
      });
      el.addEventListener('pointerleave', () => { el.style.removeProperty('transform'); });
    });

    // manyetik butonlar: gold pill'ler imlece doğru hafifçe çekilir
    document.querySelectorAll('.btn-primary, .knav-giris').forEach((el) => {
      if (el.dataset.kmb) return;
      if (el.closest('[class*="admin"], [class*="login"], [class*="panel"], [class*="musteri"]')) return;
      el.dataset.kmb = '1';
      el.classList.add('kade-magnet');
      const S = 7; // px — çekim gücü
      el.addEventListener('pointermove', (ev) => {
        const r = el.getBoundingClientRect();
        if (!r.width || !r.height) return;
        el.style.transform =
          'translate(' + ((ev.clientX - r.left) / r.width - 0.5) * 2 * S + 'px,' +
          ((ev.clientY - r.top) / r.height - 0.5) * 2 * S + 'px)';
      });
      el.addEventListener('pointerleave', () => { el.style.transform = ''; });
    });
  }

  const run = () => { try { enhance(); } catch (e) { /* sessiz */ } };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
  else run();

  // SPA route değişimleri: #root altını izle, debounce'la yeniden tara
  let t;
  const mo = new MutationObserver(() => { clearTimeout(t); t = setTimeout(run, 120); });
  const target = document.getElementById('root') || document.body;
  if (target) mo.observe(target, { childList: true, subtree: true });
})();
