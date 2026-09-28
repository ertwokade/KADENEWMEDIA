import 'server-only'

import { getTikTokResearchVideoById, instagramAccess, tiktokAccess } from '@/lib/kade-search/officialSocial'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  parseTelegramContentLink,
  type TelegramContentLink,
  type TelegramContentPlatform,
} from './telegramContentLinks'
import {
  sortTelegramSavedContent,
  type TelegramContentSort,
  type TelegramSavedContent,
} from './telegramContentPresentation'
import { fetchTelegramPublicMetadata } from './telegramPublicMetadata'

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>

interface CollectedContent {
  link: TelegramContentLink
  title: string | null
  description: string | null
  authorName: string | null
  authorUrl: string | null
  thumbnailUrl: string | null
  publishedAt: string | null
  views: number | null
  likes: number | null
  comments: number | null
  shares: number | null
  saves: number | null
  metadataSource: string
  metricsSource: string | null
  metricsStatus: TelegramSavedContent['metrics_status']
  fetchStatus: 'success' | 'partial' | 'failed'
  fetchError: string | null
}

const SELECT_COLUMNS = [
  'id', 'chat_id', 'platform', 'canonical_url', 'title', 'description', 'author_name',
  'views', 'likes', 'comments', 'shares', 'saves', 'metadata_source', 'metrics_source',
  'metrics_status', 'metric_updated_at', 'added_at', 'updated_at',
].join(',')

function clean(value: unknown, max: number) {
  const text = String(value ?? '').replace(/[\u0000-\u001f\u007f]+/g, ' ').replace(/\s+/g, ' ').trim()
  return text ? [...text].slice(0, max).join('') : null
}

function metric(value: unknown) {
  if (value === null || value === undefined || value === '') return null
  const numeric = Number(value)
  return Number.isFinite(numeric) && numeric >= 0 ? Math.round(numeric) : null
}

function measuredMetric(value: unknown) {
  const numeric = metric(value)
  return numeric !== null && numeric > 0 ? numeric : null
}

function safeError(error: unknown) {
  return clean(error instanceof Error ? error.message : error, 300) ?? 'veri alınamadı'
}

function trustedLocation(location: string, base: string) {
  try {
    const url = new URL(location, base)
    const host = url.hostname.toLocaleLowerCase('en-US').replace(/^www\./, '')
    if (url.protocol !== 'https:' || !['tiktok.com', 'm.tiktok.com', 'vm.tiktok.com', 'vt.tiktok.com'].includes(host)) return null
    return url.toString()
  } catch {
    return null
  }
}

async function resolveTikTokShortLink(link: TelegramContentLink, fetchImpl: FetchLike) {
  if (!link.needsResolution) return link
  let current = link.url
  for (let attempt = 0; attempt < 5; attempt += 1) {
    let response: Response | null = null
    for (const method of ['HEAD', 'GET'] as const) {
      response = await fetchImpl(current, {
        method,
        headers: method === 'GET' ? { Range: 'bytes=0-0' } : undefined,
        cache: 'no-store', redirect: 'manual', signal: AbortSignal.timeout(10_000),
      }).catch(() => null)
      if (method === 'GET') await response?.body?.cancel().catch(() => undefined)
      if (response?.headers.get('location')) break
    }
    const location = response?.headers.get('location')
    if (!location) break
    const next = trustedLocation(location, current)
    if (!next) throw new Error('TikTok kısa bağlantısı güvenli bir adrese yönlenmedi.')
    const parsed = parseTelegramContentLink(next)
    if (parsed && !parsed.needsResolution) return parsed
    current = next
  }
  throw new Error('TikTok kısa bağlantısı çözümlenemedi. Videonun tam bağlantısını gönder.')
}

async function fetchJson(fetchImpl: FetchLike, url: string, init: RequestInit = {}) {
  const response = await fetchImpl(url, {
    ...init, cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(15_000),
  })
  const body = await response.json().catch(() => null) as Record<string, unknown> | null
  return { response, body }
}

async function tiktokOembed(link: TelegramContentLink, fetchImpl: FetchLike) {
  const endpoint = `https://www.tiktok.com/oembed?${new URLSearchParams({ url: link.canonicalUrl })}`
  const { response, body } = await fetchJson(fetchImpl, endpoint)
  if (!response.ok || !body) throw new Error(`TikTok oEmbed metadata yanıtı alınamadı (HTTP ${response.status}).`)
  return {
    title: clean(body.title, 500),
    description: clean(body.title, 2_000),
    authorName: clean(body.author_name, 200),
    authorUrl: clean(body.author_url, 1_000),
    thumbnailUrl: clean(body.thumbnail_url, 2_000),
    source: 'TikTok resmî oEmbed',
  }
}

