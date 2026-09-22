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
import { searchGoogleNow } from './collectors/googleTrends'
import { searchRedditNow } from './collectors/reddit'
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
  google: 'Google’ın konuya dair taze haber ve arama sinyalleri',
  reddit: 'Reddit araması — gerçek bağlantı, beğeni/yorum sayısı yayınlanmıyor',
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
const NO_LIVE_WEB: LiveSearch = { items: [], source: 'live-web', errors: [] }

/**
 * Depolanmis trendler bir "bonus"tur, on kosul degil. Supabase baglanmamissa
 * ya da tablo yoksa canli arama yine de sonuc dondurmeli; eskiden bu hata
 * tum aramayi dusuruyordu.
 */
async function storedTrends(filters: Parameters<typeof queryTrends>[0]) {
  try {
    return { rows: await queryTrends(filters), error: null as string | null }
  } catch (error) {
    return { rows: [], error: error instanceof Error ? error.message : 'bilinmeyen hata' }
  }
}

/** Kaynak, istenen dil/ulke ile sorgulandiysa "und" kayitlari elenmez. */
async function safeSearch(label: string, run: () => Promise<LiveSearch>): Promise<LiveSearch> {
  try {
    return await run()
  } catch (error) {
    return { items: [], source: 'live-web', errors: [`${label}: ${(error as Error).message}`] }
  }
}

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
  const [stored, youtube, tiktokLive, instagramLive, googleLive, redditLive] = await Promise.all([
    storedTrends({
      q: query,
      platform: platforms.join(','),
      country: country === 'ALL' ? 'all' : country,
      language: input.language,
      sinceHours: periodDays * 24,
      sort: 'views',
      limit: Math.min(limit * 5, 300),
    }),
    platforms.some((platform) => platform === 'youtube' || platform === 'youtube_shorts')
      ? safeSearch('YouTube', () => searchYoutubeNow({ query, country, language: input.language, periodDays, limit: Math.min(limit, 30) }))
      : Promise.resolve(NO_LIVE_WEB),
    platforms.includes('tiktok') && tiktok.official
      ? officialSearch('TikTok', () => searchTikTokResearch({ query, country, periodDays, limit: 100 }))
      : Promise.resolve(NO_LIVE),
    platforms.includes('instagram') && instagram.official
      ? officialSearch('Instagram', () => searchInstagramGraph({ query, country, periodDays, limit: 50 }))
      : Promise.resolve(NO_LIVE),
    platforms.includes('google')
      ? safeSearch('Google', () => searchGoogleNow({ query, country, language: input.language, periodDays, limit: 20 }))
      : Promise.resolve(NO_LIVE_WEB),
    platforms.includes('reddit')
      ? safeSearch('Reddit', () => searchRedditNow({ query, periodDays, limit: 25 }))
      : Promise.resolve(NO_LIVE_WEB),
  ])

  const measured = stored.rows
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
      if (detected === input.language) return true
      // Başlık belirsizken Türkçe kanal adı, Türkçe dışı aramaya sızmasın.
      if (input.language !== 'tr' && /[ğışĞİŞ]|TÜRK|Türk/.test(`${row.author ?? ''} ${row.title}`)) return false
      return detected === 'und'
    })
    .map(discoveryFromTrend)
    .filter((row): row is DiscoveryResult => Boolean(row))
  /* Dil suzgeci kaynaga gore degisir. YouTube'un relevanceLanguage'i yalnizca
     siralamayi etkiler, o yuzden dili dogrulanamayan kayit disarida kalir.
     Google Haberler ve Reddit aramasi ise istenen locale ile sorgulanir;
     orada "und" (kisa baslik, dil cikarilamadi) kaydi elenirse platform
     tamamen bos kalir — bu yuzden `und` kabul edilir. */
  const strictLive = [youtube, tiktokLive, instagramLive].flatMap((search) => search.items
    .map((item) => enrich(item))
    .filter((item) => matchesLanguage(item.language, input.language))
    .map((item) => discoveryFromRaw(item, search.source))
    .filter((row): row is DiscoveryResult => Boolean(row)))

  const localeLive = [googleLive, redditLive].flatMap((search) => search.items
    .map((item) => enrich(item))
    .filter((item) => {
      const detected = item.language
      if (detected === input.language || detected === 'und' || !detected) return true
      return false
    })
    .map((item) => discoveryFromRaw(item, search.source))
    .filter((row): row is DiscoveryResult => Boolean(row)))

  const live = [...strictLive, ...localeLive]

  const youtubeLive = live.filter((row) => row.platform === 'youtube' || row.platform === 'youtube_shorts')
  if (youtube.errors.length && !youtubeLive.length) {
    notices.push('YouTube canlı araması yanıt vermedi; sonuçlarda yalnız son doğrulanmış KadeSearch ölçümleri kullanıldı.')
  } else if (youtube.errors.length) {
    notices.push('YouTube resmi API yanıt vermedi; canlı web arama yedeği kullanıldı.')
  }
  for (const error of [...tiktokLive.errors, ...instagramLive.errors, ...googleLive.errors, ...redditLive.errors]) {
    notices.push(`${error}. Bu platformda yalnız son doğrulanmış KadeSearch ölçümleri kullanıldı.`)
  }
  if (stored.error) {
    notices.push('Trend veritabanına ulaşılamadı; sonuçlar yalnızca canlı aramadan geldi.')
  }
  if (platforms.includes('tiktok') && !tiktok.live) {
    notices.push('TikTok canlı erişimi bağlı değil. Doğrulanmamış veya tahmini TikTok sonuçları listeye alınmadı.')
  }
  if (platforms.includes('instagram') && !instagram.live) {
    notices.push('Instagram canlı erişimi bağlı değil. Doğrulanmamış veya tahmini Reels sonuçları listeye alınmadı.')
  }

  if (country !== 'TR' || input.language !== 'tr') {
    notices.push('Ülke seçimi platformun bölge sıralamasına uygulanır; kanalın hangi ülkeden yayın yaptığı platformlarca doğrulanmaz.')
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
