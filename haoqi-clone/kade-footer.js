/* Ana sayfanın footer'ı yalnızca e-posta ve sosyal bağlantılardan ibaret.
   Statik rotalarda kade-routes.js zaten bir site indeksi basıyor; aynı bilgiyi
   ana sayfaya da kolonlu bir footer olarak ekliyoruz ki hangi sayfada olursan
   ol ajansın tüm alanlarına buradan gidilebilsin. */
(function () {
  'use strict';
  var GROUPS = [
    ['Hizmetler', 'Services', [
      ['/hizmetler/sosyal-medya-yonetimi', 'Sosyal Medya Yönetimi', 'Social Media'],
      ['/hizmetler/icerik-uretimi', 'İçerik Üretimi', 'Content Production'],
      ['/hizmetler/reklam-yonetimi', 'Reklam Yönetimi', 'Advertising'],
      ['/hizmetler/video-produksiyon', 'Video Prodüksiyon', 'Video Production'],
      ['/hizmetler/web-sitesi-tasarimi', 'Web Sitesi Tasarımı', 'Website Design'],
      ['/hizmetler', 'Tüm hizmetler', 'All services']
    ]],
    ['Kurumsal', 'Company', [
      ['/hakkimizda', 'Hakkımızda', 'About'],
      ['/neden-biz', 'Neden Biz', 'Why Us'],
      ['/ekip', 'Ekip', 'Team'],
      ['/kariyer', 'Kariyer', 'Careers'],
      ['/basin', 'Basın', 'Press'],
      ['/iletisim', 'İletişim', 'Contact']
    ]],
    ['Kaynaklar', 'Resources', [
      ['/portfolio', 'Portfolyo', 'Portfolio'],
      ['/referanslar', 'Referanslar', 'References'],
      ['/blog', 'Blog', 'Blog'],
      ['/sss', 'Sık Sorulanlar', 'FAQ'],
      ['/organizasyon-kiti', 'Organizasyon Kiti', 'Organisation Kit'],
      ['/teklif-al', 'Teklif Al', 'Get a Quote']
    ]],
    ['Yasal', 'Legal', [
      ['/kvkk', 'KVKK Aydınlatma Metni', 'Data Protection'],
      ['/gizlilik', 'Gizlilik Politikası', 'Privacy Policy'],
      ['/cerez-politikasi', 'Çerez Politikası', 'Cookie Policy'],
      ['/telif-haklari', 'Telif Hakları', 'Copyright']
    ]]
  ];
  var mounted = null;

  function locale() {
    try { return localStorage.getItem('kade-locale') === 'en' ? 'en' : 'tr' } catch (error) { return 'tr' }
  }

  function build() {
    var tr = locale() === 'tr';
    var wrap = document.createElement('nav');
    wrap.className = 'kade-sitefooter';
    wrap.setAttribute('aria-label', tr ? 'Site haritası' : 'Site map');
    wrap.innerHTML =
      '<div class="kade-sitefooter__grid">' + GROUPS.map(function (group) {
        return '<div class="kade-sitefooter__col"><strong>' + (tr ? group[0] : group[1]) + '</strong>' +
          group[2].map(function (item) {
            return '<a href="' + item[0] + '">' + (tr ? item[1] : item[2]) + '</a>';
          }).join('') + '</div>';
      }).join('') + '</div>' +
      /* Telifi tekrar yazmıyoruz: sahnenin sol-alt sabit HUD'u zaten
         "Kade New Media (c) <yıl>" gösteriyor ve ekranın dibinde duruyor. */
      '<div class="kade-sitefooter__base">' +
        '<span>' + (tr ? 'İstanbul · Sosyal medya, içerik, reklam ve prodüksiyon' : 'İstanbul · Social media, content, advertising and production') + '</span>' +
        '<a href="mailto:thekademedia@gmail.com">thekademedia@gmail.com</a>' +
      '</div>';
    return wrap;
  }

  function install() {
    /* Statik rotalarda kade-routes.js'in indeksi var; iki kez basmayalım. */
    if (document.querySelector('.kade-routes') || document.querySelector('.kade-sitefooter')) return true;
    if (!document.documentElement.hasAttribute('data-kade-loaded')) return false;
    var footer = document.querySelector('footer');
    if (!footer || !footer.parentElement) return false;
    mounted = build();
    footer.parentElement.insertBefore(mounted, footer.nextSibling);
    return true;
  }

  function refresh() {
    if (!mounted || !mounted.parentElement) return;
    var next = build();
    mounted.parentElement.replaceChild(next, mounted);
    mounted = next;
  }

  window.addEventListener('kade:localechange', refresh);

  /* Sol alttaki sabit telif etiketi, site footer'ı görünürken onunla üst üste
     biniyor ve aynı bilgiyi tekrarlıyor; footer görününce geri çekiliyor. */
  function watchOverlap() {
    if (!mounted || !('IntersectionObserver' in window)) return;
    var observer = new IntersectionObserver(function (entries) {
      document.documentElement.classList.toggle('kade-footer-visible', entries[0].isIntersecting);
    }, { threshold: 0.15 });
    observer.observe(mounted);
  }

  var waited = 0;
  var timer = setInterval(function () {
    waited += 300;
    if (install()) { watchOverlap(); clearInterval(timer); return }
    if (waited > 30000) clearInterval(timer);
  }, 300);
  install();
})();