async function instagramOembed(link: TelegramContentLink, env: NodeJS.ProcessEnv, fetchImpl: FetchLike) {
  const token = env.INSTAGRAM_OEMBED_ACCESS_TOKEN?.trim() || env.INSTAGRAM_GRAPH_ACCESS_TOKEN?.trim()
  if (!token) throw new Error('Instagram oEmbed erişim belirteci tanımlı değil.')
  const version = /^v\d+\.\d+$/.test(env.META_GRAPH_API_VERSION?.trim() ?? '') ? env.META_GRAPH_API_VERSION!.trim() : 'v23.0'
  const params = new URLSearchParams({ url: link.canonicalUrl, access_token: token, omitscript: 'true' })
  const { response, body } = await fetchJson(fetchImpl, `https://graph.facebook.com/${version}/instagram_oembed?${params}`)
  if (!response.ok || !body) throw new Error(`Instagram oEmbed metadata yanıtı alınamadı (HTTP ${response.status}).`)
  return {
    title: clean(body.title, 500),
    description: clean(body.title, 2_000),
    authorName: clean(body.author_name, 200),
    authorUrl: clean(body.author_url, 1_000),
    thumbnailUrl: clean(body.thumbnail_url, 2_000),
    source: 'Instagram resmî oEmbed',
  }
}

async function instagramOwnedMedia(link: TelegramContentLink, env: NodeJS.ProcessEnv, fetchImpl: FetchLike) {
  if (!instagramAccess(env).official) return null
  const token = env.INSTAGRAM_GRAPH_ACCESS_TOKEN!.trim()
  const account = env.INSTAGRAM_BUSINESS_ACCOUNT_ID!.trim()
  const version = /^v\d+\.\d+$/.test(env.META_GRAPH_API_VERSION?.trim() ?? '') ? env.META_GRAPH_API_VERSION!.trim() : 'v23.0'
  const params = new URLSearchParams({
    fields: 'id,caption,media_type,thumbnail_url,permalink,like_count,comments_count,timestamp',
    limit: '100', access_token: token,
  })
  const { response, body } = await fetchJson(fetchImpl, `https://graph.facebook.com/${version}/${account}/media?${params}`)
  if (!response.ok) throw new Error(`Instagram Graph medya listesi alınamadı (HTTP ${response.status}).`)
  const rows = Array.isArray(body?.data) ? body.data as Array<Record<string, unknown>> : []
  const media = rows.find((row) => parseTelegramContentLink(String(row.permalink ?? ''))?.canonicalUrl === link.canonicalUrl)
  if (!media) return null

  const insights = new Map<string, number>()
  const mediaId = clean(media.id, 100)
  if (mediaId) {
    const insightParams = new URLSearchParams({ metric: 'views,reach,saved,shares', access_token: token })
    const insightResult = await fetchJson(fetchImpl, `https://graph.facebook.com/${version}/${mediaId}/insights?${insightParams}`).catch(() => null)
    if (insightResult?.response.ok && Array.isArray(insightResult.body?.data)) {
      for (const row of insightResult.body.data as Array<Record<string, unknown>>) {
        const name = clean(row.name, 40)
        const values = Array.isArray(row.values) ? row.values as Array<{ value?: unknown }> : []
        const value = metric(values.at(-1)?.value)
        if (name && value !== null) insights.set(name, value)
      }
    }
  }
  return {
    title: clean(media.caption, 500), description: clean(media.caption, 2_000),
    thumbnailUrl: clean(media.thumbnail_url, 2_000), publishedAt: clean(media.timestamp, 80),
    views: insights.get('views') ?? null,
    likes: metric(media.like_count), comments: metric(media.comments_count),
    shares: insights.get('shares') ?? null, saves: insights.get('saved') ?? null,
    source: 'Instagram Graph API (bağlı işletme medyası)',
  }
}

