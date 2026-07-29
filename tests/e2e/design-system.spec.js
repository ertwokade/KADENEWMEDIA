import { test, expect } from '@playwright/test'

/**
 * Tasarım sistemi ve erişilebilirlik regresyon testleri.
 *
 * Kapsam — kabul kriterlerindeki otomatik kontroller:
 *   • Poppins public ve admin layout'larında GERÇEKTEN uygulanıyor
 *   • Türkçe glifler fallback fonta düşmüyor
 *   • Mobilde dokunma hedefleri ve okunabilir font boyutu
 *   • Klavye focus'u görünür
 *   • Mobil menü aria durumunu bildiriyor
 *
 * Not: `font-family` bildirimini CSS'te aramak yetmez — bir override,
 * yüklenemeyen dosya veya eksik `inherit` yüzünden tarayıcı fallback'e
 * düşebilir. Bu yüzden ölçüm getComputedStyle üzerinden yapılır.
 */

// Farklı layout kabuklarını temsil eden rotalar: public pazarlama sayfası,
// ön-render hizmet detayı, form sayfası, giriş ekranı ve admin.
const LAYOUT_ROUTES = [
  '/hakkimizda',
  '/hizmetler/sosyal-medya-yonetimi',
  '/iletisim',
  '/teklif-al',
  '/giris',
  '/admin',
]

