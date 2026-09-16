import 'server-only'

import { detectLanguage, enrich } from './classify'
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
import { instagramAccess, searchInstagramGraph, searchTikTokResearch, tiktokAccess } from './officialSocial'
import { queryTrends } from './store'
import type { RawTrendItem } from './types'

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
  // YouTube relevanceLanguage yalnızca sıralamayı etkiler; farklı dildeki
  // videoları tamamen elemez. Dilini doğrulayamadığımız canlı kaydı seçilen
  // dile aitmiş gibi göstermek yerine dışarıda bırakıyoruz.
  if (!value || value === 'und') return false
  return value.toLocaleLowerCase('en-US').split('-')[0] === language
}

function coverageNote(platform: DiscoveryPlatform) {
  if (platform === 'tiktok') {
    const mode = tiktokAccess().mode
    if (mode === 'official') return 'TikTok Research API ile canlı arama ve taze ölçümler'
    if (mode === 'none') return 'TikTok canlı erişimi bağlı değil; tahmini TikTok sonucu gösterilmiyor'
  }
  if (platform === 'instagram') {
    const mode = instagramAccess().mode
    if (mode === 'official') return 'Instagram Graph API hashtag araması (Meta izlenme sayısı vermez; beğeni ve yorum gerçek)'
    if (mode === 'none') return 'Instagram canlı erişimi bağlı değil; tahmini Reels sonucu gösterilmiyor'
  }
  return PLATFORM_NOTES[platform]
}

type LiveSearch = { items: RawTrendItem[]; source: 'live-api' | 'live-web'; errors: string[] }

const NO_LIVE: LiveSearch = { items: [], source: 'live-api', errors: [] }

async function officialSearch(label: string, run: () => Promise<RawTrendItem[]>): Promise<LiveSearch> {
  try {
    return { items: await run(), source: 'live-api', errors: [] }
  } catch (error) {
    // OfficialApiError mesajları sır içermez; diğer hatalar genel metne indirgenir.
    const message = (error as Error).name === 'OfficialApiError' ? (error as Error).message : 'beklenmeyen hata'
    return { items: [], source: 'live-api', errors: [`${label}: ${message}`] }
  }
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

  const tiktok = tiktokAccess()
  const instagram = instagramAccess()
  const [stored, youtube, tiktokLive, instagramLive] = await Promise.all([
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
    platforms.includes('tiktok') && tiktok.official
      ? officialSearch('TikTok', () => searchTikTokResearch({ query, country, periodDays, limit: 100 }))
      : Promise.resolve(NO_LIVE),
    platforms.includes('instagram') && instagram.official
      ? officialSearch('Instagram', () => searchInstagramGraph({ query, country, periodDays, limit: 50 }))
      : Promise.resolve(NO_LIVE),
  ])

  const measured = stored
    .filter((row) => {
      const detected = detectLanguage({
        platform: row.platform,
        kind: row.kind,
        title: row.title,
        description: row.description,
        author: row.author,
      })
      // Eski kayıtlardaki hatalı dil etiketlerini canlı keşfe taşımıyoruz.
      // Metin belirsizse DB etiketi (sorguda zaten seçilen dil) geçerli kalır.
      return detected === 'und' || detected === input.language
    })
    .map(discoveryFromTrend)
    .filter((row): row is DiscoveryResult => Boolean(row))
  const live = [youtube, tiktokLive, instagramLive].flatMap((search) => search.items
    .map((item) => enrich(item))
    .filter((item) => matchesLanguage(item.language, input.language))
    .map((item) => discoveryFromRaw(item, search.source))
    .filter((row): row is DiscoveryResult => Boolean(row)))

  const youtubeLive = live.filter((row) => row.platform === 'youtube' || row.platform === 'youtube_shorts')
  if (youtube.errors.length && !youtubeLive.length) {
    notices.push('YouTube canlı araması yanıt vermedi; sonuçlarda yalnız son doğrulanmış KadeSearch ölçümleri kullanıldı.')
  } else if (youtube.errors.length) {
    notices.push('YouTube resmi API yanıt vermedi; canlı web arama yedeği kullanıldı.')
  }
  for (const error of [...tiktokLive.errors, ...instagramLive.errors]) {
    notices.push(`${error}. Bu platformda yalnız son doğrulanmış KadeSearch ölçümleri kullanıldı.`)
  }
  if (platforms.includes('tiktok') && !tiktok.live) {
    notices.push('TikTok canlı erişimi bağlı değil. Doğrulanmamış veya tahmini TikTok sonuçları listeye alınmadı.')
  }
  if (platforms.includes('instagram') && !instagram.live) {
    notices.push('Instagram canlı erişimi bağlı değil. Doğrulanmamış veya tahmini Reels sonuçları listeye alınmadı.')
  }

  const results = rankDiscoveryResults([...live, ...measured], limit)
  const coverage: DiscoveryCoverage[] = platforms.map((platform) => {
    const count = results.filter((row) => row.platform === platform).length
    const liveCount = live.filter((row) => row.platform === platform).length
    const baseNote = coverageNote(platform)
    return {
      platform,
      count,
      mode: liveCount > 0 ? 'live' : count > 0 ? 'measured' : 'unavailable',
      note: count > 0 ? baseNote : `${baseNote} — bu aramada taze eşleşme bulunamadı`,
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
