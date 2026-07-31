import assert from 'node:assert/strict'
import test from 'node:test'
import type { AIModel } from '../../types'
import { routeModelForTask } from '../../lib/ai/modelRouter'

const available: AIModel[] = [
  'auto',
  'groq-llama-70b',
  'groq-qwen-32b',
  'groq-gpt-oss-120b',
  'groq-gpt-oss-20b',
  'groq-compound-mini',
  'cerebras-glm-4-7',
  'gemini-flash',
  'mistral-codestral',
]

test('kod görevi için teknik modeli seçer ve yedekleri sıralar', () => {
  const result = routeModelForTask({
    prompt: 'Bu React TypeScript kodunu incele, hatayı ayıkla ve düzelt.',
  }, available)

  assert.equal(result.task, 'coding')
  assert.equal(result.model, 'mistral-codestral')
  assert.ok(result.alternatives.includes('groq-qwen-32b'))
  assert.match(result.reason, /kod ve teknik üretim/i)
})

test('çoklu sinyallerde baskın analiz amacını korur', () => {
  const result = routeModelForTask({
    prompt: 'Rakip performansını analiz et, riskleri karşılaştır ve sonucu JSON formatında ver.',
  }, available)

  assert.equal(result.task, 'analysis')
  assert.equal(result.model, 'groq-gpt-oss-120b')
})

test('uzun bağlamı metin uzunluğundan algılar', () => {
  const result = routeModelForTask({
    prompt: `Bu dokümanı özetle:\n${'uzun bağlam '.repeat(700)}`,
  }, available)

  assert.equal(result.task, 'long-context')
  assert.equal(result.model, 'gemini-flash')
})

test('yalnızca gerçekten kullanılabilir modelleri döndürür', () => {
  const result = routeModelForTask({
    prompt: 'Yaratıcı bir Instagram açıklaması yaz.',
  }, ['auto', 'cerebras-glm-4-7'])

  assert.equal(result.model, 'cerebras-glm-4-7')
  assert.deepEqual(result.alternatives, [])
})
