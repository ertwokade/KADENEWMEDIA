import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import ts from 'typescript'

function calendar({ user = 'owner', data = [{ id: 'record' }] as unknown, error = null as unknown, resource = 'calendar' } = {}) {
  const calls: Array<{ table: string; method: string; args: unknown[] }> = []
  const db = { auth: { getUser: async () => ({ data: { user: user ? { id: user } : null } }) }, from(table: string) {
    const query: Record<string, unknown> = {}
    for (const method of ['select', 'insert', 'update', 'delete', 'eq', 'order', 'maybeSingle', 'single']) {
      query[method] = (...args: unknown[]) => { calls.push({ table, method, args }); return query }
    }
    query.then = (resolve: (result: unknown) => void) => Promise.resolve(table === 'user_preferences'
      ? { data: { active_workspace_id: 'workspace', active_brand_id: 'brand' }, error: null }
      : { data, error }).then(resolve)
    return query
  } }
  const source = readFileSync(new URL(`../../app/kadexai/api/${resource}/route.ts`, import.meta.url), 'utf8')
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText
  const exports: Record<string, (request: Request) => Promise<Response>> = {}
  runInNewContext(code, { exports, process: { env: { NEXT_PUBLIC_SUPABASE_URL: 'test', NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test' } }, require(name: string) {
    if (name === 'next/server') return { NextResponse: { json: (value: unknown, init?: ResponseInit) => Response.json(value, init) } }
    if (name === '@/lib/supabase/server') return { createClient: async () => db }
    throw Error(`Unexpected import: ${name}`)
  } })
  return { calls, run: (method: string, body: unknown = {}) => exports[method](new Request('http://localhost/api/calendar', { method, ...(method === 'GET' ? {} : { body: JSON.stringify(body) }) })) }
}

const entry = { title: ' Plan ', platform: 'pinterest', publish_at: '2026-09-09T12:00:00+03:00' }

test('calendar rejects unauthenticated reads and writes before database access', async () => {
  const api = calendar({ user: '' })
  for (const method of ['GET', 'POST', 'PUT', 'DELETE']) assert.equal((await api.run(method, entry)).status, 401)
  assert.deepEqual(api.calls, [])
})

test('calendar validates dates, platform, body shape and entire batch without truncation', async () => {
  const api = calendar()
  for (const body of [null, [], { entries: [] }, { entries: 'bad' }, { entries: Array(51).fill(entry) }, { ...entry, title: ' ' }, { ...entry, title: 'x'.repeat(301) }, { ...entry, platform: 'unknown' }, { ...entry, publish_at: '2026-02-30T12:00:00Z' }, { ...entry, publish_at: '2026-09-09T24:00:00Z' }, { entries: [entry, { ...entry, publish_at: 'yesterday' }] }]) {
    assert.equal((await api.run('POST', body)).status, 400, JSON.stringify(body).slice(0, 100))
  }
  assert.ok(!api.calls.some(call => call.method === 'insert'))
})

test('calendar writes authenticated ownership and normalizes explicit timezone', async () => {
  const api = calendar()
  assert.equal((await api.run('POST', { ...entry, user_id: 'intruder', workspace_id: 'foreign', status: 'yayında' })).status, 201)
  const rows = api.calls.find(call => call.method === 'insert')!.args[0] as Record<string, unknown>[]
  assert.equal(rows[0].user_id, 'owner')
  assert.equal(rows[0].workspace_id, 'workspace')
  assert.equal(rows[0].status, 'taslak')
  assert.equal(rows[0].publish_at, '2026-09-09T09:00:00.000Z')
  assert.equal(rows[0].title, 'Plan')
})

test('calendar reads and mutations are owner-scoped; absent mutations return 404', async () => {
  for (const method of ['GET', 'PUT', 'DELETE']) {
    const api = calendar({ data: method === 'PUT' ? null : [] })
    const response = await api.run(method, { id: 'foreign', status: 'hazır' })
    assert.equal(response.status, method === 'GET' ? 200 : 404)
    assert.ok(api.calls.some(call => call.table === 'content_calendar_items' && call.method === 'eq' && call.args[0] === 'user_id' && call.args[1] === 'owner'))
  }
})

test('calendar rejects invalid statuses instead of resetting a record to draft', async () => {
  const api = calendar()
  for (const body of [null, { id: '' }, { id: 'record', status: 'invalid' }, { id: 'record', status: ['hazır'] }]) assert.equal((await api.run('PUT', body)).status, 400)
  assert.ok(!api.calls.some(call => call.method === 'update'))
})

test('calendar database rejection never reports mutation success or reveals details', async () => {
  for (const method of ['GET', 'POST', 'PUT', 'DELETE']) {
    const api = calendar({ data: null, error: { message: 'Private database detail' } })
    const response = await api.run(method, method === 'POST' ? entry : { id: 'record', status: 'hazır' })
    assert.equal(response.status, 500)
    assert.doesNotMatch(await response.text(), /Private/)
  }
})

test('templates reject anonymous access and malformed or oversized writes', async () => {
  const anonymous = calendar({ resource: 'templates', user: '' })
  for (const method of ['GET', 'POST', 'PUT', 'DELETE']) assert.equal((await anonymous.run(method)).status, 401)
  assert.deepEqual(anonymous.calls, [])
  const api = calendar({ resource: 'templates' })
  for (const body of [null, [], {}, { title: 'x', content: ' ' }, { title: 'x'.repeat(201), content: 'x' }, { title: 'x', content: 'x'.repeat(20001) }]) {
    for (const method of ['POST', 'PUT']) assert.equal((await api.run(method, body)).status, 400)
  }
  assert.ok(!api.calls.some(call => ['insert', 'update'].includes(call.method)))
})

test('templates missing updates and deletes are owner-scoped 404 responses', async () => {
  for (const method of ['PUT', 'DELETE']) {
    const api = calendar({ resource: 'templates', data: method === 'PUT' ? null : [] })
    assert.equal((await api.run(method, { id: 'foreign', title: 'x', content: 'y' })).status, 404)
    assert.ok(api.calls.some(call => call.table === 'content_templates' && call.method === 'eq' && call.args[0] === 'user_id' && call.args[1] === 'owner'))
  }
})

test('templates bind new records to the session and preserve complete text', async () => {
  const api = calendar({ resource: 'templates', data: { id: 'record' } })
  assert.equal((await api.run('POST', { title: ' Taslak ', content: ' Türkçe içerik ', user_id: 'foreign', workspace_id: 'other' })).status, 201)
  const row = api.calls.find(call => call.method === 'insert')!.args[0] as Record<string, unknown>
  assert.equal(row.user_id, 'owner')
  assert.equal(row.workspace_id, 'workspace')
  assert.equal(row.content, 'Türkçe içerik')
})

test('template database failures never become successful writes', async () => {
  for (const method of ['POST', 'PUT', 'DELETE']) {
    const api = calendar({ resource: 'templates', data: null, error: { message: 'Private detail' } })
    const response = await api.run(method, { id: 'record', title: 'x', content: 'y' })
    assert.equal(response.status, 500)
    assert.doesNotMatch(await response.text(), /Private/)
  }
})

test('calendar edits title, platform and date together and rejects partial invalid edits', async () => {
  const api = calendar({ data: { id: 'record' } })
  assert.equal((await api.run('PUT', { id: 'record', title: 'Yeni', platform: 'instagram', publish_at: '2026-10-01T12:00:00+03:00' })).status, 200)
  const update = api.calls.find(call => call.method === 'update')!.args[0] as Record<string, unknown>
  assert.equal(update.title, 'Yeni')
  assert.equal(update.platform, 'instagram')
  assert.equal(update.publish_at, '2026-10-01T09:00:00.000Z')
  assert.equal('status' in update, false)
  const invalid = calendar({ data: { id: 'record' } })
  for (const body of [{ id: 'record', title: ' ', platform: 'x', publish_at: '2026-10-01T12:00:00Z' }, { id: 'record', title: 'A', platform: 'x' }, { id: 'record', title: 'A', platform: 'x', publish_at: '2026-10-01T12:00:00Z', status: 'bad' }]) {
    assert.equal((await invalid.run('PUT', body)).status, 400)
  }
  assert.ok(!invalid.calls.some(call => call.method === 'update'))
})