async function knownTrend(link: TelegramContentLink) {
  const admin = createAdminClient()
  let query = admin.from('kade_trends')
    .select('id,title,description,author,author_url,thumbnail,published_at,raw')
    .eq('platform', link.platform).eq('inferred', false)
  query = link.externalId ? query.eq('external_id', link.externalId) : query.eq('url', link.canonicalUrl)
  const { data: trend, error } = await query.order('last_seen', { ascending: false }).limit(1).maybeSingle()
  if (error || !trend) return null
  const { data: snapshot } = await admin.from('kade_trend_snapshots')
    .select('views,likes,comments,shares,saves,captured_at')
    .eq('trend_id', trend.id).order('captured_at', { ascending: false }).limit(1).maybeSingle()
  const raw = trend.raw && typeof trend.raw === 'object' ? trend.raw as Record<string, unknown> : {}
  return {
    title: clean(trend.title, 500), description: clean(trend.description, 2_000),
    authorName: clean(trend.author, 200), authorUrl: clean(trend.author_url, 1_000),
    thumbnailUrl: clean(trend.thumbnail, 2_000), publishedAt: clean(trend.published_at, 80),
    // Eski trend anlık görüntülerinde "kaynak vermedi" değeri 0 olarak
    // tutuluyordu. Burada 0'ı gerçek ölçüm gibi sunmayız.
    views: measuredMetric(snapshot?.views), likes: measuredMetric(snapshot?.likes), comments: measuredMetric(snapshot?.comments),
    shares: measuredMetric(snapshot?.shares), saves: measuredMetric(snapshot?.saves),
    metricUpdatedAt: clean(snapshot?.captured_at, 80),
    source: `KadeSearch ölçümü · ${clean(raw.source, 80) || 'doğrulanmış kaynak'}`,
  }
}

function mergeMetric(primary: number | null | undefined, fallback: number | null | undefined) {
  return primary ?? fallback ?? null
}

export async function collectTelegramContent(
  rawUrl: string,
  env: NodeJS.ProcessEnv = process.env,
  fetchImpl: FetchLike = fetch,
): Promise<CollectedContent> {
  const initial = parseTelegramContentLink(rawUrl)
  if (!initial) throw new Error('Yalnız geçerli Instagram Reel veya TikTok video/fotoğraf bağlantısı kabul edilir.')
  const link = await resolveTikTokShortLink(initial, fetchImpl)
  const errors: string[] = []
  let metadata: Awaited<ReturnType<typeof tiktokOembed>> | null = null
  try {
    metadata = link.platform === 'tiktok'
      ? await tiktokOembed(link, fetchImpl)
      : await instagramOembed(link, env, fetchImpl)
  } catch (error) {
    errors.push(safeError(error))
  }
  if (!metadata) {
    try {
      metadata = await fetchTelegramPublicMetadata(link, fetchImpl)
    } catch (error) {
      errors.push(safeError(error))
    }
  }

  const trend = await knownTrend(link).catch((error) => {
    errors.push(safeError(error)); return null
  })
  let direct: {
    title?: string | null; description?: string | null; authorName?: string | null; authorUrl?: string | null
    thumbnailUrl?: string | null; publishedAt?: string | null; views?: number | null; likes?: number | null
    comments?: number | null; shares?: number | null; saves?: number | null; source: string
  } | null = null

  if (link.platform === 'tiktok' && link.externalId && tiktokAccess(env).official) {
    try {
      const item = await getTikTokResearchVideoById(link.externalId, env, fetchImpl)
      if (item) direct = {
        title: clean(item.title, 500), description: clean(item.description, 2_000), authorName: clean(item.author, 200),
        authorUrl: clean(item.author_url, 1_000), thumbnailUrl: clean(item.thumbnail, 2_000), publishedAt: clean(item.published_at, 80),
        views: metric(item.metrics?.views), likes: metric(item.metrics?.likes), comments: metric(item.metrics?.comments),
        shares: metric(item.metrics?.shares), saves: metric(item.metrics?.saves), source: 'TikTok Research API',
      }
    } catch (error) { errors.push(safeError(error)) }
  } else if (link.platform === 'instagram') {
    try { direct = await instagramOwnedMedia(link, env, fetchImpl) } catch (error) { errors.push(safeError(error)) }
  }

  const views = mergeMetric(direct?.views, trend?.views)
  const likes = mergeMetric(direct?.likes, trend?.likes)
  const comments = mergeMetric(direct?.comments, trend?.comments)
  const shares = mergeMetric(direct?.shares, trend?.shares)
  const saves = mergeMetric(direct?.saves, trend?.saves)
  const available = [views, likes, comments, shares, saves].filter((value) => value !== null).length
  const metricsStatus: CollectedContent['metricsStatus'] = available === 0 ? 'unavailable' : available === 5 ? 'available' : 'partial'
  const metricsSource = direct?.source ?? trend?.source ?? null
  const metadataSource = metadata?.source ?? direct?.source ?? trend?.source ?? `${link.platform} bağlantısı (metadata alınamadı)`
  const fetchStatus: CollectedContent['fetchStatus'] = metadata || direct || trend ? (errors.length ? 'partial' : 'success') : 'failed'

  return {
    link,
    title: metadata?.title ?? direct?.title ?? trend?.title ?? null,
    description: metadata?.description ?? direct?.description ?? trend?.description ?? null,
    authorName: metadata?.authorName ?? direct?.authorName ?? trend?.authorName ?? null,
    authorUrl: metadata?.authorUrl ?? direct?.authorUrl ?? trend?.authorUrl ?? null,
    thumbnailUrl: metadata?.thumbnailUrl ?? direct?.thumbnailUrl ?? trend?.thumbnailUrl ?? null,
    publishedAt: direct?.publishedAt ?? trend?.publishedAt ?? null,
    views, likes, comments, shares, saves,
    metadataSource, metricsSource, metricsStatus, fetchStatus,
    fetchError: errors.length ? [...new Set(errors)].join(' ').slice(0, 500) : null,
  }
}

