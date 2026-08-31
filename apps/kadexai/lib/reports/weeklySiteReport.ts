export interface PageAudit {
  path: string
  status: number
  durationMs: number
  ok: boolean
}

export interface WeeklySiteAudit {
  generatedAt: string
  pages: PageAudit[]
  averageDurationMs: number
  titlePresent: boolean
  h1Present: boolean
  canonicalPresent: boolean
  structuredDataPresent: boolean
  sitemapOk: boolean
  sitemapUrlCount: number
  robotsOk: boolean
  aiCrawlerRules: number
}

const CRITICAL_PATHS = ['/', '/hizmetler', '/portfolio', '/basari-hikayeleri', '/blog', '/iletisim', '/giris/danismanlik', '/kadexai/login']
const AI_CRAWLERS = ['GPTBot', 'ChatGPT-User', 'OAI-SearchBot', 'ClaudeBot', 'Claude-User', 'Google-Extended', 'PerplexityBot', 'Applebot-Extended']

export function weeklySiteReportKey(now = new Date()) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Istanbul', year: 'numeric', month: '2-digit', day: '2-digit',
  })
  return formatter.format(now)
}

async function fetchText(url: string) {
  const started = Date.now()
  try {
    const response = await fetch(url, {
      cache: 'no-store',
      headers: { 'user-agent': 'KadexAI-Site-Audit/1.0' },
      signal: AbortSignal.timeout(15_000),
    })
    return { response, text: await response.text(), durationMs: Date.now() - started }
  } catch {
    return { response: null, text: '', durationMs: Date.now() - started }
  }
}

export async function auditPublicSite(siteUrl: string): Promise<WeeklySiteAudit> {
  const origin = siteUrl.replace(/\/$/, '')
  const results = await Promise.all(CRITICAL_PATHS.map(async (path) => {
    const result = await fetchText(`${origin}${path}`)
    return { path, status: result.response?.status ?? 0, durationMs: result.durationMs, ok: Boolean(result.response?.ok) }
  }))
  const [home, sitemap, robots] = await Promise.all([
    fetchText(`${origin}/`), fetchText(`${origin}/sitemap.xml`), fetchText(`${origin}/robots.txt`),
  ])
  const sitemapUrlCount = (sitemap.text.match(/<loc>/gi) ?? []).length
  const aiCrawlerRules = AI_CRAWLERS.filter((crawler) => new RegExp(`User-agent:\\s*${crawler}`, 'i').test(robots.text)).length
  return {
    generatedAt: new Date().toISOString(),
    pages: results,
    averageDurationMs: Math.round(results.reduce((sum, page) => sum + page.durationMs, 0) / Math.max(results.length, 1)),
    titlePresent: /<title[^>]*>[^<]+<\/title>/i.test(home.text),
    h1Present: /<h1(?:\s|>)/i.test(home.text),
    canonicalPresent: /<link[^>]+rel=["']canonical["']/i.test(home.text),
    structuredDataPresent: /application\/ld\+json/i.test(home.text),
    sitemapOk: Boolean(sitemap.response?.ok && sitemapUrlCount > 0),
    sitemapUrlCount,
    robotsOk: Boolean(robots.response?.ok),
    aiCrawlerRules,
  }
}

function mark(value: boolean) { return value ? '✅' : '❌' }

export function formatWeeklySiteReport(audit: WeeklySiteAudit, dashboardUrl: string) {
  const failures = audit.pages.filter((page) => !page.ok)
  const slow = audit.pages.filter((page) => page.durationMs > 2500)
  const date = new Intl.DateTimeFormat('tr-TR', {
    timeZone: 'Europe/Istanbul', day: 'numeric', month: 'long', year: 'numeric',
  }).format(new Date(audit.generatedAt))
  const lines = [
    '*KadexAI · Haftalık Site Raporu*', date, '',
    `${mark(failures.length === 0)} Kritik sayfalar: ${audit.pages.length - failures.length}/${audit.pages.length} çalışıyor`,
    `${mark(slow.length === 0)} Ortalama yanıt: ${audit.averageDurationMs} ms${slow.length ? ` · ${slow.length} yavaş sayfa` : ''}`,
    `${mark(audit.titlePresent && audit.h1Present && audit.canonicalPresent && audit.structuredDataPresent)} SEO temel etiketleri`,
    `${mark(audit.sitemapOk)} Sitemap: ${audit.sitemapUrlCount} URL`,
    `${mark(audit.robotsOk)} Robots.txt · ${audit.aiCrawlerRules}/8 AI tarayıcı kuralı`,
  ]
  if (failures.length) lines.push('', `Hatalı: ${failures.map((page) => `${page.path} (${page.status || 'erişim yok'})`).join(', ')}`)
  if (slow.length) lines.push(`Yavaş: ${slow.map((page) => `${page.path} (${page.durationMs} ms)`).join(', ')}`)
  lines.push('', `Detay ve araçlar: ${dashboardUrl}`)
  return lines.join('\n').slice(0, 1800)
}
