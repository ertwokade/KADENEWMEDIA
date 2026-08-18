import 'server-only'

/**
 * Muzik listeleri toplayici (viral sarki tespiti).
 * Kaynak: Apple Marketing Tools RSS (herkese acik, anahtar gerekmez).
 * Kisa video akimlarinin cogu bir sarkiyla baslar; bu liste TikTok ses
 * listeleriyle capraz eslestirilir.
 */
import { getJson } from '../http'
import type { Collector, RawTrendItem } from '../types'

const FEEDS = [
  { id: 'most-played', type: 'songs', label: 'En çok dinlenen şarkılar' },
  { id: 'most-played', type: 'music-videos', label: 'En çok izlenen klipler' },
]

interface AppleFeedResponse {
  feed?: {
    results?: Array<{
      id: string
      name: string
      artistName: string
      url: string
      artworkUrl100?: string
      releaseDate?: string
      genres?: Array<{ name: string }>
    }>
  }
}

async function fetchFeed(country: string, feed: (typeof FEEDS)[number], limit: number): Promise<RawTrendItem[]> {
  const cc = country.toLowerCase()
  const url = `https://rss.applemarketingtools.com/api/v2/${cc}/music/${feed.id}/${Math.min(limit, 100)}/${feed.type}.json`
  const res = await getJson<AppleFeedResponse>(url, { label: `apple-${cc}-${feed.id}` })
  if (!res.ok) throw new Error(res.error)

  const results = res.data?.feed?.results ?? []
  return results.map((s, i) => ({
    platform: 'music',
    kind: 'sound',
    external_id: `apple:${feed.type}:${s.id}`,
    title: s.name,
    author: s.artistName,
    url: s.url,
    thumbnail: s.artworkUrl100 ?? null,
    country,
    rank: i + 1,
    published_at: s.releaseDate ? new Date(s.releaseDate).toISOString() : null,
    hint: `muzik sarki ${(s.genres ?? []).map((g) => g.name).join(' ')}`,
    metrics: {
      // Liste sirasindan hacim tahmini: 1. sira ~ en yuksek
      views: Math.round(5_000_000 / (i + 1)),
      extra: { chart: feed.label, genres: (s.genres ?? []).map((g) => g.name) },
    },
    raw: { genres: (s.genres ?? []).map((g) => g.name), releaseDate: s.releaseDate },
  }))
}

const musicCharts: Collector = {
  id: 'musicCharts',
  label: 'Müzik Listeleri (Apple)',
  platforms: ['music'],

  async collect({ country, limit }) {
    const items: RawTrendItem[] = []
    const errors: string[] = []
    for (const feed of FEEDS) {
      try {
        items.push(...(await fetchFeed(country, feed, limit)))
      } catch (e) {
        errors.push(`music/${feed.id}-${feed.type}/${country}: ${(e as Error).message}`)
      }
    }
    return { items, errors }
  },
}

export default musicCharts
