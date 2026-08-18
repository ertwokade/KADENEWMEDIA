import 'server-only'

/**
 * Instagram / Reels toplayici.
 *
 * Instagram'in halka acik bir "trendler" API'si YOKTUR. Uc kademeli calisiriz:
 *   1) INSTAGRAM_SESSION_ID tanimliysa web ic API'si ile gercek hashtag verisi.
 *   2) Anahtar yoksa herkese acik hashtag sayfasindan og meta verisi okunur.
 *   3) Ikisi de olmazsa "cikarim modu": TikTok + Google sinyallerinden Reels'e
 *      tasinmasi muhtemel akimlar uretilir ve `inferred` ile isaretlenir.
 */
import { createAdminClient } from '@/lib/supabase/admin'
import { getJson, getText } from '../http'
import { parseCount, normalizeText } from '../util'
import type { Collector, RawTrendItem } from '../types'

const IG_APP_ID = '936619743392459'

// Kategori basina her zaman izlenmesi gereken cekirdek hashtag'ler (TR + global)
const SEED_TAGS: Record<string, string[]> = {
  dans: ['dans', 'dancereels', 'dancechallenge', 'koreografi'],
  muzik: ['muzik', 'reelsmusic', 'sarki', 'coversong'],
  komedi: ['komedi', 'komik', 'funnyreels', 'mizah'],
  yemek: ['yemektarifi', 'tarif', 'foodreels', 'mutfak', 'tatli'],
  guzellik: ['makyaj', 'grwm', 'skincare', 'guzellik'],
  moda: ['kombin', 'moda', 'ootd', 'stil'],
  fitness: ['fitness', 'spor', 'antrenman', 'workout'],
  saglik: ['saglik', 'wellness', 'psikoloji'],
  oyun: ['oyun', 'gaming', 'gamer'],
  teknoloji: ['teknoloji', 'tech', 'telefon'],
  yapayzeka: ['yapayzeka', 'ai', 'chatgpt'],
  egitim: ['egitim', 'bilgi', 'ogren'],
  finans: ['yatirim', 'borsa', 'girisimcilik', 'ekonomi'],
  seyahat: ['seyahat', 'gezi', 'tatil', 'travelreels'],
  hayvan: ['kedi', 'kopek', 'petsofinstagram'],
  aile: ['aile', 'bebek', 'annelik'],
  yasam: ['vlog', 'gunluk', 'lifestyle', 'aesthetic'],
  ev: ['dekorasyon', 'evdekorasyonu', 'temizlik'],
  diy: ['kendinyap', 'diy', 'elisi', 'sanat'],
  otomobil: ['araba', 'otomobil', 'modifiye'],
  film: ['dizi', 'film', 'edit', 'netflix'],
  unlu: ['magazin', 'unlu', 'fenomen'],
  haber: ['haber', 'gundem', 'sondakika'],
  spiritual: ['burc', 'astroloji', 'tarot'],
  korku: ['gizem', 'korku', 'paranormal'],
  isyeri: ['kariyer', 'ofis', 'ishayati'],
  toplum: ['sokakroportaji', 'roportaj'],
}

const GLOBAL_TAGS = ['reels', 'reelsinstagram', 'trending', 'viral', 'explore', 'kesfet', 'kesfetteyiz', 'fyp']

interface IgMediaNode {
  code?: string
  caption?: { text?: string }
  user?: { username?: string }
  image_versions2?: { candidates?: Array<{ url?: string }> }
  taken_at?: number
  video_duration?: number
  play_count?: number
  view_count?: number
  like_count?: number
  comment_count?: number
  clips_metadata?: {
    music_info?: {
      music_asset_info?: {
        title?: string
        display_artist?: string
        audio_cluster_id?: string
        id?: string
        cover_artwork_thumbnail_uri?: string
      }
    }
  }
}

