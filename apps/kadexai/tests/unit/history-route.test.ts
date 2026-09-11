import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import ts from 'typescript'

// Execute the actual route with only Next's response and database adapters stubbed.
// No network, real session or database writes are permitted in this harness.
function routeWith(results: Record<string, { data: unknown; error: { code: string } | null }>, user: { id: string } | null = { id: 'owner' }) {
  const calls: Array<{ table: string; method: string; args: unknown[] }> = []
  const db = { auth: { getUser: async () => ({ data: { user } }) }, from(table: string) {
    const query: Record<string, unknown> = {}
    for (const method of ['select', 'delete', 'insert', 'eq', 'gte', 'lte', 'order', 'limit', 'single']) {
      query[method] = (...args: unknown[]) => { calls.push({ table, method, args }); return query }
    }
    query.then = (resolve: (value: unknown) => void) => {
      assert.ok(results[table], `Unexpected table access: ${table}`)
      return Promise.resolve(results[table]).then(resolve)
    }
    return query
  } }
  const source = readFileSync(new URL('../../app/kadexai/api/history/route.ts', import.meta.url), 'utf8')
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText
  const exports: Record<string, (request: unknown) => Promise<Response>> = {}
  runInNewContext(code, { exports, require(name: string) {
    if (name === 'next/server') return { NextResponse: { json: (body: unknown, init?: ResponseInit) => Response.json(body, init) } }
    if (name === '@/lib/supabase/server') return { createClient: async () => db }
    throw new Error(`Unexpected import: ${name}`)
  } })
  return { route: exports, calls }
}

test('history deletion checks ownership on both schemas and returns 404 when nothing was deleted', async () => {
  const { route, calls } = routeWith({ tool_runs: { data: [], error: null }, content_history: { data: [], error: null } })
  const response = await route.DELETE({ json: async () => ({ id: 'record' }) })
  assert.equal(response.status, 404)
  for (const table of ['tool_runs', 'content_history']) {
    assert.ok(calls.some(call => call.table === table && call.method === 'eq' && call.args[0] === 'user_id' && call.args[1] === 'owner'))
  }
})

test('a legacy deletion succeeds only when that record really existed', async () => {
  const { route } = routeWith({ tool_runs: { data: [], error: null }, content_history: { data: [{ id: 'record' }], error: null } })
  assert.equal((await route.DELETE({ json: async () => ({ id: 'record' }) })).status, 200)
})

test('permission failures never fall back to another history table', async () => {
  const { route, calls } = routeWith({ tool_runs: { data: null, error: { code: '42501' } } })
  assert.equal((await route.DELETE({ json: async () => ({ id: 'record' }) })).status, 500)
  assert.equal((await route.GET({ nextUrl: new URL('http://localhost/api/history') })).status, 500)
  assert.ok(calls.every(call => call.table === 'tool_runs'))
})

test('legacy read retains date/tool filters and cannot call completed rows failed', async () => {
  const { route, calls } = routeWith({ tool_runs: { data: null, error: { code: '42P01' } }, content_history: { data: [{ id: 'old', created_at: '2026-09-01' }], error: null } })
  const response = await route.GET({ nextUrl: new URL('http://localhost/api/history?tool=title&status=failed&from=2026-09-01') })
  const body = await response.json()
  assert.deepEqual(body.history, [])
  assert.equal(body.ownerId, 'owner')
  assert.ok(calls.some(call => call.table === 'content_history' && call.method === 'eq' && call.args[0] === 'tool' && call.args[1] === 'title'))
  assert.ok(calls.some(call => call.table === 'content_history' && call.method === 'gte' && call.args[0] === 'created_at'))
})

test('unauthenticated history deletion never queries the database', async () => {
  const { route, calls } = routeWith({}, null)
  assert.equal((await route.DELETE({ json: async () => ({ id: 'record' }) })).status, 401)
  assert.deepEqual(calls, [])
})
