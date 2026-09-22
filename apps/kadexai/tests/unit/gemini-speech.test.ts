import assert from 'node:assert/strict'
import test from 'node:test'
import { geminiSpeechError, isGeminiTtsModelUnavailable, pickGeminiTtsModel } from '../../lib/ai/geminiSpeech'

test('TTS modeli seçimi: önizleme olmayanı ve daha yeni sürümü tercih eder', () => {
  const picked = pickGeminiTtsModel([
    { name: 'models/gemini-2.5-flash-preview-tts', supportedGenerationMethods: ['generateContent'] },
    { name: 'models/gemini-3-0-flash-tts', supportedGenerationMethods: ['generateContent'] },
    { name: 'models/gemini-flash-latest', supportedGenerationMethods: ['generateContent'] },
  ])
  assert.equal(picked, 'gemini-3-0-flash-tts')
})

test('TTS modeli seçimi: generateContent desteklemeyen model elenir', () => {
  assert.equal(
    pickGeminiTtsModel([{ name: 'models/gemini-2.5-flash-preview-tts', supportedGenerationMethods: ['countTokens'] }]),
    null,
  )
})

test('TTS modeli seçimi: aday yoksa null döner', () => {
  assert.equal(pickGeminiTtsModel([]), null)
  assert.equal(
    pickGeminiTtsModel([{ name: 'models/gemini-flash-latest', supportedGenerationMethods: ['generateContent'] }]),
    null,
  )
})

test('model kimliği hatası yeniden seçim gerektirir, kota hatası gerektirmez', () => {
  assert.equal(isGeminiTtsModelUnavailable(404, ''), true)
  assert.equal(isGeminiTtsModelUnavailable(400, 'model not found'), true)
  assert.equal(isGeminiTtsModelUnavailable(400, 'invalid argument'), false)
  assert.equal(isGeminiTtsModelUnavailable(429, 'quota'), false)
})

test('hata metinleri sır içermez ve durum koduna göre ayrışır', () => {
  assert.match(geminiSpeechError(429), /kota/i)
  assert.match(geminiSpeechError(403), /izn/i)
  assert.match(geminiSpeechError(404), /kullanılamıyor/i)
  assert.match(geminiSpeechError(500), /HTTP 500/)
})
