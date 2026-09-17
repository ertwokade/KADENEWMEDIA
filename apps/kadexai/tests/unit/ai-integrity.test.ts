import test from 'node:test'
import assert from 'node:assert/strict'
import { contentIntegrityInstruction } from '../../lib/ai/integrity'

test('içerik dürüstlüğü kuralı güncel yılı İstanbul saatine göre verir ve uydurma türlerini yasaklar', () => {
  const rule = contentIntegrityInstruction(new Date('2026-12-31T21:30:00Z'))
  assert.match(rule, /Güncel yıl 2027/)
  assert.match(rule, /istatistik/)
  assert.match(rule, /anekdot/)
  assert.match(rule, /zaman damgası/)
  assert.match(rule, /birebir/)
})

test('yalnız geçici sağlayıcı hataları yeniden denenir', async () => {
  const { isTransientProviderError } = await import('../../lib/ai/integrity')
  assert.equal(isTransientProviderError(new Error('Sağlayıcı 15 sn içinde yanıt vermedi.')), true)
  assert.equal(isTransientProviderError(new Error('[GoogleGenerativeAI Error]: 503 Service Unavailable')), true)
  assert.equal(isTransientProviderError(new Error('429 Too Many Requests')), true)
  assert.equal(isTransientProviderError(new Error('API key not valid')), false)
  assert.equal(isTransientProviderError(new Error('Oturum gerekli.')), false)
})
