import test from 'node:test'
import assert from 'node:assert/strict'
import { modelDisplayName } from '../../lib/ai/models'

test('model kimliği ve sağlayıcı model adı aynı okunur ada çevrilir', () => {
  assert.equal(modelDisplayName('gemini-3-1-lite'), 'Gemini 3.1 Flash Lite')
  assert.equal(modelDisplayName('gemini-3.1-flash-lite'), 'Gemini 3.1 Flash Lite')
  assert.equal(modelDisplayName('gemini-flash-lite-latest'), 'Gemini Flash-Lite Latest')
  assert.equal(modelDisplayName('bilinmeyen-model-2'), 'Bilinmeyen Model 2')
  assert.equal(modelDisplayName(''), 'Bilinmiyor')
})
