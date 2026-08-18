import 'server-only'

/**
 * Toplama orkestrasyonu.
 *
 * SQLite surumu tum kaynaklari tek islemde tariyordu (dakikalar surebiliyor).
 * Sunucusuz ortamda istek suresi sinirli oldugu icin burada is KAYNAK BASINA
 * bolundu: pano her kaynagi ayri istekte calistirir, sonra bir kez "finalize"
 * cagirir (capraz baglantilar + skorlar + izleme listesi kontrolu).
 */
import { COLLECTORS, SOURCE_ORDER } from './collectors'
import { enrich } from './classify'
import { uniqBy } from './util'
import {
  buildCrossPlatformLinks,
  checkWatchlist,
  finishRun,
  scoreAll,
  startRun,
  upsertTrends,
} from './store'
import type { SourceId } from './types'

export interface CollectSourceResult {
  runId: string
  source: SourceId
  label: string
  found: number
  added: number
  errors: string[]
  note?: string
  durationMs: number
}

export function isSourceId(value: string): value is SourceId {
  return (SOURCE_ORDER as string[]).includes(value)
}

/**
 * Tek bir kaynagi (istenen ulkeler icin) toplar ve veritabanina yazar.
 * Skorlama yapmaz; onu `finalizeCollection` ustlenir.
 */
export async function collectSource(opts: {
  source: SourceId
  countries: string[]
  limit?: number
  period?: number
  runId?: string
}): Promise<CollectSourceResult> {
  const started = Date.now()
  const collector = COLLECTORS[opts.source]
  const limit = opts.limit ?? 50
  const period = opts.period ?? 7
  const countries = opts.countries.length ? opts.countries : ['TR']

  const runId = opts.runId ?? (await startRun([opts.source], countries))
  const errors: string[] = []
  const items = []
  let note: string | undefined

  // Ulkeye bagli olmayan kaynaklar (reddit) tek kez calisir
  const runCountries = opts.source === 'reddit' ? [countries[0]] : countries

  for (const country of runCountries) {
    try {
      const result = await collector.collect({ country, limit, period })
      items.push(...result.items)
      errors.push(...result.errors)
      if (result.note) note = result.note
    } catch (e) {
      errors.push(`${opts.source}/${country}: ${(e as Error).message}`)
    }
  }

  const unique = uniqBy(items, (x) => `${x.platform}:${x.kind}:${x.external_id ?? x.title}`)
  const enriched = unique.map((item) => enrich(item))
  const { found, added } = await upsertTrends(enriched, runId)

  await finishRun(runId, { found, added, errors, startedMs: started })

  return {
    runId,
    source: opts.source,
    label: collector.label,
    found,
    added,
    errors: errors.slice(0, 10),
    note,
    durationMs: Date.now() - started,
  }
}

/**
 * Toplama turunun kapanisi: capraz platform baglantilari, skorlar ve
 * izleme listesi eslesmeleri.
 */
export async function finalizeCollection() {
  const started = Date.now()
  const links = await buildCrossPlatformLinks()
  const scores = await scoreAll()
  const watchlistAlerts = await checkWatchlist()
  return { ...links, ...scores, watchlistAlerts, durationMs: Date.now() - started }
}
