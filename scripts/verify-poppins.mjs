#!/usr/bin/env node
/**
 * Poppins doğrulayıcı.
 *
 * `font-family` bildirimini CSS'te aramak yeterli değil: bir override,
 * yüklenemeyen bir dosya veya eksik `inherit` yüzünden tarayıcı yine de
 * fallback'e düşebilir. Bu script gerçek tarayıcıda GERÇEKTEN ÇİZİLEN
 * fontu ölçer:
 *   1) getComputedStyle ile beklenen aile adı,
 *   2) document.fonts.check() ile fontun yüklenip yüklenmediği,
 *   3) Türkçe karakterlerin (ı İ ğ Ğ ş Ş ç Ç ö Ö ü Ü) fallback'e düşmediği
 *      — genişlik ölçümüyle, çünkü eksik glif sessizce başka aileden gelir.
 *
 * Kullanım:  node scripts/serve-dist.mjs &   # veya AUDIT_BASE ile canlı site
 *            node scripts/verify-poppins.mjs
 */
import { chromium } from 'playwright'

const BASE = process.env.AUDIT_BASE || 'http://127.0.0.1:4173'

// Layout'u temsil eden rotalar: statik ana sayfa snapshot'ı, ön-render public
// sayfa, admin, giriş, müşteri paneli, Organizasyon Kiti, hata sayfası,
// dinamik profil ve ön-render hizmet detayı.
const ROUTES = [
  '/', '/hakkimizda', '/hizmetler', '/hizmetler/sosyal-medya-yonetimi',
  '/paketler', '/iletisim', '/teklif-al', '/blog', '/partnerler', '/ekip',
  '/admin', '/giris', '/giris/danismanlik', '/musteri-panel', '/proje-takip',
  '/organizasyon-kiti', '/kade-kit-business', '/401', '/bakim', '/@kadirdemir',
]

const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
const failures = []
const rows = []

for (const route of ROUTES) {
  const page = await ctx.newPage()
  try {
    await page.goto(BASE + route, { waitUntil: 'domcontentloaded', timeout: 30000 })
    await page.waitForTimeout(1800)
    await page.evaluate(() => document.fonts.ready).catch(() => {})

    const result = await page.evaluate(() => {
      const first = (el) => el ? getComputedStyle(el).fontFamily.split(',')[0].replace(/["']/g, '').trim() : null

      // Metin taşıyan gerçek elemanlar üzerinden ölç.
      const targets = {
        body: document.body,
        heading: document.querySelector('h1, h2, h3'),
        paragraph: document.querySelector('p'),
        button: document.querySelector('button, .btn, a.btn'),
        input: document.querySelector('input, textarea, select'),
        link: document.querySelector('a[href]'),
        label: document.querySelector('label'),
      }
      const applied = {}
      for (const [key, el] of Object.entries(targets)) applied[key] = first(el)

      // Sayfadaki TÜM görünür metin düğümlerinde kullanılan aileler.
      const families = new Set()
      for (const el of document.querySelectorAll('body *')) {
        if (!el.firstChild || el.firstChild.nodeType !== Node.TEXT_NODE) continue
        if (!el.textContent.trim()) continue
        const r = el.getBoundingClientRect()
        if (r.width === 0 || r.height === 0) continue
        families.add(first(el))
      }

      // Türkçe karakter testi: Poppins ile fallback'in aynı metni farklı
      // genişlikte çizmesi beklenir. Genişlikler eşitse glif Poppins'ten
      // gelmiyor demektir.
      // NOT: ölçüm elemanı sayfanın kendi kurallarından etkilenmemeli.
      // site.html snapshot'ında `body *{font-family:...!important}` kuralı var,
      // bu yüzden ölçüm de !important ile ve <html> altında yapılır.
      const measure = (text, family) => {
        const s = document.createElement('span')
        s.textContent = text
        s.setAttribute('style',
          `position:absolute!important;left:-9999px!important;top:0;white-space:pre;` +
          `font-size:64px!important;font-weight:400!important;font-family:${family}!important`)
        document.documentElement.appendChild(s)
        const w = s.getBoundingClientRect().width
        s.remove()
        return w
      }
      const TR = 'ığĞİŞşÇçÖöÜü'
      const withPoppins = measure(TR, "'Poppins'")
      const withFallback = measure(TR, 'monospace')

      return {
        applied,
        families: [...families].filter(Boolean).sort(),
        fontsLoaded: {
          w400: document.fonts.check('400 16px Poppins'),
          w500: document.fonts.check('500 16px Poppins'),
          w600: document.fonts.check('600 16px Poppins'),
          w700: document.fonts.check('700 16px Poppins'),
        },
        turkish: {
          poppinsWidth: Math.round(withPoppins),
          fallbackWidth: Math.round(withFallback),
          distinct: Math.abs(withPoppins - withFallback) > 1,
        },
      }
    })

    // 1) Her ölçülen elemanın ailesi Poppins olmalı.
    const wrong = Object.entries(result.applied)
      .filter(([, fam]) => fam && fam !== 'Poppins')
    if (wrong.length) {
      failures.push(`${route}: Poppins DEĞİL -> ${wrong.map(([k, v]) => `${k}=${v}`).join(', ')}`)
    }

    // 2) Sayfada Poppins dışı bir metin ailesi kalmamalı (monospace hariç).
    const MONO_OK = /^(ui-monospace|SFMono-Regular|Menlo|Consolas|monospace)$/i
    const strays = result.families.filter((f) => f !== 'Poppins' && !MONO_OK.test(f))
    if (strays.length) {
      failures.push(`${route}: sayfada kalan yabancı font ailesi -> ${strays.join(', ')}`)
    }

    // 3) 400 ve 600 ilk boyada gerekli; yüklenmemişse preload/CSP sorunu var.
    if (!result.fontsLoaded.w400) failures.push(`${route}: Poppins 400 yüklenmedi`)

    // 4) Türkçe glifler Poppins'ten gelmeli.
    if (!result.turkish.distinct) {
      failures.push(`${route}: Türkçe karakterler Poppins'ten çizilmiyor (fallback genişliğiyle aynı)`)
    }

    rows.push({ route, ...result })
    const mark = wrong.length || strays.length ? '✗' : '✓'
    console.log(`${mark} ${route.padEnd(44)} ${result.families.join(', ') || '-'}`)
  } catch (err) {
    failures.push(`${route}: açılamadı — ${err.message.slice(0, 120)}`)
    console.log(`✗ ${route.padEnd(44)} HATA`)
  }
  await page.close()
}

await browser.close()

console.log('\n' + '─'.repeat(70))
if (failures.length) {
  console.error(`Poppins doğrulaması BAŞARISIZ (${failures.length} sorun):`)
  failures.forEach((f) => console.error('  • ' + f))
  process.exit(1)
}
console.log(`Poppins doğrulaması BAŞARILI — ${ROUTES.length} rotanın tamamında tek aile.`)
