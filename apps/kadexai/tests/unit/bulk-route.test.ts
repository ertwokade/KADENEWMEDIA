import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import ts from 'typescript'

function bulk({ outputs = ['{}'] as (string | Error)[], denial = '' } = {}) {
  const calls: { prompt: unknown[] }[] = []
  function load(path: string): Record<string, unknown> {
    const source = readFileSync(new URL(path, import.meta.url), 'utf8')
    const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText
    const exports = {}
    runInNewContext(code, { exports, require(name: string) {
      if (name === 'next/server') return { NextResponse: { json: (body: unknown, init?: ResponseInit) => Response.json(body, init) } }
      if (name === '@/lib/auth/server') return { requireApiUser: async () => denial === 'auth' ? Response.json({}, { status: 401 }) : null }
      if (name === '@/lib/payments/featureGuard') return { requireToolFeature: async () => denial === 'plan' ? Response.json({}, { status: 403 }) : null }
      if (name === '@/lib/rateLimit') return { getRateLimitKey: () => 'test', rateLimit: () => ({ allowed: denial !== 'limit' }) }
      if (name === '@/lib/ai/models') return { SELECTABLE_MODELS: ['auto'] }
      if (name === '@/lib/ai/prompts') return { buildBulkPrompt: (...args: unknown[]) => args }
      if (name === '@/lib/ai/structured') return load('../../lib/ai/structured.ts')
      if (name === '@/lib/ai/hashtags') return load('../../lib/ai/hashtags.ts')
      if (name === '@/lib/ai/provider') return { generateContent: async (options: { prompt: unknown[] }) => {
        const output = outputs[calls.length % outputs.length]
        calls.push(options)
        if (output instanceof Error) throw output
        return { content: output, model: 'auto', tokensUsed: 10 }
      } }
      throw Error(`Unexpected import: ${name}`)
    } })
    return exports
  }
  const route = load('../../app/kadexai/api/generate/bulk/route.ts') as { POST: (request: Request) => Promise<Response> }
  return { calls, post: (body: unknown = { topic: 'Teknoloji', platforms: ['instagram', 'x'], count: 20, model: 'auto' }) => route.POST(new Request('http://localhost/api/generate/bulk', { method: 'POST', body: JSON.stringify(body) })) }
}

const output = (batch: number) => JSON.stringify({
  basliklar: Array.from({ length: 10 }, (_, i) => `Başlık ${batch * 10 + i}`),
  hooklar: Array.from({ length: 10 }, (_, i) => `Hook ${batch * 10 + i}`),
  captions: Object.fromEntries(['instagram', 'twitter'].map(platform => [platform, Array.from({ length: 10 }, (_, i) => `${platform} açıklaması ${batch * 10 + i}`)])),
  hashtag_setleri: [['#İstanbul', '#istanbul', '#Çekim']],
})

test('bulk retains auth, plan and rate guards before invoking any model', async () => {
  for (const [denial, status] of [['auth', 401], ['plan', 403], ['limit', 429]] as const) {
    const api = bulk({ denial })
    assert.equal((await api.post()).status, status)
    assert.equal(api.calls.length, 0)
  }
})

test('bulk rejects malformed count and platforms without silently changing the request', async () => {
  const api = bulk()
  const valid = { topic: 'x', platforms: ['x'], count: 5, model: 'auto' }
  for (const body of [null, [], { ...valid, count: 51 }, { ...valid, count: 2 }, { ...valid, count: 3.5 }, { ...valid, count: '5' }, { ...valid, topic: ' ' }, { ...valid, platforms: [] }, { ...valid, platforms: ['unknown'] }, { ...valid, model: {} }]) {
    assert.equal((await api.post(body)).status, 400)
  }
  assert.equal(api.calls.length, 0)
})

test('bulk produces 50 items using five bounded batches and normalizes X and hashtags', async () => {
  const api = bulk({ outputs: Array.from({ length: 5 }, (_, i) => output(i)) })
  const response = await api.post({ topic: 'x', platforms: ['instagram', 'twitter'], count: 50, model: 'auto' })
  const body = await response.json()
  assert.equal(response.status, 200)
  assert.equal(api.calls.length, 5)
  assert.ok(api.calls.every(call => call.prompt[3] === 10))
  assert.equal(body.partial, false)
  assert.equal(body.coverage.titles, 50)
  assert.equal(body.coverage.captions.x, 50)
  assert.deepEqual(body.data.hashtag_setleri, [['#istanbul', '#cekim']])
  assert.equal(body.tokensUsed, 50)
})

test('one failed batch preserves the successful items and reports partial coverage', async () => {
  const response = await bulk({ outputs: [output(0), Error('Private provider secret')] }).post()
  const body = await response.json()
  assert.equal(response.status, 200)
  assert.equal(body.partial, true)
  assert.equal(body.coverage.titles, 10)
  assert.equal(body.batches.failed, 1)
  assert.doesNotMatch(JSON.stringify(body), /Private|secret/)
})

test('duplicate outputs cannot be presented as the requested item count', async () => {
  const response = await bulk({ outputs: [output(0)] }).post()
  const body = await response.json()
  assert.equal(body.partial, true)
  assert.equal(body.coverage.requested, 20)
  assert.equal(body.coverage.titles, 10)
  assert.equal(body.batches.usable, 2)
})

test('empty, raw, malformed or completely failed batches never become successful content', async () => {
  for (const value of ['not json', '{}', '{"basliklar":[{}],"captions":{"instagram":false}}', Error('Private')]) {
    const response = await bulk({ outputs: [value] }).post()
    assert.equal(response.status, 502)
    assert.doesNotMatch(await response.text(), /Private/)
  }
})