/** Oturum cerezi ile gercek hashtag verisi. */
async function fetchTagInfo(tag: string, country: string): Promise<RawTrendItem[]> {
  const sid = process.env.INSTAGRAM_SESSION_ID?.trim()
  const headers: Record<string, string> = {
    'x-ig-app-id': IG_APP_ID,
    referer: `https://www.instagram.com/explore/tags/${tag}/`,
    'x-requested-with': 'XMLHttpRequest',
  }
  if (sid) headers.cookie = `sessionid=${sid};`

  const res = await getJson<Record<string, unknown>>(
    `https://www.instagram.com/api/v1/tags/web_info/?tag_name=${encodeURIComponent(tag)}`,
    { headers, label: `ig-tag-${tag}` }
  )
  if (!res.ok) throw new Error(res.error)

  const root = res.data as Record<string, unknown>
  const d = (root.data ?? root) as Record<string, unknown>
  const top = d.top as { sections?: Array<{ layout_content?: { medias?: Array<{ media?: IgMediaNode }> } }> } | undefined
  const media = top?.sections?.[0]?.layout_content?.medias ?? []
  const count = parseCount(d.media_count ?? d.count ?? 0)

  const items: RawTrendItem[] = [
    {
      platform: 'instagram',
      kind: 'hashtag',
      external_id: tag,
      title: `#${tag}`,
      url: `https://www.instagram.com/explore/tags/${tag}/`,
      country,
      hashtags: [tag],
      metrics: { posts: count },
      raw: { source: 'web_info' },
    },
  ]

  for (const [i, m] of media.slice(0, 12).entries()) {
    const node = (m.media ?? m) as IgMediaNode
    const code = node.code
    if (!code) continue
    items.push({
      platform: 'instagram',
      kind: 'video',
      external_id: code,
      title: (node.caption?.text ?? '').split('\n')[0].slice(0, 140) || `Reel #${tag}`,
      description: (node.caption?.text ?? '').slice(0, 600),
      author: node.user?.username ? `@${node.user.username}` : null,
      author_url: node.user?.username ? `https://www.instagram.com/${node.user.username}/` : null,
      url: `https://www.instagram.com/reel/${code}/`,
      thumbnail: node.image_versions2?.candidates?.[0]?.url ?? null,
      country,
      rank: i + 1,
      published_at: node.taken_at ? new Date(node.taken_at * 1000).toISOString() : null,
      duration_sec: node.video_duration ? Math.round(node.video_duration) : null,
      hashtags: [tag],
      metrics: {
        views: parseCount(node.play_count ?? node.view_count ?? 0),
        likes: parseCount(node.like_count ?? 0),
        comments: parseCount(node.comment_count ?? 0),
        extra: { music: node.clips_metadata?.music_info?.music_asset_info?.title ?? null },
      },
      raw: { music: node.clips_metadata?.music_info?.music_asset_info ?? null },
    })

    // Reel'de kullanilan ses ayri bir trend varligidir
    const music = node.clips_metadata?.music_info?.music_asset_info
    if (music?.title) {
      items.push({
        platform: 'instagram',
        kind: 'sound',
        external_id: String(music.audio_cluster_id ?? music.id ?? music.title),
        title: music.title,
        author: music.display_artist ?? null,
        url: music.audio_cluster_id ? `https://www.instagram.com/reels/audio/${music.audio_cluster_id}/` : null,
        thumbnail: music.cover_artwork_thumbnail_uri ?? null,
        country,
        hint: 'muzik ses reels audio',
        metrics: { posts: 0 },
        raw: music as unknown as Record<string, unknown>,
      })
    }
  }
  return items
}

