(function () {
  'use strict'

  var DEFAULTS = {
    navigation: {
      links: [
        { labelTr: 'HİZMETLER', path: '/hizmetler' },
        { labelTr: 'PAKETLER', path: '/paketler' },
        { labelTr: 'PORTFOLYO', path: '/portfolio' },
        { labelTr: 'HAKKIMIZDA', path: '/hakkimizda' },
        { labelTr: 'BLOG', path: '/blog' },
        { labelTr: 'İLETİŞİM', path: '/iletisim' },
      ],
      loginLabelTr: 'GİRİŞ →',
    },
    hero: {
      eyebrow: 'Sosyal Medya & Pazarlama',
      introLine: 'Kade Media — İstanbul merkezli dijital pazarlama ajansı.',
      title1: 'BİZ',
      title2: 'markanı',
      title3: 'büyütüyoruz',
      subtitle: 'Sosyal medya, içerik, reklam ve prodüksiyonla markanı dijitalde konumlandırıyoruz.',
      bodyText: 'Strateji, içerik ve reklamı bir araya getirerek markaların dijitalde düzenli büyümesini sağlıyoruz.',
    },
    services: [
      { slug: 'sosyal-medya-yonetimi', titleTr: 'Sosyal Medya Yönetimi' },
      { slug: 'icerik-uretimi', titleTr: 'İçerik Üretimi' },
      { slug: 'reklam-yonetimi', titleTr: 'Reklam Yönetimi' },
      { slug: 'video-produksiyon', titleTr: 'Video Prodüksiyon' },
      { slug: 'strateji-danismanlik', titleTr: 'Strateji & Danışmanlık' },
      { slug: 'web-sitesi-tasarimi', titleTr: 'Web Sitesi Tasarımı' },
    ],
    footer: {
      email: 'thekademedia@gmail.com',
      displayLines: ['BİRLİKTE', 'HARİKA', 'İŞLER', 'BAŞARALIM'],
    },
  }

  var LEGACY_SERVICE_LABELS = {
    'sosyal-medya-yonetimi': ['Sosyal Medya', 'Sosyal Medya Yönetimi'],
    'icerik-uretimi': ['İçerik Üretimi'],
    'reklam-yonetimi': ['Reklam Yönetimi'],
    'video-produksiyon': ['Video Prodüksiyon'],
    'strateji-danismanlik': ['Dijital Pazarlama', 'Strateji & Danışmanlık'],
    'web-sitesi-tasarimi': ['Marka Tasarımı', 'Web Sitesi Tasarımı'],
  }

  var content = {}

  function isInternalPath(value) {
    return typeof value === 'string' && value.charAt(0) === '/' && value.slice(0, 2) !== '//'
  }

  function findLeaves(slot, originals) {
    var saved = document.querySelectorAll('[data-kade-cms-slot="' + slot + '"]')
    if (saved.length) return Array.prototype.slice.call(saved)

    var matches = []
    var values = originals.map(function (value) { return String(value).trim() })
    var elements = document.querySelectorAll('span, p, a')
    for (var i = 0; i < elements.length; i += 1) {
      var element = elements[i]
      if (element.children.length) continue
      if (values.indexOf((element.textContent || '').trim()) === -1) continue
      element.setAttribute('data-kade-cms-slot', slot)
      matches.push(element)
    }
    return matches
  }

  function setLeaf(slot, originals, value) {
    if (typeof value !== 'string') return
    findLeaves(slot, originals).forEach(function (element) {
      element.textContent = value
    })
  }

  function heroData() {
    var stored = content.hero && content.hero.tr ? content.hero.tr : {}
    return Object.assign({}, DEFAULTS.hero, stored)
  }

  function applyHero() {
    var hero = heroData()
    var headline = document.querySelector('h1.flex.flex-col.self-end')
    if (!headline) {
      var headings = document.querySelectorAll('h1')
      for (var i = 0; i < headings.length; i += 1) {
        if (/BİZ|BIZ|markanı|markani/i.test(headings[i].textContent || '')) {
          headline = headings[i]
          break
        }
      }
    }

    if (headline && headline.children.length >= 3) {
      headline.children[0].textContent = hero.title1
      headline.children[1].textContent = hero.title2
      headline.children[2].textContent = hero.title3
      headline.setAttribute('data-kade-cms-slot', 'hero-title')
    }

    var eyebrowParts = String(hero.eyebrow || '').split('&')
    var eyebrowFirst = eyebrowParts.length > 1 ? eyebrowParts.shift().trim() + ' &' : String(hero.eyebrow || '')
    var eyebrowSecond = eyebrowParts.join('&').trim()
    setLeaf('hero-eyebrow-1', ['Sosyal Medya &', 'Social Media &'], eyebrowFirst)
    setLeaf('hero-eyebrow-2', ['Pazarlama', 'Marketing'], eyebrowSecond)
    setLeaf(
      'hero-intro',
      [
        'Markaları dijitalde büyütüyoruz.',
        'Markaları dijitalde büyütür.',
        'Kade Media — İstanbul merkezli dijital pazarlama ajansı.',
      ],
      hero.introLine
    )
    setLeaf(
      'hero-subtitle',
      [
        'Kade New Media; içerik, reklam ve prodüksiyonla markanızı dijitalde büyütüyoruz.',
        'Kade New Media; içerik, reklam ve prodüksiyonla markanızı dijitalde büyütür.',
        'Sosyal medya, içerik, reklam ve prodüksiyonla markanı dijitalde konumlandırıyoruz.',
      ],
      hero.subtitle
    )
    setLeaf(
      'hero-body',
      ['Strateji, içerik ve reklamı bir araya getirerek markaların dijitalde düzenli büyümesini sağlıyoruz.'],
      hero.bodyText
    )
  }

  function applyNavigation() {
    var navigation = Object.assign({}, DEFAULTS.navigation, content.navigation || {})
    var links = Array.isArray(navigation.links) && navigation.links.length
      ? navigation.links.filter(function (item) { return isInternalPath(item.path) })
      : DEFAULTS.navigation.links
    var box = document.querySelector('.kade-navrow')

    if (box) {
      box.querySelectorAll('.kade-navadd').forEach(function (item) { item.remove() })
      var originalControls = box.querySelectorAll('button')
      originalControls.forEach(function (control) {
        if (/^(HİZMETLER|Hizmetler|İLETİŞİM|İletişim)$/.test((control.textContent || '').trim())) {
          control.style.display = 'none'
        }
      })

      var fragment = document.createDocumentFragment()
      links.forEach(function (item) {
        var anchor = document.createElement('a')
        anchor.href = item.path
        anchor.textContent = item.labelTr || item.labelEn || item.path
        anchor.className = 'kade-navadd'
        anchor.setAttribute('data-kade-cms-nav', '1')
        anchor.style.cssText = 'font-family:inherit;color:inherit;text-decoration:none;text-transform:uppercase;padding:2px 0;transition:opacity .2s;white-space:nowrap'
        anchor.onmouseenter = function () { anchor.style.opacity = '.5' }
        anchor.onmouseleave = function () { anchor.style.opacity = '1' }
        fragment.appendChild(anchor)
      })
      box.insertBefore(fragment, box.firstChild)
    }

    var login = document.getElementById('kade-login-btn')
    if (login) login.textContent = navigation.loginLabelTr || DEFAULTS.navigation.loginLabelTr
  }

  function normalizeInternalLinks() {
    document.querySelectorAll('a[href^="https://kadenewmedia.com/"], a[href^="https://www.kadenewmedia.com/"], a[href^="https://kademedia.com.tr/"], a[href^="https://www.kademedia.com.tr/"]').forEach(function (anchor) {
      try {
        var url = new URL(anchor.href)
        anchor.href = url.pathname + url.search + url.hash
        anchor.removeAttribute('target')
        anchor.removeAttribute('rel')
      } catch (error) {
        // Bozuk bir href, kalan CMS içeriklerinin uygulanmasını engellememeli.
      }
    })
  }

  function findServiceCard(slug) {
    var selectedWork = document.getElementById('selected-work')
    if (!selectedWork) return null
    var direct = selectedWork.querySelector('a[href="/hizmetler/' + slug + '"]')
    if (direct) return direct

    var aliases = LEGACY_SERVICE_LABELS[slug] || []
    var cards = selectedWork.querySelectorAll('a[aria-label]')
    for (var i = 0; i < cards.length; i += 1) {
      var label = (cards[i].getAttribute('aria-label') || '').trim()
      if (aliases.indexOf(label) !== -1) return cards[i]
    }
    return null
  }

  function applyServices() {
    var items = content.services && Array.isArray(content.services.items) && content.services.items.length
      ? content.services.items
      : DEFAULTS.services

    items.forEach(function (service) {
      if (!service || !service.slug) return
      var card = findServiceCard(service.slug)
      if (!card) return
      var title = service.titleTr || service.titleEn || service.slug
      card.href = '/hizmetler/' + service.slug
      card.setAttribute('aria-label', title)
      var titleNode = card.querySelector('.truncate')
      if (titleNode) titleNode.textContent = title
    })
  }

  function socialEntries(footer) {
    return [
      ['Instagram', footer.instagram],
      ['X', footer.twitter],
      ['YouTube', footer.youtube],
      ['TikTok', footer.tiktok],
      ['LinkedIn', footer.linkedin],
    ].filter(function (item) { return /^https:\/\//.test(item[1] || '') })
  }

  function applyFooter() {
    var footer = Object.assign({}, DEFAULTS.footer, content.footer || {})
    var lines = Array.isArray(footer.displayLines) && footer.displayLines.length === 4
      ? footer.displayLines
      : DEFAULTS.footer.displayLines

    DEFAULTS.footer.displayLines.forEach(function (original, index) {
      setLeaf('footer-line-' + index, [original], lines[index])
    })

    var email = document.querySelector('footer a[href^="mailto:"]')
    if (email) {
      email.href = 'mailto:' + footer.email
      var emailLeaf = email.querySelector('span span') || email
      emailLeaf.textContent = footer.email

      var row = email.parentElement
      var socials = row && row.querySelector('div.flex.flex-row')
      if (socials) {
        socials.innerHTML = ''
        socialEntries(footer).forEach(function (entry) {
          var anchor = document.createElement('a')
          anchor.href = entry[1]
          anchor.textContent = entry[0]
          anchor.target = '_blank'
          anchor.rel = 'noopener noreferrer'
          anchor.style.cssText = 'color:inherit;text-decoration:none;text-transform:uppercase;pointer-events:auto;padding:8px'
          socials.appendChild(anchor)
        })
      }
    }
  }

  function applyContent() {
    normalizeInternalLinks()
    applyHero()
    applyNavigation()
    applyServices()
    applyFooter()
  }

  function scheduleApply() {
    applyContent()
    ;[500, 1200, 2400, 4200, 6500].forEach(function (delay) {
      window.setTimeout(applyContent, delay)
    })
  }

  function loadContent() {
    window.fetch('/api/content', { credentials: 'same-origin' })
      .then(function (response) {
        if (!response.ok) throw new Error('Content API unavailable')
        return response.json()
      })
      .then(function (items) {
        if (Array.isArray(items)) {
          items.forEach(function (item) {
            if (item && item.section) content[item.section] = item.data || {}
          })
        }
        scheduleApply()
      })
      .catch(function () {
        scheduleApply()
      })
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadContent)
  } else {
    loadContent()
  }
})()
