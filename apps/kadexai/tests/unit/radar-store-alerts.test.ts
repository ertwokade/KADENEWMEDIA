import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import ts from 'typescript'
import { uniqueAlerts, withAlertTrend } from '../../lib/kade-search/alerts'

function storeFixture({ thirdPlatform = false, readFails = false } = {}) {
  const writes: Array<{ table: string; rows: Array<Record<string, unknown>> }> = []
  const trends = [
    { id: 'a', title: 'Aynı şarkı', author: 'Sanatçı', platform: 'youtube', kind: 'video' },
    { id: 'b', title: 'Aynı şarkı', author: 'Sanatçı', platform: 'youtube', kind: 'sound' },
    { id: 'c', title: 'Aynı şarkı', author: 'Sanatçı', platform: 'tiktok', kind: 'sound' },
    ...(thirdPlatform ? [{ id: 'd', title: 'Aynı şarkı', author: 'Sanatçı', platform: 'spotify', kind: 'sound' }] : []),
  ]
  const alerts = [
    { id: 52, trend_id: 'a', type: 'cross_platform', message: 'Aynı uyarı', seen: false },
    { id: 51, trend_id: 'c', type: 'cross_platform', message: 'Aynı uyarı', seen: true },
  ]
  const db = { from(table: string) {
    const result = { data: table === 'kade_trends' ? trends : alerts, error: readFails ? { message: 'DB read failed' } : null }
    return {
      select() { return this }, order() { return this }, gte() { return this },
      async range() { return result }, async limit() { return result }, async in() { return result },
      async upsert(rows: Array<Record<string, unknown>>) { writes.push({ table, rows }); return { error: null, count: rows.length } },
    }
  } }
  const exports: {
    recentAlerts?: (limit?: number) => Promise<Array<{ id: number; title: string }>>;
    buildCrossPlatformLinks?: () => Promise<{ multiPlatform: number }>;
  } = {}
  const source = readFileSync(new URL('../../lib/kade-search/store.ts', import.meta.url), 'utf8')
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText
  runInNewContext(code, { exports, require(name: string) {
    if (name === 'server-only' || name === './score') return {}
    if (name === '@/lib/supabase/server') return { createClient: async () => db }
    if (name === '@/lib/supabase/admin') return { createAdminClient: () => db }
    if (name === './alerts') return { uniqueAlerts, withAlertTrend }
    if (name === './util') return { normalizeText: (s: string) => s.toLowerCase(), similarity: () => 1 }
    throw new Error(`Unexpected import: ${name}`)
  } })
  return { exports, writes }
}

test('real alert reader deduplicates observations without overwriting alert IDs', async () => {
  const { exports } = storeFixture()
  const rows = await exports.recentAlerts!()
  assert.equal(rows.length, 1)
  assert.equal(rows[0].id, 52)
  assert.equal(rows[0].title, 'Aynı şarkı')
})

test('real alert reader propagates DB failures instead of returning an empty list', async () => {
  await assert.rejects(storeFixture({ readFails: true }).exports.recentAlerts!(), /DB read failed/)
})

test('multiple content kinds on two platforms do not fabricate a third platform', async () => {
  const { exports, writes } = storeFixture()
  assert.equal((await exports.buildCrossPlatformLinks!()).multiPlatform, 0)
  assert.equal(writes.filter(write => write.table === 'kade_trend_alerts').length, 0)
})

test('three actual platforms produce one observation, not one alert per source', async () => {
  const { exports, writes } = storeFixture({ thirdPlatform: true })
  assert.equal((await exports.buildCrossPlatformLinks!()).multiPlatform, 1)
  const rows = writes.find(write => write.table === 'kade_trend_alerts')!.rows
  assert.equal(rows.length, 1)
  assert.match(String(rows[0].message), /3 platformda/)
})
