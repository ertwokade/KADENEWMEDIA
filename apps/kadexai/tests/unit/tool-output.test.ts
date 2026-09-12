import test from 'node:test'
import assert from 'node:assert/strict'
import { normalizeHookOutput, normalizeTitleOutput, normalizeTranslationOutput } from '../../lib/ai/toolOutput'

test('başlık çıktısı sohbet önsözünü ve yanlış tipleri reddeder', () => {
  assert.deepEqual(normalizeTitleOutput('Elbette, işte başlıklar:\n- Birinci'), [])
  assert.deepEqual(normalizeTitleOutput('["  Birinci  ", false, {}, "İkinci"]'), ['Birinci', 'İkinci'])
  assert.equal(normalizeTitleOutput(JSON.stringify(['x'.repeat(400)]))[0].length, 300)
})

test('hook çıktısı yalnız kullanılabilir kartları sınırlı olarak kabul eder', () => {
  assert.deepEqual(normalizeHookOutput('Elbette, yardımcı olayım.'), [])
  assert.deepEqual(normalizeHookOutput(JSON.stringify([
    { hook: '  İlk cümle  ', tip: 'merak', neden: 'Nedeni' },
    { hook: false, tip: 'bozuk' },
  ])), [{ hook: 'İlk cümle', tip: 'merak', neden: 'Nedeni' }])
})

test('çeviri çıktısı eksik şemayı reddeder ve yanlış bölümleri eler', () => {
  assert.equal(normalizeTranslationOutput('{}'), null)
  assert.equal(normalizeTranslationOutput('{"ceviri":false}'), null)
  assert.deepEqual(normalizeTranslationOutput(JSON.stringify({
    ceviri: 'Tam çeviri',
    bolumler: [
      { orijinal: 'Merhaba', ceviri: 'Hello', telaffuz: 'helo' },
      { orijinal: 'Eksik' },
    ],
    kulturel_notlar: ['Not'],
    genel_yonerge: 'Doğal oku',
  })), {
    ceviri: 'Tam çeviri',
    bolumler: [{ orijinal: 'Merhaba', ceviri: 'Hello', telaffuz: 'helo', zamanlama: '', not: '' }],
    kulturel_notlar: ['Not'],
    genel_yonerge: 'Doğal oku',
  })
})
