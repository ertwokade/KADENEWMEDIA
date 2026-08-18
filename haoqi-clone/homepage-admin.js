(function () {
  'use strict'

  var state = null
  var pageShowCount = 0
  var articleLayouts = [
    'col-span-12 lg:col-span-8 lg:col-start-5',
    'col-span-12 lg:col-start-1 lg:col-span-6 xl:col-span-5',
    'col-span-12 lg:col-span-6 xl:col-span-5 lg:col-start-7 xl:col-start-7',
    'col-span-6 lg:col-start-5 lg:col-span-4 xl:col-start-5 xl:col-span-3',
    'col-span-6 lg:col-start-5 lg:col-span-4 xl:col-start-5 xl:col-span-3',
    'col-span-6 lg:col-start-9 lg:col-span-4 xl:col-start-9 xl:col-span-3',
  ]

  function string(value) { return typeof value === 'string' ? value.trim() : '' }
  function safeUrl(value, fallback) {
    var url = string(value)
    if (!url) return fallback || '#'
    if (/^(\/|#|mailto:|tel:)/.test(url) || /^https:\/\//i.test(url)) return url
    return fallback || '#'
  }
  function setText(node, value) { if (node && typeof value === 'string') node.textContent = value }
  function replaceLines(node, lines) {
    if (!node || !Array.isArray(lines)) return
    node.replaceChildren()
    lines.filter(function (line) { return string(line) }).forEach(function (line) {
      var span = document.createElement('span')
      span.style.opacity = '1'
      span.textContent = line
      node.appendChild(span)
    })
  }

  function applySeo(data) {
    if (string(data.seoTitle)) document.title = data.seoTitle
    if (string(data.seoDescription)) {
      var description = document.querySelector('meta[name="description"]')
      if (description) description.setAttribute('content', data.seoDescription)
    }
  }

  function applyHeader(data) {
    var header = document.querySelector('header')
    if (!header) return
    var top = header.children[0]
    var bottom = header.children[1]
    var logo = top && top.querySelector('a[href="/"]')
    if (logo && string(data.brandName)) logo.textContent = data.brandName
    if (bottom) {
      if (bottom.children[1]) setText(bottom.children[1], data.location)
      if (bottom.children[2]) setText(bottom.children[2], data.coordinates)
    }

    var nav = header.querySelector('.kade-navrow') || (top && top.children[1])
    if (nav && Array.isArray(data.navItems)) {
      var theme = nav.querySelector('[aria-label^="Theme"]') || nav.querySelector('[role="button"]')
      nav.replaceChildren()
      data.navItems.forEach(function (item) {
        if (!item || !string(item.label)) return
        var link = document.createElement('a')
        link.className = 'kade-navadd'
        link.href = safeUrl(item.url, '/')
        link.textContent = item.label
        link.style.cssText = 'font-family:inherit;color:inherit;text-decoration:none;text-transform:uppercase;padding:4px;white-space:nowrap'
        nav.appendChild(link)
      })
      if (theme) {
        var leaf = theme
        while (leaf.firstElementChild) leaf = leaf.firstElementChild
        setText(leaf, data.themeLabel)
        nav.appendChild(theme)
      }
      nav.classList.add('kade-navrow')
      nav.style.opacity = '1'
    }

    var login = document.getElementById('kade-login-btn')
    if (login) {
      setText(login, data.loginLabel)
      login.href = safeUrl(data.loginUrl, '/giris')
      login.style.display = data.showLogin === false ? 'none' : 'inline-flex'
    }
  }

  function applyHero(data) {
    var hero = data.hero || {}
    var heading = Array.prototype.slice.call(document.querySelectorAll('h1')).find(function (node) {
      return node.parentElement && node.parentElement.querySelector('svg.svg-sign') == null
    })
    if (!heading) return
    replaceLines(heading, hero.titleLines)
    var meta = heading.previousElementSibling
    if (!meta || meta.children.length < 3) return
    var kicker = meta.children[0]
    if (Array.isArray(hero.kickerLines)) {
      kicker.replaceChildren()
      hero.kickerLines.forEach(function (line, index) {
        if (index) kicker.appendChild(document.createElement('br'))
        var span = document.createElement('span')
        span.textContent = line
        kicker.appendChild(span)
      })
    }
    setText(meta.children[1], hero.statement)
    setText(meta.children[2], hero.description)
  }

  function applyIntro(data) {
    var sign = document.querySelector('svg.svg-sign')
    if (sign) sign.style.display = data.showSignature === false ? 'none' : ''
    var grid = sign && sign.parentElement && sign.parentElement.parentElement
    var copy = grid && grid.children[1]
    if (!copy) return
    var paragraphs = copy.querySelectorAll('p')
    if (paragraphs[0]) setText(paragraphs[0], data.intro && data.intro.primary)
    if (paragraphs[1]) setText(paragraphs[1], data.intro && data.intro.secondary)
  }

  function createWorkCard(item, index) {
    var article = document.createElement('article')
    article.className = articleLayouts[index % articleLayouts.length]
    var link = document.createElement('a')
    link.className = 'group block space-y-3 p-2'
    link.href = safeUrl(item.url, '/')
    link.setAttribute('aria-label', string(item.title) || 'Çalışma')
    var visual = document.createElement('div')
    visual.className = 'relative w-full overflow-hidden pointer-events-none select-none'
    visual.style.aspectRatio = '1 / 1'
    var imageUrl = safeUrl(item.image, '')
    if (imageUrl && imageUrl !== '#') {
      var image = document.createElement('img')
      image.src = imageUrl
      image.alt = ''
      image.loading = 'lazy'
      image.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block'
      visual.appendChild(image)
    }
    if (string(item.label)) {
      var badge = document.createElement('span')
      badge.className = 'top-0 right-0 z-10 absolute bg-selection px-1 font-mono-2 text-black text-xs uppercase pointer-events-none select-none'
      badge.textContent = item.label
      visual.appendChild(badge)
    }
    var row = document.createElement('div')
    row.className = 'flex justify-between items-center gap-3 min-w-0 text-xs lg:text-sm uppercase'
    var title = document.createElement('span')
    title.className = 'flex-1 min-w-0 truncate'
    title.textContent = string(item.title)
    var label = document.createElement('span')
    label.className = 'font-mono-2 tabular-nums whitespace-nowrap shrink-0'
    label.textContent = string(item.label)
    row.append(title, label)
    link.append(visual, row)
    article.appendChild(link)
    return article
  }

  function applyWorks(data) {
    var section = document.getElementById('selected-work')
    if (!section || !Array.isArray(data.workItems) || !section.firstElementChild) return
    var grid = section.firstElementChild
    grid.replaceChildren()
    data.workItems.filter(function (item) { return item && string(item.title) }).forEach(function (item, index) {
      grid.appendChild(createWorkCard(item, index))
    })
  }

  function applyStatement(data) {
    var footer = document.getElementById('contact')
    var statement = footer && footer.previousElementSibling
    if (!statement || !Array.isArray(data.statementLines)) return
    var holder = Array.prototype.slice.call(statement.querySelectorAll('div')).find(function (node) {
      return node.children.length >= 3 && Array.prototype.every.call(node.children, function (child) { return child.tagName === 'SPAN' })
    })
    if (holder) replaceLines(holder, data.statementLines)
  }

  function applyContact(data) {
    var footer = document.getElementById('contact')
    if (!footer) return
    var targets = []
    Array.prototype.slice.call(footer.children).filter(function (child) {
      return child.classList.contains('grid')
    }).forEach(function (group) {
      Array.prototype.forEach.call(group.children, function (child) { targets.push(child) })
    })
    if (Array.isArray(data.contactLines)) {
      targets.forEach(function (target, index) {
        target.style.display = data.contactLines[index] == null ? 'none' : ''
        if (data.contactLines[index] != null) setText(target, data.contactLines[index])
      })
    }
    var email = footer.querySelector('a[href^="mailto:"]')
    if (email && string(data.email)) {
      email.href = 'mailto:' + data.email
      setText(email, data.email)
    }
    var emailRow = email && email.parentElement
    var socials = emailRow && emailRow.children[1]
    if (socials && Array.isArray(data.socialLinks)) {
      socials.replaceChildren()
      data.socialLinks.forEach(function (item) {
        if (!item || !string(item.label)) return
        var link = document.createElement('a')
        link.href = safeUrl(item.url, '#')
        link.textContent = item.label
        link.className = 'p-2 uppercase pointer-events-auto underline underline-offset-4'
        if (/^https:\/\//.test(item.url || '')) { link.target = '_blank'; link.rel = 'noopener noreferrer' }
        socials.appendChild(link)
      })
    }
  }

  function applyAccent(data) {
    var accent = string(data.accentColor)
    if (!/^#[0-9a-f]{6}$/i.test(accent)) return
    Array.prototype.forEach.call(document.querySelectorAll('.svg-sign__path'), function (path) { path.setAttribute('stroke', accent) })
    var login = document.getElementById('kade-login-btn')
    if (login) login.style.background = accent
  }

  function apply() {
    if (!state) return
    applySeo(state); applyHeader(state); applyHero(state); applyIntro(state)
    applyWorks(state); applyStatement(state); applyContact(state); applyAccent(state)
  }
  function schedule() {
    apply()
    ;[300, 800, 1500, 2500, 4000, 6500, 9000, 12000].forEach(function (delay) { window.setTimeout(apply, delay) })
  }
  function load() {
    fetch('/api/content?section=homepage', { headers: { Accept: 'application/json' }, credentials: 'same-origin' })
      .then(function (response) { if (!response.ok) throw new Error('unavailable'); return response.json() })
      .then(function (payload) {
        if (!payload || !payload.data || typeof payload.data !== 'object') return
        state = payload.data
        schedule()
      })
      .catch(function () {})
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', load)
  else load()
  window.addEventListener('pageshow', function () { if (pageShowCount++ > 0) load() })
})()
