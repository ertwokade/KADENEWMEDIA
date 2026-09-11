import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import ts from 'typescript'

function route({ output = '{}', denied = false, limited = false, failed = false } = {}) {
  const calls: unknown[] = []
  const compile = (path: string, require: (name: string) => unknown) => {
    const code = ts.transpileModule(readFileSync(new URL(path, import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText
    const exports: Record<string, (...args: never[]) => unknown> = {}
    runInNewContext(code, { exports, require })
    return exports
  }
  const exports = compile('../../app/kadexai/api/generate/comment-analysis/route.ts', name => {
    if (name === 'next/server') return { NextResponse: { json: (body: unknown, init?: ResponseInit) => Response.json(body, init) } }
    if (name === '@/lib/auth/server') return { requireApiUser: async () => denied ? Response.json({}, { status: 401 }) : null }
    if (name === '@/lib/rateLimit') return { getRateLimitKey: () => 'test', rateLimit: () => ({ allowed: !limited }) }
    if (name === '@/lib/ai/models') return { SELECTABLE_MODELS: ['auto'] }
    if (name === '@/lib/ai/prompts') return { buildCommentAnalysisPrompt: (...args: unknown[]) => args, buildCommentReplyPrompt: (...args: unknown[]) => args }
    if (name === '@/lib/ai/structured') return { parseStructuredOutput: JSON.parse }
    if (name === '@/lib/ai/outputValidation') return compile('../../lib/ai/outputValidation.ts', () => { throw Error('Unexpected import') })
    if (name === '@/lib/ai/provider') return { generateContent: async (options: unknown) => { calls.push(options); if (failed) throw Error('Private provider credential'); return { content: output, model: 'auto' } } }
    throw Error(`Unexpected import: ${name}`)
  })
  const post = exports.POST as unknown as (request: Request) => Promise<Response>
  return { calls, post: (body: unknown = { comments: 'Kaynak?', model: 'auto' }) => post(new Request('http://localhost/api/generate/comment-analysis', { method: 'POST', body: JSON.stringify(body) })) }
}

test('comment analysis rejects invalid inputs before generation', async () => {
  const api = route()
  for (const body of [null, [], {}, { comments: ' ', model: 'auto' }, { comments: {}, model: 'auto' }, { comments: 'x'.repeat(30001), model: 'auto' }, { comments: 'x', model: 'unknown' }, { comments: 'x', model: 'auto', action: ['reply'] }, { comments: 'x'.repeat(1001), model: 'auto', action: 'reply' }, { comments: 'x', model: 'auto', contentTitle: 42 }]) {
    assert.equal((await api.post(body)).status, 400)
  }
  assert.equal(api.calls.length, 0)
})

test('comment analysis keeps authentication and rate limits on reply generation', async () => {
  for (const [options, status] of [[{ denied: true }, 401], [{ limited: true }, 429]] as const) {
    const api = route(options)
    assert.equal((await api.post({ action: 'reply', comments: 'x', model: 'auto' })).status, status)
    assert.equal(api.calls.length, 0)
  }
})

test('comment analysis distinguishes unknown scores from real zero', async () => {
  const api = route({ output: JSON.stringify({ ozet: { pozitif_oran: 0, negatif_oran: '', notr_oran: 150 }, topluluk_sagligi: { puan: false }, genel_oneriler: ['Kaynak paylaş.'], yanit_oncelikleri: [{ yorum_ozeti: 'Kaynak?', yanit_taslagi: true }] }) })
  const res = await api.post()
  assert.equal(res.status, 200)
  const { analysis } = await res.json()
  assert.equal(analysis.ozet.pozitif_oran, 0)
  assert.equal(analysis.ozet.negatif_oran, null)
  assert.equal(analysis.ozet.notr_oran, null)
  assert.equal(analysis.topluluk_sagligi.puan, null)
  assert.equal(analysis.ozet.genel_duygu, 'Belirtilmedi')
  assert.equal(analysis.yanit_oncelikleri[0].yanit_taslagi, '')
})

test('reply generation returns bounded editable text and passes comment context', async () => {
  const api = route({ output: JSON.stringify({ yanit_1: { metin: ' Kaynakları açıklamada bulabilirsin. ' } }) })
  const response = await api.post({ action: 'reply', comments: 'Kaynak?', contentTitle: 'Bilim', tone: 'samimi', model: 'auto' })
  assert.equal(response.status, 200)
  assert.equal((await response.json()).draft, 'Kaynakları açıklamada bulabilirsin.')
  assert.deepEqual(JSON.parse(JSON.stringify(api.calls))[0].prompt, ['Kaynak?', 'Bilim', 'samimi'])
})

test('empty or non-text reply is an error, never a successful draft', async () => {
  for (const output of ['{}', '{"yanit_1":{"metin":false}}', '{"yanit_1":{"metin":"  "}}']) {
    assert.equal((await route({ output }).post({ action: 'reply', comments: 'x', model: 'auto' })).status, 502)
  }
})

test('provider failure does not expose credentials or become a successful analysis', async () => {
  const response = await route({ failed: true }).post()
  assert.equal(response.status, 500)
  assert.doesNotMatch(await response.text(), /Private|credential/)
})
