import test from 'node:test'
import assert from 'node:assert/strict'
import { geminiImageError, isGeminiModelUnavailable, pickGeminiImageModel } from '../../lib/ai/geminiImage'

test('emekli görsel modeli yerine erişilebilir en yeni kararlı görsel modeli seçilir', () => {
  const picked = pickGeminiImageModel([
    { name: 'models/gemini-3.6-flash', supportedGenerationMethods: ['generateContent'] },
    { name: 'models/gemini-3-pro-image-preview', supportedGenerationMethods: ['generateContent'] },
    { name: 'models/gemini-3.1-flash-image', supportedGenerationMethods: ['generateContent'] },
    { name: 'models/gemini-2.5-flash-image', supportedGenerationMethods: ['generateContent'] },
    { name: 'models/imagen-4.0-generate-001', supportedGenerationMethods: ['predict'] },
  ])
  assert.equal(picked, 'gemini-3.1-flash-image')
  assert.equal(pickGeminiImageModel([{ name: 'models/gemini-3-pro-image-preview', supportedGenerationMethods: ['generateContent'] }]), 'gemini-3-pro-image-preview')
  assert.equal(pickGeminiImageModel([{ name: 'models/gemini-3.6-flash', supportedGenerationMethods: ['generateContent'] }]), null)
})

test('görsel hataları nedenine göre ayrılır ve model hatası yeniden seçimi tetikler', () => {
  assert.match(geminiImageError(429), /kota/)
  assert.match(geminiImageError(403), /izni yok/)
  assert.match(geminiImageError(404), /kullanılamıyor/)
  assert.equal(isGeminiModelUnavailable(404, ''), true)
  assert.equal(isGeminiModelUnavailable(400, 'models/gemini-2.5-flash-image is not found for API version v1beta'), true)
  assert.equal(isGeminiModelUnavailable(429, 'quota'), false)
})
