import 'server-only'

/**
 * Trend Radar veri katmani (Supabase).
 *
 * Okuma: kullanicinin oturumuyla (RLS gecerli) `kade_trend_current` gorunumu.
 * Yazma: yalnizca service-role. Toplama isi ortak havuza yazar, kisiye ozel degildir.
 */
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { normalizeText, stableHash } from './util'
import { scoreTrend } from './score'
import { similarity } from './util'
import type {
  CurrentTrendRow,
  EnrichedTrendItem,
  ScoreRecord,
  SnapshotRow,
  TrendAlert,
  TrendFilters,
  TrendRow,
} from './types'

const CHUNK = 200

function chunked<T>(rows: T[], size = CHUNK): T[][] {
  const out: T[][] = []
  for (let i = 0; i < rows.length; i += size) out.push(rows.slice(i, i + size))
  return out
}

export function trendId(platform: string, kind: string, externalId?: string | null, title?: string | null) {
  return `${platform}:${kind}:${stableHash(externalId || title || '')}`
}

/* --------------------------------- Yazma --------------------------------- */

export async function startRun(sources: string[], countries: string[]) {
  const db = createAdminClient()
  const id = `run_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
  await db.from('kade_trend_runs').insert({
    id,
    started_at: new Date().toISOString(),
    status: 'running',
    sources,
    countries,
  })
  return id
}

export async function finishRun(
  id: string,
  opts: { found?: number; added?: number; errors?: string[]; startedMs?: number }
) {
  const db = createAdminClient()
  const { found = 0, added = 0, errors = [], startedMs } = opts
  await db
    .from('kade_trend_runs')
    .update({
      finished_at: new Date().toISOString(),
      status: errors.length ? 'partial' : 'ok',
      items_found: found,
      items_new: added,
      errors,
      duration_ms: startedMs ? Date.now() - startedMs : null,
    })
    .eq('id', id)
}

/**
 * Trendleri ekler/gunceller ve her biri icin bir olcum satiri yazar.
 * `first_seen` korunur; url/thumbnail/author gibi alanlar yalnizca yeni deger
 * doluysa guncellenir (SQLite surumundeki COALESCE davranisi).
 */
export async function upsertTrends(items: EnrichedTrendItem[], runId: string | null) {
  if (!items.length) return { found: 0, added: 0 }
  const db = createAdminClient()
  const ts = new Date().toISOString()

  const withIds = items.map((item) => ({
    item,
    id: trendId(item.platform, item.kind, item.external_id, item.title),
  }))

  // Ayni turda tekrar eden kimlikleri tek satira indir (upsert cakismasini onler)
  const byId = new Map<string, EnrichedTrendItem>()
  for (const { id, item } of withIds) byId.set(id, item)

  const ids = [...byId.keys()]
  const existing = new Map<string, { first_seen: string; url: string | null; thumbnail: string | null; author: string | null; description: string | null }>()
  for (const part of chunked(ids)) {
    const { data } = await db
      .from('kade_trends')
      .select('id, first_seen, url, thumbnail, author, description')
      .in('id', part)
    for (const row of data ?? []) existing.set(row.id, row)
  }

  const trendRows = [...byId.entries()].map(([id, item]) => {
    const prev = existing.get(id)
    return {
      id,
      platform: item.platform,
      kind: item.kind,
      external_id: item.external_id ?? null,
      title: item.title ?? '',
      normalized: item.normalized ?? '',
      url: item.url ?? prev?.url ?? null,
      thumbnail: item.thumbnail ?? prev?.thumbnail ?? null,
      author: item.author ?? prev?.author ?? null,
      author_url: item.author_url ?? null,
      description: item.description ?? prev?.description ?? null,
      category: item.category ?? null,
      subcategories: item.subcategories ?? [],
      formats: item.formats ?? [],
      country: item.country ?? null,
      language: item.language ?? null,
      duration_sec: item.duration_sec ?? null,
      published_at: item.published_at ?? null,
      first_seen: prev?.first_seen ?? ts,
      last_seen: ts,
      inferred: Boolean(item.inferred),
      raw: (item.raw ?? {}) as Record<string, unknown>,
    }
  })

  for (const part of chunked(trendRows)) {
    const { error } = await db.from('kade_trends').upsert(part, { onConflict: 'id' })
    if (error) throw new Error(`trend yazilamadi: ${error.message}`)
  }

  const snapshotRows = [...byId.entries()].map(([id, item]) => {
    const m = item.metrics ?? {}
    return {
      trend_id: id,
      run_id: runId,
      captured_at: ts,
      rank: item.rank ?? null,
      views: Math.round(m.views ?? 0),
      likes: Math.round(m.likes ?? 0),
      comments: Math.round(m.comments ?? 0),
      shares: Math.round(m.shares ?? 0),
      saves: Math.round(m.saves ?? 0),
      posts: Math.round(m.posts ?? 0),
      followers: Math.round(m.followers ?? 0),
      extra: (m.extra ?? {}) as Record<string, unknown>,
    }
  })

  for (const part of chunked(snapshotRows)) {
    const { error } = await db.from('kade_trend_snapshots').insert(part)
    if (error) throw new Error(`olcum yazilamadi: ${error.message}`)
  }

  const added = ids.filter((id) => !existing.has(id)).length
  return { found: byId.size, added }
}

export async function addAlerts(
  rows: Array<{ trend_id: string | null; type: string; message: string; severity?: string }>
) {
  if (!rows.length) return 0
  const db = createAdminClient()
  let written = 0
  for (const part of chunked(rows.map((r) => ({ ...r, severity: r.severity ?? 'info' })))) {
    // watchlist/cross_platform icin tekil indeks var; cakisanlar sessizce atlanir
    const { error, count } = await db
      .from('kade_trend_alerts')
      .upsert(part, { onConflict: 'trend_id,type', ignoreDuplicates: true, count: 'exact' })
    if (!error) written += count ?? part.length
  }
  return written
}

/* --------------------------------- Okuma --------------------------------- */

const SORT_COLUMNS: Record<string, { column: string; ascending: boolean }> = {
  score: { column: 'score', ascending: false },
  velocity: { column: 'velocity', ascending: false },
  views: { column: 'views', ascending: false },
  new: { column: 'first_seen', ascending: false },
  title: { column: 'title', ascending: true },
}

/** Pano ve API'nin ana sorgusu: son skor + son olcumle birlikte trendler. */
export async function queryTrends(filters: TrendFilters = {}): Promise<CurrentTrendRow[]> {
  const supabase = await createClient()
  let q = supabase.from('kade_trend_current').select('*')

  if (filters.platform && filters.platform !== 'all') {
    q = q.in('platform', String(filters.platform).split(','))
  }
  if (filters.kind && filters.kind !== 'all') {
    q = q.in('kind', String(filters.kind).split(','))
  }
  if (filters.category && filters.category !== 'all') q = q.eq('category', filters.category)
  if (filters.country && filters.country !== 'all') q = q.eq('country', filters.country)
  if (filters.stage && filters.stage !== 'all') q = q.eq('stage', filters.stage)
  if (filters.format && filters.format !== 'all') q = q.contains('formats', [filters.format])
  if (filters.q) {
    const like = `%${String(filters.q).replace(/[%,()]/g, ' ').trim()}%`
    q = q.or(`normalized.ilike.${like},title.ilike.${like},author.ilike.${like}`)
  }
  if (filters.sinceHours) {
    q = q.gte('last_seen', new Date(Date.now() - Number(filters.sinceHours) * 36e5).toISOString())
  }
  if (filters.minScore) q = q.gte('score', Number(filters.minScore))

  const sort = SORT_COLUMNS[filters.sort ?? 'score'] ?? SORT_COLUMNS.score
  const limit = Math.min(Number(filters.limit ?? 50), 300)
  const offset = Number(filters.offset ?? 0)

  const { data, error } = await q
    .order(sort.column, { ascending: sort.ascending, nullsFirst: false })
    .range(offset, offset + limit - 1)

  if (error) throw new Error(error.message)
  return (data ?? []) as CurrentTrendRow[]
}

export async function getTrendDetail(id: string) {
  const supabase = await createClient()
  const { data: trend } = await supabase.from('kade_trend_current').select('*').eq('id', id).maybeSingle()
  if (!trend) return null

  const [{ data: history }, { data: scoreHistory }, { data: links }] = await Promise.all([
    supabase
      .from('kade_trend_snapshots')
      .select('captured_at, views, likes, comments, shares, posts, rank')
      .eq('trend_id', id)
      .order('captured_at', { ascending: true })
      .limit(200),
    supabase
      .from('kade_trend_scores')
      .select('computed_at, score, velocity, stage')
      .eq('trend_id', id)
      .order('computed_at', { ascending: true })
      .limit(200),
    supabase
      .from('kade_trend_links')
      .select('a_id, b_id, confidence, reason')
      .or(`a_id.eq.${id},b_id.eq.${id}`)
      .order('confidence', { ascending: false })
      .limit(40),
  ])

  const relatedIds = (links ?? []).map((l) => (l.a_id === id ? l.b_id : l.a_id))
  let related: Array<{ id: string; title: string; platform: string; kind: string; confidence: number; reason: string | null }> = []
  if (relatedIds.length) {
    const { data: rows } = await supabase
      .from('kade_trends')
      .select('id, title, platform, kind')
      .in('id', relatedIds)
    const byId = new Map((rows ?? []).map((r) => [r.id, r]))
    const seen = new Set<string>()
    related = (links ?? [])
      .map((l) => {
        const other = byId.get(l.a_id === id ? l.b_id : l.a_id)
        if (!other) return null
        return { ...other, confidence: l.confidence, reason: l.reason }
      })
      .filter((r): r is { id: string; title: string; platform: string; kind: string; confidence: number; reason: string | null } => Boolean(r))
      .filter((r) => {
        const key = `${r.platform}:${r.title.toLowerCase()}`
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })
      .slice(0, 20)
  }

  return { ...(trend as CurrentTrendRow), history: history ?? [], scoreHistory: scoreHistory ?? [], related }
}

export async function recentAlerts(limit = 50): Promise<Array<TrendAlert & { title?: string | null; platform?: string | null; url?: string | null }>> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('kade_trend_alerts')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(Math.min(limit, 200))

  const alerts = (data ?? []) as TrendAlert[]
  const ids = [...new Set(alerts.map((a) => a.trend_id).filter((x): x is string => Boolean(x)))]
  if (!ids.length) return alerts
  const { data: trends } = await supabase.from('kade_trends').select('id, title, platform, url').in('id', ids)
  const byId = new Map((trends ?? []).map((t) => [t.id, t]))
  return alerts.map((a) => ({ ...a, ...(a.trend_id ? byId.get(a.trend_id) : undefined) }))
}

export async function statsSummary() {
  const supabase = await createClient()
  // Sayim hatasi yutulursa pano "0 trend" gosterir ve sorunu gizler; hata yukari verilir.
  const countOf = async (table: string) => {
    const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true })
    if (error) throw new Error(error.message)
    return count ?? 0
  }

  const [trends, snapshots, links] = await Promise.all([
    countOf('kade_trends'),
    countOf('kade_trend_snapshots'),
    countOf('kade_trend_links'),
  ])

  const { count: unseenAlerts } = await supabase
    .from('kade_trend_alerts')
    .select('*', { count: 'exact', head: true })
    .eq('seen', false)

  const { data: lastRun } = await supabase
    .from('kade_trend_runs')
    .select('*')
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  // Dagilimlar: gorunumden tek seferde cekip bellekte gruplamak, her kirilim icin
  // ayri sorgu acmaktan ucuz (kayit sayisi bin mertebesinde).
  const { data: rows, error: rowsError } = await supabase
    .from('kade_trend_current')
    .select('platform, kind, category, country, stage')
    .limit(5000)
  if (rowsError) throw new Error(rowsError.message)

  const group = (key: 'platform' | 'kind' | 'category' | 'country' | 'stage') => {
    const map = new Map<string, number>()
    for (const r of rows ?? []) {
      const value = (r as Record<string, string | null>)[key] ?? (key === 'stage' ? 'bilinmiyor' : 'diger')
      map.set(value, (map.get(value) ?? 0) + 1)
    }
    return [...map.entries()].map(([value, count]) => ({ value, count })).sort((a, b) => b.count - a.count)
  }

  return {
    trends,
    snapshots,
    links,
    alerts: unseenAlerts ?? 0,
    lastRun: lastRun ?? null,
    byPlatform: group('platform'),
    byKind: group('kind'),
    byCategory: group('category'),
    byCountry: group('country'),
    byStage: group('stage'),
  }
}

/* ------------------------- Skorlama ve baglantilar ------------------------ */

/** Son `days` gun icinde gorulen trendleri servis rolüyle okur (toplama sonrasi hesap icin). */
async function loadTrendsForScoring(days = 21) {
  const db = createAdminClient()
  const since = new Date(Date.now() - days * 86400e3).toISOString()
  const trends: TrendRow[] = []
  let from = 0
  for (;;) {
    const { data, error } = await db
      .from('kade_trends')
      .select('*')
      .gte('last_seen', since)
      .order('id', { ascending: true })
      .range(from, from + 999)
    if (error) throw new Error(error.message)
    trends.push(...((data ?? []) as TrendRow[]))
    if (!data || data.length < 1000) break
    from += 1000
  }
  return trends
}

async function loadSnapshots(trendIds: string[]) {
  const db = createAdminClient()
  const byTrend = new Map<string, SnapshotRow[]>()
  for (const part of chunked(trendIds, 100)) {
    let from = 0
    for (;;) {
      const { data, error } = await db
        .from('kade_trend_snapshots')
        .select('*')
        .in('trend_id', part)
        .order('captured_at', { ascending: true })
        .range(from, from + 999)
      if (error) throw new Error(error.message)
      for (const row of (data ?? []) as SnapshotRow[]) {
        const list = byTrend.get(row.trend_id) ?? []
        list.push(row)
        byTrend.set(row.trend_id, list)
      }
      if (!data || data.length < 1000) break
      from += 1000
    }
  }
  return byTrend
}

/**
 * Tum guncel trendleri yeniden skorlar, patlama uyarilari uretir.
 */
export async function scoreAll() {
  const db = createAdminClient()
  const trends = await loadTrendsForScoring()
  if (!trends.length) return { scored: 0, breakouts: 0 }

  const ids = trends.map((t) => t.id)
  const snapshots = await loadSnapshots(ids)

  // Baglanti sayilari (capraz platform skoru icin)
  const linkCounts = new Map<string, number>()
  {
    let from = 0
    for (;;) {
      const { data } = await db.from('kade_trend_links').select('a_id, b_id').range(from, from + 999)
      for (const row of data ?? []) {
        linkCounts.set(row.a_id, (linkCounts.get(row.a_id) ?? 0) + 1)
        linkCounts.set(row.b_id, (linkCounts.get(row.b_id) ?? 0) + 1)
      }
      if (!data || data.length < 1000) break
      from += 1000
    }
  }

  // Onceki skorlar (patlama tespiti icin)
  const prevScores = new Map<string, { score: number; stage: string | null }>()
  for (const part of chunked(ids, 100)) {
    const { data } = await db
      .from('kade_trend_scores')
      .select('trend_id, score, stage, computed_at')
      .in('trend_id', part)
      .order('computed_at', { ascending: false })
      .limit(2000)
    for (const row of data ?? []) {
      if (!prevScores.has(row.trend_id)) prevScores.set(row.trend_id, { score: row.score, stage: row.stage })
    }
  }

  const records: ScoreRecord[] = []
  const alerts: Array<{ trend_id: string; type: string; message: string; severity: string }> = []

  for (const trend of trends) {
    const snaps = snapshots.get(trend.id) ?? []
    const s = scoreTrend(trend, snaps, linkCounts.get(trend.id) ?? 0)
    if (!s) continue
    records.push(s)

    const prev = prevScores.get(trend.id)
    if (prev && s.score - prev.score >= 12 && s.velocity > 0.4) {
      alerts.push({
        trend_id: trend.id,
        type: 'breakout',
        message: `"${trend.title}" patlıyor: skor ${prev.score.toFixed(0)} → ${s.score.toFixed(0)}, günlük büyüme %${(s.velocity * 100).toFixed(0)}`,
        severity: 'high',
      })
    } else if (!prev && s.stage === 'emerging' && s.score >= 55) {
      alerts.push({
        trend_id: trend.id,
        type: 'breakout',
        message: `Yeni yükselen: "${trend.title}" (${trend.platform}) skor ${s.score.toFixed(0)}`,
        severity: 'medium',
      })
    }
  }

  for (const part of chunked(records.map((r) => ({ ...r, computed_at: new Date().toISOString() })))) {
    const { error } = await db.from('kade_trend_scores').insert(part)
    if (error) throw new Error(`skor yazilamadi: ${error.message}`)
  }

  // Patlama uyarisi ayni trend icin tekrar tetiklenirse yeni satir yigmak yerine
  // mevcut satir tazelenir (mesaj + tarih guncellenir, okunmamis isaretlenir).
  for (const part of chunked(alerts.map((a) => ({ ...a, created_at: new Date().toISOString(), seen: false })))) {
    const { error } = await db.from('kade_trend_alerts').upsert(part, { onConflict: 'trend_id,type' })
    if (error) throw new Error(`uyari yazilamadi: ${error.message}`)
  }

  return { scored: records.length, breakouts: alerts.length }
}

const STOP = new Set([
  've', 'ile', 'bir', 'bu', 'the', 'and', 'for', 'with', 'a', 'of', 'to', 'in', 'on',
  'official', 'video', 'resmi', 'feat', 'ft', 'remix', 'audio', 'lyrics', 'sozleri',
])

function tokens(s: string) {
  return normalizeText(s)
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 2 && !STOP.has(w))
}

/** Sarki adini "Sanatci - Parca" formundan sadelestirir. */
function songKey(title: string, author?: string | null) {
  const t = tokens(title).sort().join(' ')
  const a = tokens(author || '').sort().join(' ')
  return `${a}|${t}`.trim()
}

/**
 * Ayni akim/sarki/konunun farkli platformlardaki karsiliklarini baglar.
 * Ters indeks kullanir; O(n^2) tarama yapmaz.
 */
export async function buildCrossPlatformLinks({ threshold = 0.45 } = {}) {
  const db = createAdminClient()
  const since = new Date(Date.now() - 14 * 86400e3).toISOString()
  const rows: Array<{ id: string; platform: string; kind: string; title: string; author: string | null; category: string | null }> = []
  let from = 0
  for (;;) {
    const { data, error } = await db
      .from('kade_trends')
      .select('id, platform, kind, title, author, category')
      .gte('last_seen', since)
      .order('id', { ascending: true })
      .range(from, from + 999)
    if (error) throw new Error(error.message)
    rows.push(...(data ?? []))
    if (!data || data.length < 1000) break
    from += 1000
  }

  const index = new Map<string, string[]>()
  const meta = new Map<string, (typeof rows)[number] & { tokens: Set<string> }>()
  for (const r of rows) {
    const tk = tokens(`${r.title} ${r.author || ''}`)
    meta.set(r.id, { ...r, tokens: new Set(tk) })
    for (const t of tk) {
      const bucket = index.get(t) ?? []
      bucket.push(r.id)
      index.set(t, bucket)
    }
  }

  const links: Array<{ a_id: string; b_id: string; confidence: number; reason: string }> = []
  const seenPairs = new Set<string>()

  for (const [id, a] of meta) {
    const candidates = new Set<string>()
    for (const t of a.tokens) {
      const bucket = index.get(t) ?? []
      if (bucket.length > 400) continue // asiri genel token
      for (const other of bucket) if (other !== id) candidates.add(other)
    }

    for (const otherId of candidates) {
      const pair = [id, otherId].sort().join('~')
      if (seenPairs.has(pair)) continue
      seenPairs.add(pair)
      const b = meta.get(otherId)
      if (!b) continue
      if (a.platform === b.platform && a.kind === b.kind) continue

      let conf = similarity(`${a.title} ${a.author || ''}`, `${b.title} ${b.author || ''}`)
      const reasons: string[] = []
      if (conf > 0) reasons.push('metin benzerliği')

      if (a.kind === 'sound' && b.kind === 'sound' && songKey(a.title, a.author) === songKey(b.title, b.author)) {
        conf = Math.max(conf, 0.95)
        reasons.push('aynı şarkı')
      }
      if ((a.kind === 'hashtag' && b.kind !== 'hashtag') || (b.kind === 'hashtag' && a.kind !== 'hashtag')) {
        const tag = a.kind === 'hashtag' ? a : b
        const other = a.kind === 'hashtag' ? b : a
        if (normalizeText(other.title).includes(normalizeText(tag.title).replace(/^#/, ''))) {
          conf = Math.max(conf, 0.8)
          reasons.push('hashtag içerikte geçiyor')
        }
      }
      if (a.category && a.category === b.category && conf > 0.3) {
        conf = Math.min(1, conf + 0.08)
        reasons.push('aynı kategori')
      }

      if (conf >= threshold) {
        const [x, y] = [id, otherId].sort()
        links.push({ a_id: x, b_id: y, confidence: Number(conf.toFixed(3)), reason: reasons.join(', ') })
      }
    }
  }

  for (const part of chunked(links)) {
    await db.from('kade_trend_links').upsert(part, { onConflict: 'a_id,b_id' })
  }

  // 3+ platformda gorunen trendler icin uyari
  const platformsByTrend = new Map<string, Set<string>>()
  for (const l of links) {
    const a = meta.get(l.a_id)
    const b = meta.get(l.b_id)
    if (!a || !b) continue
    const setA = platformsByTrend.get(l.a_id) ?? new Set<string>()
    setA.add(b.platform)
    platformsByTrend.set(l.a_id, setA)
    const setB = platformsByTrend.get(l.b_id) ?? new Set<string>()
    setB.add(a.platform)
    platformsByTrend.set(l.b_id, setB)
  }

  const multi = [...platformsByTrend.entries()]
    .filter(([, set]) => set.size >= 2)
    .sort((a, b) => b[1].size - a[1].size)
    .slice(0, 25)

  await addAlerts(
    multi.map(([id, set]) => ({
      trend_id: id,
      type: 'cross_platform',
      message: `"${meta.get(id)?.title ?? id}" ${set.size + 1} platformda birden görülüyor — güçlü çapraz trend`,
      severity: 'high',
    }))
  )

  return { links: links.length, multiPlatform: multi.length }
}

/* ----------------------------- Izleme listesi ---------------------------- */

export async function watchlistAll(userId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('kade_trend_watchlist')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  return data ?? []
}

export async function watchlistAdd(userId: string, term: string, note?: string | null) {
  const supabase = await createClient()
  const normalized = normalizeText(term)
  const { error } = await supabase
    .from('kade_trend_watchlist')
    .upsert({ user_id: userId, term: term.trim(), normalized, note: note ?? null }, { onConflict: 'user_id,normalized' })
  if (error) throw new Error(error.message)
  return normalized
}

export async function watchlistRemove(userId: string, term: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('kade_trend_watchlist')
    .delete()
    .eq('user_id', userId)
    .eq('normalized', normalizeText(term))
  if (error) throw new Error(error.message)
}

/**
 * Izleme listesindeki terimlerle eslesen yeni trendler icin uyari uretir.
 * Uyari tablosundaki tekil indeks sayesinde ayni trend icin tekrar yazilmaz.
 */
export async function checkWatchlist() {
  const db = createAdminClient()
  const { data: terms } = await db.from('kade_trend_watchlist').select('term, normalized')
  if (!terms?.length) return 0

  const since = new Date(Date.now() - 2 * 86400e3).toISOString()
  const rows: Array<{ trend_id: string; type: string; message: string; severity: string }> = []

  for (const w of terms) {
    const { data } = await db
      .from('kade_trends')
      .select('id, title, platform')
      .gte('last_seen', since)
      .ilike('normalized', `%${w.normalized}%`)
      .limit(20)
    for (const t of data ?? []) {
      rows.push({
        trend_id: t.id,
        type: 'watchlist',
        message: `İzleme listesi eşleşmesi ("${w.term}"): "${t.title}" — ${t.platform}`,
        severity: 'medium',
      })
    }
  }

  return addAlerts(rows)
}