function rowPayload(collected: CollectedContent) {
  const now = new Date().toISOString()
  return {
    platform: collected.link.platform,
    canonical_url: collected.link.canonicalUrl,
    original_url: collected.link.url,
    external_id: collected.link.externalId,
    title: collected.title,
    description: collected.description,
    author_name: collected.authorName,
    author_url: collected.authorUrl,
    thumbnail_url: collected.thumbnailUrl,
    published_at: collected.publishedAt,
    views: collected.views,
    likes: collected.likes,
    comments: collected.comments,
    shares: collected.shares,
    saves: collected.saves,
    metadata_source: collected.metadataSource,
    metrics_source: collected.metricsSource,
    metrics_status: collected.metricsStatus,
    metric_updated_at: collected.metricsSource ? now : null,
    last_fetch_status: collected.fetchStatus,
    last_fetch_error: collected.fetchError,
    updated_at: now,
  }
}

export async function saveTelegramContent(input: { chatId: string; actorId: string; url: string }) {
  const collected = await collectTelegramContent(input.url)
  const admin = createAdminClient()
  const { data: existing } = await admin.from('telegram_saved_content')
    .select('id').eq('chat_id', input.chatId).eq('canonical_url', collected.link.canonicalUrl).maybeSingle()
  const { data, error } = await admin.from('telegram_saved_content').upsert({
    chat_id: input.chatId,
    added_by: input.actorId,
    ...rowPayload(collected),
  }, { onConflict: 'chat_id,canonical_url' }).select(SELECT_COLUMNS).single()
  if (error || !data) throw new Error('İçerik kaydı veritabanına yazılamadı.')
  return { row: data as unknown as TelegramSavedContent, updated: Boolean(existing) }
}

export async function listTelegramContent(input: {
  chatId: string; platform?: TelegramContentPlatform | null; sort?: TelegramContentSort; limit?: number
}) {
  const admin = createAdminClient()
  let query = admin.from('telegram_saved_content').select(SELECT_COLUMNS).eq('chat_id', input.chatId).limit(500)
  if (input.platform) query = query.eq('platform', input.platform)
  const { data, error } = await query
  if (error) throw new Error('Kayıtlı içerikler okunamadı.')
  return sortTelegramSavedContent((data ?? []) as unknown as TelegramSavedContent[], input.sort ?? 'performance')
    .slice(0, Math.max(1, Math.min(input.limit ?? 12, 100)))
}

export async function deleteTelegramContent(chatId: string, reference: string) {
  const rows = await listTelegramContent({ chatId, sort: 'performance', limit: 100 })
  const normalized = reference.trim().toLocaleLowerCase('en-US')
  const selected = /^\d{1,3}$/.test(normalized)
    ? rows[Number(normalized) - 1]
    : rows.find((row) => row.id.toLocaleLowerCase('en-US').startsWith(normalized))
  if (!selected) return null
  const admin = createAdminClient()
  const { error } = await admin.from('telegram_saved_content').delete().eq('id', selected.id).eq('chat_id', chatId)
  if (error) throw new Error('İçerik silinemedi.')
  return selected
}

export async function refreshTelegramContent(chatId: string, limit = 12, platform?: TelegramContentPlatform | null) {
  const rows = await listTelegramContent({ chatId, platform, sort: 'latest', limit })
  let refreshed = 0
  let failed = 0
  for (let index = 0; index < rows.length; index += 3) {
    const batch = rows.slice(index, index + 3)
    const results = await Promise.allSettled(batch.map(async (row) => {
      const collected = await collectTelegramContent(row.canonical_url)
      const { error } = await createAdminClient().from('telegram_saved_content')
        .update(rowPayload(collected)).eq('id', row.id).eq('chat_id', chatId)
      if (error) throw new Error('İçerik güncellenemedi.')
    }))
    refreshed += results.filter((result) => result.status === 'fulfilled').length
    failed += results.filter((result) => result.status === 'rejected').length
  }
  return { total: rows.length, refreshed, failed }
}

export async function telegramContentChatIds() {
  const { data, error } = await createAdminClient().from('telegram_saved_content').select('chat_id').limit(5_000)
  if (error) throw new Error('İçerik sohbetleri okunamadı.')
  return [...new Set((data ?? []).map((row) => String(row.chat_id)))]
}
