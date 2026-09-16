import test from 'node:test'
import assert from 'node:assert/strict'
import { logActivity } from '../../server/api/_lib/notify.js'
import { aiDateContext } from '../../server/api/_lib/ai-date-context.js'

test('AI tarih bağlamı İstanbul gece yarısında yeni yıla geçer', () => {
  assert.match(aiDateContext(new Date('2026-12-31T21:30:00Z')), /2027-01-01/)
  assert.match(aiDateContext(new Date('2026-12-31T20:30:00Z')), /2026-12-31/)
})

test('aktivite günlüğü gerçek insert sonucunu bekler ve yalnız şema hatalarında geri düşer', async (t) => {
  const previousUrl = process.env.SUPABASE_URL
  const previousKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  process.env.SUPABASE_URL = 'https://activity-log-test.invalid'
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'unit-test-only'
  const originalFetch = globalThis.fetch
  t.after(() => {
    globalThis.fetch = originalFetch
    if (previousUrl === undefined) delete process.env.SUPABASE_URL
    else process.env.SUPABASE_URL = previousUrl
    if (previousKey === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY
    else process.env.SUPABASE_SERVICE_ROLE_KEY = previousKey
  })
  for (const code of ['42703', 'PGRST204']) {
    const bodies = []
    globalThis.fetch = async (_url, options) => {
      bodies.push(JSON.parse(options.body))
      if (bodies.length === 1) return new Response(JSON.stringify({ code, message: 'Column missing' }), { status: 400 })
      return new Response(null, { status: 201 })
    }
    assert.equal(await logActivity({ action: 'Test', targetType: 'message', targetId: 'test' }), true)
    assert.equal(bodies.length, 2)
    assert.equal(bodies[0].target_type, 'message')
    assert.equal(Object.hasOwn(bodies[1], 'target_type'), false)
    assert.equal(bodies[1].action, 'Test')
  }
  let calls = 0
  globalThis.fetch = async () => {
    calls++
    return new Response(JSON.stringify({ code: '42501', message: 'Permission denied' }), { status: 403 })
  }
  assert.equal(await logActivity({ action: 'Test' }), false)
  assert.equal(calls, 1, 'izin hatası şema hatası gibi tekrar denenmez')
})

test('Gemini cevabının tüm metin parçaları birleştirilir, düşünce parçası atlanır', async () => {
  const { geminiResponseText } = await import('../../server/api/_lib/gemini-text.js')
  const data = { candidates: [{ content: { parts: [
    { text: 'gizli plan', thought: true },
    { text: '1. Yerel İşletmeler İçin Rehber\n2. Yer' },
    { text: 'el İşletmelere Özel Sosyal Medya İpuçları\n' },
  ] } }] }
  assert.equal(geminiResponseText(data), '1. Yerel İşletmeler İçin Rehber\n2. Yerel İşletmelere Özel Sosyal Medya İpuçları')
  assert.equal(geminiResponseText({}), '')
})
