import 'server-only'

import { enrich } from './classify'
import {
  discoveryFromRaw,
  discoveryFromTrend,
  rankDiscoveryResults,
  type DiscoveryCoverage,
  type DiscoveryLanguage,
  type DiscoveryPlatform,
  type DiscoveryResult,
} from './discovery'
import { searchYoutubeNow } from './collectors/youtube'
import { queryTrends } from './store'

const ALL_PLATFORMS: DiscoveryPlatform[] = [
  'tiktok', 'instagram', 'youtube_shorts', 'youtube', 'google', 'reddit', 'music',
]

const PLATFORM_NOTES: Record<DiscoveryPlatform, string> = {
  youtube: 'Canlı YouTube araması ve taze KadeSearch ölçümleri',
  youtube_shorts: 'Canlı Shorts araması ve taze KadeSearch ölçümleri',
  tiktok: 'TikTok Creative Center’dan alınmış taze, gerçek ölçümler',
  instagram: 'Instagram/Reels kaynağından alınmış taze, gerçek ölçümler',
  google: 'Google Trends’in taze arama sinyalleri',
  reddit: 'Tahmini RSS metrikleri popülerlik listesine alınmaz',
  music: 'Müzik listesi ölçümleri',
}

function normalizedPlatforms(value: string[] | undefined) {
  const wanted = new Set((value ?? ALL_PLATFORMS).filter((item): item is DiscoveryPlatform => ALL_PLATFORMS.includes(item as DiscoveryPlatform)))
  return wanted.size ? [...wanted] : ALL_PLATFORMS
}

function matchesLanguage(value: string | null | undefined, language: DiscoveryLanguage) {
  if (!value || value === 'und') return true
  return value.toLocaleLowerCase('en-US').split('-')[0] === language
}

export async function discoverContent(input: {
  query: string
  language: DiscoveryLanguage
  country: string
  periodDays: number
  platforms?: string[]
  limit?: number
}) {
  const query = input.query.replace(/[\u0000-\u001f\u007f]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 120)
  if (query.length < 2) throw new Error('Arama için en az 2 karakter yaz.')
  const country = /^[A-Z]{2}$/.test(input.country) ? input.country : 'TR'
  const periodDays = Math.max(1, Math.min(Math.floor(input.periodDays) || 7, 30))
  const platforms = normalizedPlatforms(input.platforms)
  const limit = Math.max(6, Math.min(Math.floor(input.limit ?? 36), 60))
  const notices: string[] = []

  const [stored, youtube] = await Promise.all([
    queryTrends({
      q: query,
      platform: platforms.join(','),
      country: country === 'ALL' ? 'all' : country,
      language: input.language,
      sinceHours: periodDays * 24,
      sort: 'views',
      limit: Math.min(limit * 5, 300),
    }),
    platforms.some((platform) => platform === 'youtube' || platform === 'youtube_shorts')
      ? searchYoutubeNow({ query, country, language: input.language, periodDays, limit: Math.min(limit, 30) })
      : Promise.resolve({ items: [], source: 'live-web' as const, errors: [] as string[] }),
  ])

  const measured = stored.map(discoveryFromTrend).filter((row): row is DiscoveryResult => Boolean(row))
  const live = youtube.items
    .map((item) => enrich(item))
    .filter((item) => matchesLanguage(item.language, input.language))
    .map((item) => discoveryFromRaw(item, youtube.source))
    .filter((row): row is DiscoveryResult => Boolean(row))

  if (youtube.errors.length && !live.length) {
    notices.push('YouTube canlı araması yanıt vermedi; sonuçlarda yalnız son doğrulanmış KadeSearch ölçümleri kullanıldı.')
  } else if (youtube.errors.length) {
    notices.push('YouTube resmi API yanıt vermedi; canlı web arama yedeği kullanıldı.')
  }

  const results = rankDiscoveryResults([...live, ...measured], limit)
  const coverage: DiscoveryCoverage[] = platforms.map((platform) => {
    const count = results.filter((row) => row.platform === platform).length
    const liveCount = live.filter((row) => row.platform === platform).length
    return {
      platform,
      count,
      mode: liveCount > 0 ? 'live' : count > 0 ? 'measured' : 'unavailable',
      note: count > 0 ? PLATFORM_NOTES[platform] : `${PLATFORM_NOTES[platform]} — bu aramada taze eşleşme bulunamadı`,
    }
  })

  return {
    query,
    language: input.language,
    country,
    periodDays,
    searchedAt: new Date().toISOString(),
    results,
    coverage,
    notices,
  }
}
