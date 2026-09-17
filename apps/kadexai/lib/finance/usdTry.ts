/**
 * USD/TRY kuru. Öncelik KADE_USD_TRY_RATE ortam değişkeni; yoksa Türkiye
 * Cumhuriyet Merkez Bankası'nın günlük listesindeki efektif olmayan satış kuru
 * (ForexSelling) okunur ve 6 saat önbelleğe alınır. Kur hiçbir zaman uydurulmaz.
 */
const TCMB_URL = 'https://www.tcmb.gov.tr/kurlar/today.xml'
const CACHE_MS = 6 * 60 * 60 * 1000

let cached: { rate: number; source: string; at: number } | null = null

export function parseTcmbUsdSelling(xml: string): number | null {
  const block = xml.match(/<Currency[^>]*CurrencyCode="USD"[^>]*>([\s\S]*?)<\/Currency>/)?.[1]
  const value = Number(block?.match(/<ForexSelling>([\d.]+)<\/ForexSelling>/)?.[1])
  return Number.isFinite(value) && value > 0 ? value : null
}

export async function usdTryRate(request: typeof fetch = fetch): Promise<{ rate: number; source: string } | null> {
  const configured = Number(process.env.KADE_USD_TRY_RATE)
  if (Number.isFinite(configured) && configured > 0) return { rate: configured, source: 'ayar' }
  if (cached && Date.now() - cached.at < CACHE_MS) return { rate: cached.rate, source: cached.source }
  try {
    const response = await request(TCMB_URL, { signal: AbortSignal.timeout(8_000), cache: 'no-store' })
    if (!response.ok) return null
    const rate = parseTcmbUsdSelling(await response.text())
    if (!rate) return null
    cached = { rate, source: 'TCMB günlük kur', at: Date.now() }
    return { rate, source: cached.source }
  } catch {
    return null
  }
}
