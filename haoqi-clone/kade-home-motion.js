(() => {
  const content = {
    hero: [
      ['Design &', 'Sosyal Medya &'],
      ['Engineering', 'Dijital Pazarlama'],
      ['Thinking in systems. Designing with care.', 'Markaları dijitalde büyütüyoruz.'],
      ['I bring', 'BİZ'],
      ['craft & taste', 'MARKANI'],
      ['to digital work', 'BÜYÜTÜYORUZ'],
      ['Innovate', 'MARKA'],
      ['with', 'İLE'],
      ['purpose', 'BÜYÜT'],
      ['Future-first', 'MARKA'],
      ['Always', 'BÜYÜT'],
      ['FUTURE-FIRST', 'MARKA'],
      ['ALWAYS', 'BÜYÜT'],
      ["Let's", 'BİRLİKTE'],
      ['Create', 'HARİKA'],
      ['Something', 'İŞLER'],
      ['Extraordinary', 'BAŞARALIM'],
    ],
    cards: [
      ['Kade Portfolio', '/portfolio', 'İŞ BİRLİĞİ'],
      ['Sosyal Medya', '/hizmetler/sosyal-medya-yonetimi', 'YÖNETİM'],
      ['Dijital Pazarlama', '/hizmetler', 'STRATEJİ'],
      ['Marka Tasarımı', '/hizmetler/icerik-uretimi', 'TASARIM'],
      ['Video Prodüksiyon', '/hizmetler/video-produksiyon', 'PRODÜKSİYON'],
      ['Reklam Yönetimi', '/hizmetler/reklam-yonetimi', 'PERFORMANS'],
      ['Kade Studio', '/hakkimizda', 'STÜDYO'],
      ['Kade Business', '/kade-kit-business', 'BUSINESS'],
      ['Kade Event', '/portfolio', 'ETKİNLİK'],
      ['Kade Design', '/portfolio', 'TASARIM'],
    ],
  };

  const exact = (from, to, root = document.body) => {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    for (const node of nodes) {
      if (node.nodeValue?.trim() === from) node.nodeValue = node.nodeValue.replace(from, to);
    }
  };

  const dynamicText = new Map(content.hero);
  const normalizeTree = (root) => {
    const nodes = [];
    if (root.nodeType === Node.TEXT_NODE) nodes.push(root);
    else {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) nodes.push(walker.currentNode);
    }
    for (const node of nodes) {
      const raw = node.nodeValue || '';
      const value = raw.trim();
      if (dynamicText.has(value)) node.nodeValue = raw.replace(value, dynamicText.get(value));
      else if (value.startsWith('SOUND[')) node.nodeValue = raw.replace('SOUND', 'SES');
      else if (value === 'GMT+8') node.nodeValue = raw.replace('GMT+8', 'GMT+3');
      else if (value === 'CN') node.nodeValue = raw.replace('CN', 'TR');
      else if (value.includes('GMT+8 CN')) node.nodeValue = raw.replace(/GMT\+8 CN/, 'GMT+3 TR');
    }
  };

  const setTextContaining = (fragment, value) => {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (node.nodeValue?.includes(fragment)) node.nodeValue = value;
    }
  };

  const patch = () => {
    document.documentElement.lang = 'tr';
    document.title = 'Kade New Media | Sosyal Medya ve Dijital Pazarlama Ajansı';
    document.querySelector('meta[name="description"]')?.setAttribute('content', 'Kade New Media; strateji, içerik, reklam ve prodüksiyonu bir araya getiren İstanbul merkezli dijital pazarlama ajansı.');

    for (const [from, to] of content.hero) exact(from, to);
    setTextContaining("I'm Haoqi Wen, leading Design Engineering and AI exploration at", 'Kade New Media; strateji, içerik, reklam ve prodüksiyonla markaları dijitalde büyütür.');
    setTextContaining('engineering, and AI at scale', '');
    setTextContaining('I explore how to shape AI-era workflows', 'Strateji, içerik ve reklamı tek bir üretim hattında birleştirerek markalara ölçülebilir dijital büyüme sağlıyoruz.');
    setTextContaining('I’m building reunimos', 'İstanbul merkezli ekibimiz sosyal medya, performans reklamları, video prodüksiyon ve web tasarımı alanlarında çalışıyor.');
    const introLines = document.querySelectorAll('p.text-l1, p.text-l2');
    if (introLines[0]) introLines[0].textContent = 'Strateji, içerik ve reklamı tek bir üretim hattında birleştirerek markalara ölçülebilir dijital büyüme sağlıyoruz.';
    if (introLines[1]) introLines[1].textContent = 'İstanbul merkezli ekibimiz sosyal medya, performans reklamları, video prodüksiyon ve web tasarımı alanlarında çalışıyor.';

    const home = document.querySelector('a[href="/"]');
    if (home) {
      const spans = home.querySelectorAll('span');
      if (spans.length >= 2) {
        spans[0].textContent = 'Kade';
        spans[1].textContent = ' New Media';
      }
      home.setAttribute('aria-label', 'Kade New Media ana sayfa');
    }

    for (const node of document.querySelectorAll('button,a')) {
      const label = node.textContent?.trim();
      if (label === 'Work') {
        node.textContent = 'Hizmetler';
        if (node.tagName === 'A') node.href = '/hizmetler';
        else node.onclick = () => { location.href = '/hizmetler'; };
      }
      if (label === 'Contact') {
        node.textContent = 'İletişim';
        if (node.tagName === 'A') node.href = '/iletisim';
        else node.onclick = () => { location.href = '/iletisim'; };
      }
    }
    exact('THEME[A]', '');
    exact('THEME[D]', 'TEMA[D]');
    exact('THEME[L]', 'TEMA[L]');
    for (const sound of ['SOUND[|]','SOUND[/]','SOUND[\\]','SOUND[—]']) exact(sound, sound.replace('SOUND', 'SES'));
    exact('Shanghai', 'İstanbul');
    exact('GMT+8 CN', 'GMT+3 TR');
    exact('GMT+8', 'GMT+3');
    exact('CN', 'TR');

    const work = document.querySelector('#selected-work');
    if (work) {
      const anchors = [...work.querySelectorAll('article a')].filter((a, i, all) => all.indexOf(a) === i);
      anchors.slice(0, content.cards.length).forEach((anchor, index) => {
        const [title, href, label] = content.cards[index];
        anchor.href = href;
        anchor.setAttribute('aria-label', `${title} sayfasını aç`);
        const titleNode = anchor.querySelector('.flex-1');
        if (titleNode) titleNode.textContent = title;
        const badge = anchor.querySelector('[aria-hidden="true"] span');
        if (badge) badge.textContent = label;
      });
    }

    const email = document.querySelector('a[href^="mailto:"]');
    if (email) {
      email.href = 'mailto:thekademedia@gmail.com';
      email.textContent = 'thekademedia@gmail.com';
    }
    const socials = [...document.querySelectorAll('a[target="_blank"]')].slice(-3);
    const socialData = [
      ['Instagram', 'https://www.instagram.com/kadenewmedia/'],
      ['TikTok', 'https://www.tiktok.com/@kadenewmedia'],
      ['LinkedIn', 'https://www.linkedin.com/company/kadenewmedia/'],
    ];
    socials.forEach((a, i) => {
      if (!socialData[i]) return;
      a.textContent = socialData[i][0];
      a.href = socialData[i][1];
    });
  };

  let attempts = 0;
  const run = () => {
    patch();
    attempts += 1;
    if (attempts < 20) window.setTimeout(run, 350);
  };

  window.addEventListener('load', () => window.setTimeout(() => {
    run();
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'characterData') normalizeTree(mutation.target);
        for (const node of mutation.addedNodes) normalizeTree(node);
      }
    });
    observer.observe(document.body, { subtree: true, childList: true, characterData: true });
    window.setInterval(() => {
      for (const node of document.querySelectorAll('span')) {
        const value = node.textContent || '';
        if (value.startsWith('SOUND[')) node.textContent = value.replace('SOUND', 'SES');
        if (value.includes('GMT+8 CN')) node.textContent = value.replace('GMT+8 CN', 'GMT+3 TR');
      }
    }, 250);
  }, 4500), { once: true });
})();