/** Oturumsuz: herkese acik sayfadan gonderi sayisini okumayi dene. */
async function scrapeTagCount(tag: string, country: string): Promise<RawTrendItem[]> {
  const res = await getText(`https://www.instagram.com/explore/tags/${encodeURIComponent(tag)}/`, {
    label: `ig-scrape-${tag}`,
  })
  if (!res.ok) throw new Error(res.error)
  const m = res.data.match(/content="([\d.,KMBkmb\s]+)\s*(?:posts|gönderi|gonderi)/i)
  if (!m) throw new Error('gönderi sayısı bulunamadı (giriş duvarı)')
  return [
    {
      platform: 'instagram',
      kind: 'hashtag',
      external_id: tag,
      title: `#${tag}`,
      url: `https://www.instagram.com/explore/tags/${tag}/`,
      country,
      hashtags: [tag],
      metrics: { posts: parseCount(m[1]) },
      raw: { source: 'og-scrape' },
    },
  ]
}

/**
 * Cikarim modu: TikTok'ta yukselen hashtag/sesler Reels'e ~1-3 hafta icinde tasinir.
 */
async function inferFromOtherPlatforms(country: string, limit: number): Promise<RawTrendItem[]> {
  const db = createAdminClient()
  const { data } = await db
    .from('kade_trend_current')
    .select('title, kind, author, category, score, posts, views')
    .in('platform', ['tiktok', 'google', 'music'])
    .in('kind', ['hashtag', 'sound', 'topic'])
    .order('score', { ascending: false, nullsFirst: false })
    .limit(limit)

  return (data ?? []).map((r, i) => ({
    platform: 'instagram',
    kind: r.kind === 'sound' ? 'sound' : 'hashtag',
    external_id: `inferred:${normalizeText(r.title)}`,
    title: r.title,
    author: r.author,
    description:
      '[ÇIKARIM] Bu trend diğer platformlarda yükselişte; Reels tarafına taşınması bekleniyor. Gerçek Instagram ölçümü değildir.',
    url:
      r.kind === 'hashtag'
        ? `https://www.instagram.com/explore/tags/${encodeURIComponent(normalizeText(r.title).replace(/[^a-z0-9]/g, ''))}/`
        : `https://www.instagram.com/explore/search/keyword/?q=${encodeURIComponent(r.title)}`,
    country,
    rank: i + 1,
    sourceCategory: r.category,
    metrics: {
      posts: Math.round((r.posts ?? 0) * 0.35),
      views: Math.round((r.views ?? 0) * 0.3),
      extra: { inferred: true, sourceScore: r.score },
    },
    inferred: true,
    raw: { inferred: true, basis: 'tiktok/google sinyali' },
  }))
}

const instagram: Collector = {
  id: 'instagram',
  label: 'Instagram Reels',
  platforms: ['instagram'],

  async collect({ country, limit }) {
    const items: RawTrendItem[] = []
    const errors: string[] = []
    const hasSession = Boolean(process.env.INSTAGRAM_SESSION_ID?.trim())

    // Izlenecek hashtag havuzu: cekirdek + veritabanindaki populer TikTok hashtag'leri
    const db = createAdminClient()
    const { data: dbTagRows } = await db
      .from('kade_trends')
      .select('title')
      .eq('platform', 'tiktok')
      .eq('kind', 'hashtag')
      .order('last_seen', { ascending: false })
      .limit(25)

    const dbTags = (dbTagRows ?? [])
      .map((r) => normalizeText(r.title).replace(/[^a-z0-9]/g, ''))
      .filter(Boolean)

    const tags = [...new Set([...GLOBAL_TAGS, ...Object.values(SEED_TAGS).flat(), ...dbTags])].slice(
      0,
      hasSession ? 45 : 18
    )

    let liveOk = 0
    for (const tag of tags) {
      try {
        items.push(...(hasSession ? await fetchTagInfo(tag, country) : await scrapeTagCount(tag, country)))
        liveOk++
      } catch (e) {
        errors.push(`instagram/${tag}: ${(e as Error).message}`)
      }
    }

    // Canli veri alinamadiysa cikarim moduna dus
    if (liveOk === 0) {
      const inferred = await inferFromOtherPlatforms(country, limit)
      return { items: inferred, errors: [], note: 'çıkarım modu (tahmin) — canlı veri alınamadı' }
    }

    return {
      items,
      errors: errors.slice(0, 5),
      note: hasSession ? 'oturumlu web API' : 'herkese açık sayfa',
    }
  },
}

export default instagram
