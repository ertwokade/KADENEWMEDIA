import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import ts from 'typescript'

function syncRoute({ archiveFails = false, archiveUnavailable = false, denied = false } = {}) {
  const collected: string[] = []
  const saved: string[] = []
  const code = ts.transpileModule(readFileSync(new URL('../../app/kadexai/api/materials/sync/route.ts', import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText
  const exports: Record<string, (request: Request) => Promise<Response>> = {}
  runInNewContext(code, { exports, URL, process: { env: {} }, require(name: string) {
    if (name === 'next/server') return { NextResponse: { json: (data: unknown, init?: ResponseInit) => Response.json(data, init) } }
    if (name === '../../kade-search/_guard') return { requireCollectorAccess: async () => denied ? Response.json({}, { status: 403 }) : null, failure: () => Response.json({}, { status: 500 }) }
    if (name === '@/lib/materials/arsivhub') return { collectArsivhub: async () => {
      collected.push('arsivhub')
      if (archiveUnavailable) {
        const error = new Error('Private discontinued detail')
        error.name = 'MaterialSourceUnavailableError'
        throw error
      }
      if (archiveFails) throw new Error('Private provider detail')
      return [{}]
    } }
    if (name === '@/lib/materials/youtube') return { collectYouTube: async () => { collected.push('youtube'); return [] } }
    if (name === '@/lib/materials/tiktok') return { collectTikTok: async () => { collected.push('tiktok'); return { items: [], reason: 'Private config detail' } } }
    if (name === '@/lib/materials/store') return { recordFailedRun: async () => {}, recordSkippedRun: async () => { saved.push('skipped-run') }, saveMaterials: async (source: string) => { saved.push(source); return { source, ok: true, found: 1, inserted: 1, updated: 0 } } }
    throw new Error(`Unexpected import: ${name}`)
  } })
  return { post: (source = '') => exports.POST(new Request(`http://localhost/api/materials/sync${source ? `?source=${source}` : ''}`, { method: 'POST' })), collected, saved }
}

test('material sync rejects an invalid source before any collection or database work', async () => {
  const { post, collected, saved } = syncRoute()
  assert.equal((await post('unknown')).status, 400)
  assert.deepEqual(collected, [])
  assert.deepEqual(saved, [])
})

test('reader cannot trigger material collection', async () => {
  const { post, collected } = syncRoute({ denied: true })
  assert.equal((await post()).status, 403)
  assert.deepEqual(collected, [])
})

test('configured archive success is partial, unavailable services are not successful', async () => {
  const { post } = syncRoute()
  const response = await post()
  const body = await response.json()
  assert.equal(response.status, 200)
  assert.equal(body.partial, true)
  assert.equal(body.sonuclar.filter((row: { ok: boolean }) => row.ok).length, 1)
  assert.equal(body.sonuclar.filter((row: { skipped?: boolean }) => row.skipped).length, 2)
})

test('all failed or skipped sources return a failure without exposing provider details', async () => {
  const { post } = syncRoute({ archiveFails: true })
  const response = await post()
  assert.equal(response.status, 503)
  assert.ok(!(await response.text()).includes('Private'))
})

test('all unavailable sources are a successful no-op that preserves the existing archive', async () => {
  const { post, saved } = syncRoute({ archiveUnavailable: true })
  const response = await post()
  const body = await response.json()
  assert.equal(response.status, 200)
  assert.deepEqual(saved, ['skipped-run'], 'denemenin nedeni kayda geçer, arşiv üzerine yazılmaz')
  assert.equal(body.skipped, true)
  assert.equal(body.partial, false)
  assert.equal(body.error, undefined)
  assert.equal(body.sonuclar.every((row: { skipped?: boolean }) => row.skipped), true)
  assert.ok(!JSON.stringify(body).includes('Private'))
})

test('removed archive sitemaps are classified as unavailable instead of network failures', async () => {
  const code = ts.transpileModule(
    readFileSync(new URL('../../lib/materials/arsivhub.ts', import.meta.url), 'utf8'),
    { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } },
  ).outputText
  const exports: Record<string, () => Promise<unknown>> = {}
  runInNewContext(code, {
    exports,
    AbortSignal,
    require(name: string) {
      if (name === 'server-only') return {}
      throw new Error(`Unexpected import: ${name}`)
    },
    fetch: async () => new Response('Gone', { status: 410 }),
  })
  await assert.rejects(exports.collectArsivhub(), (error: Error) => error.name === 'MaterialSourceUnavailableError')
})