/** Elemanın gerçekten çizilen font ailesinin ilk adı. */
const firstFamily = (fontFamily) => fontFamily.split(',')[0].replace(/["']/g, '').trim()

for (const route of LAYOUT_ROUTES) {
  test(`Poppins uygulanıyor: ${route}`, async ({ page }) => {
    await page.goto(route)
    await page.waitForLoadState('networkidle')
    await page.evaluate(() => document.fonts.ready).catch(() => {})

    const applied = await page.evaluate(() => {
      const pick = (selector) => {
        const el = document.querySelector(selector)
        return el ? getComputedStyle(el).fontFamily : null
      }
      return {
        body: pick('body'),
        heading: pick('h1, h2, h3'),
        button: pick('button, .btn, a.btn'),
        input: pick('input, textarea, select'),
      }
    })

    for (const [element, family] of Object.entries(applied)) {
      if (!family) continue // o sayfada yoksa atla
      expect(firstFamily(family), `${route} → ${element}`).toBe('Poppins')
    }
  })
}

test('Türkçe karakterler Poppins ile çiziliyor', async ({ page }) => {
  await page.goto('/hakkimizda')
  await page.waitForLoadState('networkidle')
  await page.evaluate(() => document.fonts.ready).catch(() => {})

  const result = await page.evaluate(() => {
    // Eksik glif sessizce başka aileden gelir; genişlik karşılaştırması bunu
    // yakalar. Ölçüm elemanı sayfa kurallarından etkilenmesin diye <html>
    // altına ve !important ile eklenir.
    const measure = (family) => {
      const span = document.createElement('span')
      span.textContent = 'ığĞİŞşÇçÖöÜü'
      span.setAttribute('style',
        'position:absolute!important;left:-9999px!important;white-space:pre;' +
        `font-size:64px!important;font-weight:400!important;font-family:${family}!important`)
      document.documentElement.appendChild(span)
      const width = span.getBoundingClientRect().width
      span.remove()
      return width
    }
    return {
      loaded: document.fonts.check('400 16px Poppins'),
      poppins: measure("'Poppins'"),
      fallback: measure('monospace'),
    }
  })

  expect(result.loaded, 'Poppins 400 yüklenmedi').toBe(true)
  expect(result.poppins, 'Türkçe glifler Poppins yerine fallback fonttan geliyor')
    .not.toBeCloseTo(result.fallback, 0)
})

test.describe('mobil erişilebilirlik', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('gövde metni mobilde okunabilir boyutta', async ({ page }) => {
    await page.goto('/hakkimizda')
    await page.waitForLoadState('networkidle')

    const tooSmall = await page.evaluate(() => {
      const offenders = []
      for (const el of document.querySelectorAll('p, li, span, a, label, td')) {
        const text = el.textContent?.trim()
        if (!text || text.length < 12) continue
        const rect = el.getBoundingClientRect()
        if (rect.width === 0 || rect.height === 0) continue
        // Yalnız kendi metnini taşıyan düğümleri ölç (kapsayıcıları değil).
        if (el.firstChild?.nodeType !== Node.TEXT_NODE) continue
        const size = parseFloat(getComputedStyle(el).fontSize)
        if (size < 12) offenders.push(`${el.tagName}.${String(el.className).split(' ')[0]}=${size}px`)
      }
      return [...new Set(offenders)].slice(0, 10)
    })

    expect(tooSmall, `12px altında metin: ${tooSmall.join(', ')}`).toEqual([])
  })

  test('mobil menü aria-expanded durumunu bildiriyor', async ({ page }) => {
    await page.goto('/hakkimizda')
    await page.waitForLoadState('networkidle')

    const toggle = page.locator('[aria-expanded]').first()
    if (await toggle.count() === 0) test.skip(true, 'bu layout\'ta menü düğmesi yok')

    await expect(toggle).toHaveAttribute('aria-expanded', 'false')
    await toggle.click()
    await expect(toggle).toHaveAttribute('aria-expanded', 'true')
  })
})

test('klavye focus\'u görünür', async ({ page }) => {
  await page.goto('/iletisim')
  await page.waitForLoadState('networkidle')

  await page.keyboard.press('Tab')
  const focusVisible = await page.evaluate(() => {
    const el = document.activeElement
    if (!el || el === document.body) return { ok: false, reason: 'hiçbir eleman odaklanmadı' }
    const style = getComputedStyle(el)
    // Görünür bir işaret: outline, box-shadow veya belirgin border.
    const hasOutline = style.outlineStyle !== 'none' && parseFloat(style.outlineWidth) > 0
    const hasShadow = style.boxShadow !== 'none'
    return { ok: hasOutline || hasShadow, tag: el.tagName, outline: style.outline, shadow: style.boxShadow }
  })

  expect(focusVisible.ok, `focus göstergesi yok: ${JSON.stringify(focusVisible)}`).toBe(true)
})

test('tek h1 ve doğru başlık hiyerarşisi', async ({ page }) => {
  for (const route of ['/hakkimizda', '/hizmetler', '/iletisim', '/paketler']) {
    await page.goto(route)
    await page.waitForLoadState('networkidle')

    const h1Count = await page.locator('h1').count()
    expect(h1Count, `${route}: h1 sayısı`).toBe(1)
  }
})

// ─────────────────────────────────────────────────────────────────────────────
// Reveal görünürlüğü — "var" değil, "görünüyor"
//
// Bu test, ekranda olan ama GÖRÜNMEYEN içeriği yakalamak için var. Daha önce
// ana sayfadaki <h1> mobilde hiç açılmıyordu: element DOM'daydı, opacity'si
// 1'di, doğru konumdaydı — ama `Reveal` sarmalayıcısı `opacity: 0` /
// `clip-path: inset(0 0 100%)` durumunda kalıyordu. h1 sayısı, font ve taşma
// ölçen testlerin hepsi geçiyordu; kullanıcı boş bir başlık alanı görüyordu.
//
// Kök neden: `clip-path: inset(0 0 100%)` kesişim dikdörtgenini 0 px'e
// indiriyor, bu yüzden intersectionRatio hep 0 kalıyor ve pozitif bir
// IntersectionObserver threshold'u asla tetiklenmiyordu.
//
// Bu yüzden burada KAYDIRMA YAPILMAZ: kaydırmak observer'ı geç de olsa
// tetikleyip hatayı maskeliyor. İlk boyadaki durum ölçülür.
for (const vp of [
  { id: '1440x900', width: 1440, height: 900 },
  { id: '1024x768', width: 1024, height: 768 },
  { id: '390x844', width: 390, height: 844 },
]) {
  test(`ana başlık ilk boyada görünür (${vp.id})`, async ({ page }) => {
    await page.setViewportSize({ width: vp.width, height: vp.height })

    await page.goto('/', { waitUntil: 'domcontentloaded' })

    const measure = () => page.evaluate(() => {
      // Bir öğenin gerçekten boyanıp boyanmadığını atalarıyla birlikte ölçer:
      // öğenin kendi stili doğru olsa bile bir ata onu görünmez yapabilir.
      const chain = (el) => {
        const layers = []
        for (let node = el; node && node !== document.body; node = node.parentElement) {
          const st = getComputedStyle(node)
          const clipPct = st.clipPath && st.clipPath !== 'none'
            ? Math.max(0, ...[...st.clipPath.matchAll(/([\d.]+)%/g)].map((m) => parseFloat(m[1])))
            : 0
          layers.push({
            by: String(node.className || node.tagName).trim(),
            opacity: parseFloat(st.opacity),
            hiddenVisibility: st.visibility === 'hidden',
            clipPct,
          })
        }
        return layers
      }
      // Zincirdeki en kötü değerleri döndür — asıl görünürlük budur.
      const worst = (el) => {
        const layers = chain(el)
        return {
          opacity: Math.min(...layers.map((l) => l.opacity)),
          clipPct: Math.max(...layers.map((l) => l.clipPct)),
          hiddenVisibility: layers.some((l) => l.hiddenVisibility),
          blame: layers.find((l) => l.opacity < 0.99 || l.clipPct > 1 || l.hiddenVisibility)?.by ?? null,
        }
      }

      const h1 = document.querySelector('h1')
      if (!h1) return { error: 'h1 yok' }
      const rect = h1.getBoundingClientRect()
      const cta = document.querySelector('.home-lede__actions a')
      if (!cta) return { error: 'CTA yok' }

      return {
        text: h1.textContent.trim(),
        height: Math.round(rect.height),
        inViewport: rect.top < window.innerHeight && rect.bottom > 0,
        h1: worst(h1),
        cta: worst(cta),
      }
    })

    // Burada ZAMANLAMA İDDİASI YOK — bilerek.
    //
    // Önce "reveal 800 ms'den önce açılmalı" diye ölçüyordum; amaç, içeriğin
    // observer ile mi yoksa 900 ms'lik güvenlik zamanlayıcısıyla mı geldiğini
    // ayırmaktı. Ama dört worker paralel koşarken hydration'ın kendisi 800 ms'i
    // aşabiliyor; eşik makinenin o anki yüküne bağlı hâle geliyor ve test
    // kararsızlaşıyordu (tam suite'te düzenli, tek başına koşunca hiç değil).
    // Yük koşullarına bağlı bir eşik, gerçek bir hatayı değil test ortamını
    // ölçer.
    //
    // İş bölümü şöyle:
    //   • Kilitlenmenin kendisi → tests/unit/design-system.test.js, threshold
    //     değerini doğrudan sabitler. Deterministik, yükten bağımsız.
    //   • Kullanıcının gördüğü sonuç → burası: içerik gerçekten boyanıyor mu?
    //
    // Geçişler bittiğinde gerçekten tam görünür mü?
    //
    // Beklerken AŞAĞIDA DOĞRULANAN HER ÖZELLİK kontrol edilmeli, yoksa test
    // geçişin ortasını ölçer. İki kez ısırdı:
    //   • CTA kendi reveal'ında 210 ms gecikmeli başlar → yalnız h1'i beklemek
    //     CTA'yı opacity ~0,95'te yakalıyordu.
    //   • opacity ve clip-path aynı süreyi kullansa da birlikte bitmiyor →
    //     yalnız opacity'yi beklemek h1'i clipPct=6'da yakalıyordu.
    await page.waitForFunction(() => {
      const done = (el) => {
        const wrap = el?.closest('.kade-reveal')
        if (!wrap) return false
        const st = getComputedStyle(wrap)
        if (parseFloat(st.opacity) <= 0.99) return false
        const clip = st.clipPath
        if (!clip || clip === 'none') return true
        return [...clip.matchAll(/([\d.]+)%/g)].every((m) => parseFloat(m[1]) < 1)
      }
      return done(document.querySelector('h1')) && done(document.querySelector('.home-lede__actions a'))
    }, null, { timeout: 10_000 })

    const settled = await measure()

    expect(settled.error, JSON.stringify(settled)).toBeUndefined()
    expect(settled.height, `h1 yüksekliği: ${JSON.stringify(settled)}`).toBeGreaterThan(20)
    expect(settled.inViewport, `h1 ilk ekranda değil: ${JSON.stringify(settled)}`).toBe(true)
    expect(settled.h1.opacity, `h1 tam görünür değil — ${JSON.stringify(settled.h1)}`).toBeGreaterThan(0.99)
    expect(settled.h1.clipPct, `h1 hâlâ kırpık — ${JSON.stringify(settled.h1)}`).toBeLessThan(1)
    expect(settled.h1.hiddenVisibility, 'h1 visibility:hidden').toBe(false)
    expect(settled.cta.opacity, `CTA tam görünür değil — ${JSON.stringify(settled.cta)}`).toBeGreaterThan(0.99)
  })
}

// Footer kapanış sloganı, kelimeleri `space-between` ve yüzdeli margin'lerle
// zıt köşelere iten bir düzendeydi; masaüstünde cümle zigzag hâline gelip
// okunmuyordu ("BİRLİKTE ... HARİKA" / "İŞLER" / "BAŞARALIM"). Satırların
// aynı sol kenardan başladığını doğrularız — okuma sırası soldan sağa.
test('footer sloganı tek sütunda hizalı (zigzag değil)', async ({ page }) => {
  for (const vp of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(vp)
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(600)

    const lines = await page.evaluate(() =>
      [...document.querySelectorAll('.kfoot-line')].map((el) => {
        const r = el.getBoundingClientRect()
        return { text: el.textContent.trim(), left: Math.round(r.left), width: Math.round(r.width) }
      }))

    expect(lines.length, `${vp.width}px: slogan satırı sayısı`).toBeGreaterThan(1)
    const lefts = lines.map((l) => l.left)
    expect(Math.max(...lefts) - Math.min(...lefts),
      `${vp.width}px: satırlar aynı sol kenardan başlamalı — ${JSON.stringify(lines)}`).toBeLessThanOrEqual(2)
    for (const line of lines) {
      expect(line.width, `${vp.width}px: "${line.text}" genişliği ölçülemedi`).toBeGreaterThan(0)
    }
  }
})
