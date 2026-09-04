import 'server-only'

/**
 * Materyal veri katmani.
 *
 * Okuma kullanicinin oturumuyla (RLS gecerli), yazma yalnizca service-role ile
 * yapilir; havuz ortak oldugu icin toplama isi kisiye bagli degildir.
 */
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { normalizeTitle } from './arsivhub'
import type { MaterialFilters, MaterialItem, MaterialSyncResult } from './types'

const CHUNK = 200

function chunked<T>(rows: T[], size = CHUNK): T[][] {
  const out: T[][] = []
  for (let i = 0; i < rows.length; i += size) out.push(rows.slice(i, i + size))
  return out
}

function toRow(item: MaterialItem) {
  return {
    id: item.id,
    source: item.source,
    kind: item.kind,
    external_id: item.externalId ?? null,
    title: item.title,
    normalized: normalizeTitle(item.title),
    description: item.description ?? null,
    page_url: item.pageUrl,
    media_url: item.mediaUrl ?? null,
    thumbnail: item.thumbnail ?? null,
    duration_sec: item.durationSec ?? null,
    width: item.width ?? null,
    height: item.height ?? null,
    view_count: item.viewCount ?? null,
    tags: item.tags ?? [],
    published_at: item.publishedAt ?? null,
    last_seen: new Date().toISOString(),
    raw: {},
  }
}

export async function saveMaterials(source: string, items: MaterialItem[]): Promise<MaterialSyncResult> {
  const admin = createAdminClient()
  const startedAt = new Date().toISOString()
  if (!items.length) {
    return { source, found: 0, inserted: 0, updated: 0, ok: true }
  }

  /* Hangilerinin yeni oldugunu bilmek icin once mevcut kimlikleri okuyoruz;
     upsert tek basina insert/update ayrimini dondurmuyor. */
  const ids = items.map((item) => item.id)
  const existing = new Set<string>()
  for (const part of chunked(ids)) {
    const { data } = await admin.from('kade_materials').select('id').in('id', part)
    for (const row of data ?? []) existing.add(row.id as string)
  }

  for (const part of chunked(items.map(toRow))) {
    const { error } = await admin.from('kade_materials').upsert(part, { onConflict: 'id' })
    if (error) throw new Error(error.message)
  }

  const inserted = ids.filter((id) => !existing.has(id)).length
  const result: MaterialSyncResult = {
    source,
    found: items.length,
    inserted,
    updated: items.length - inserted,
    ok: true,
  }
  await admin.from('kade_material_runs').insert({
    source,
    started_at: startedAt,
    finished_at: new Date().toISOString(),
    found: result.found,
    inserted: result.inserted,
    updated: result.updated,
    ok: true,
  })
  return result
}

export async function recordFailedRun(source: string, error: string) {
  const admin = createAdminClient()
  await admin.from('kade_material_runs').insert({
    source,
    finished_at: new Date().toISOString(),
    ok: false,
    error: error.slice(0, 500),
  })
}

export async function queryMaterials(filters: MaterialFilters) {
  const supabase = await createClient()
  let query = supabase.from('kade_materials').select('*')

  if (filters.kind) query = query.eq('kind', filters.kind)
  if (filters.source) query = query.eq('source', filters.source)
  if (filters.q) query = query.ilike('normalized', `%${normalizeTitle(filters.q)}%`)

  if (filters.sort === 'izlenme') query = query.order('view_count', { ascending: false, nullsFirst: false })
  else if (filters.sort === 'sure') query = query.order('duration_sec', { ascending: false, nullsFirst: false })
  else query = query.order('published_at', { ascending: false, nullsFirst: false })

  const { data, error } = await query.range(filters.offset, filters.offset + filters.limit - 1)
  if (error) throw new Error(error.message)
  return data ?? []
}

/**
 * Tek materyali kimliğiyle getirir.
 *
 * İndirme ucu buna dayanıyor: indirilecek adres istekten DEĞİL havuzdan
 * okunuyor. İstemciden gelen adrese güvenilseydi uç, sunucunun ağından
 * herhangi bir yere istek attırmak için kullanılabilirdi.
 */
export async function getMaterialById(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('kade_materials')
    .select('id, title, kind, media_url, thumbnail')
    .eq('id', id)
    .maybeSingle()
  if (error) throw new Error(error.message)
  return data ?? null
}

export async function materialStats() {
  const supabase = await createClient()
  const [{ count: toplam }, { data: sonKosu }] = await Promise.all([
    supabase.from('kade_materials').select('id', { count: 'exact', head: true }),
    supabase.from('kade_material_runs').select('*').order('started_at', { ascending: false }).limit(1),
  ])
  return { toplam: toplam ?? 0, sonKosu: sonKosu?.[0] ?? null }
}
