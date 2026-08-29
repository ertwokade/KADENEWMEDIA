import assert from 'node:assert/strict'
import test from 'node:test'
import type { AIModel } from '../../types'
import { getModelConfig } from '../../lib/ai/models'
import { getAvailableModels, routeModelForTask } from '../../lib/ai/modelRouter'

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

test('yalnızca Gateway bağlıyken yaratıcı görev ekonomik modele yönlenir', () => {
  const result = routeModelForTask({
    prompt: 'Sosyal medya için yaratıcı bir başlık üret.',
    maxTokens: 2_000,
  }, ['auto', 'vercel-qwen-flash'])

  assert.equal(result.model, 'vercel-qwen-flash')
  assert.deepEqual(result.alternatives, [])
})

test('AI Gateway modeli yalnız açık anahtar varken sunulur', () => {
  // Eskiden Vercel ortamında olmak yeterliydi. Canlıda ölçüldü: OIDC kimliği
  // çözülüyor olmasına rağmen gateway her istekte
  // 500 "AI Gateway requires a valid credit card on file" döndürüyordu ve
  // auto sırasında denendiği için her isteğe saniyeler ekliyordu.
  // Kimliğin çözülmesi, hesabın o servisi KULLANABİLDİĞİNİ kanıtlamaz.
  const previousVercel = process.env.VERCEL
  const previousKey = process.env.AI_GATEWAY_API_KEY
  process.env.VERCEL = '1'
  try {
    delete process.env.AI_GATEWAY_API_KEY
    assert.equal(getAvailableModels().includes('vercel-qwen-flash'), false, 'anahtarsız sunulmamalı')

    process.env.AI_GATEWAY_API_KEY = 'test-anahtari'
    assert.equal(getAvailableModels().includes('vercel-qwen-flash'), true, 'anahtar varken sunulmalı')
  } finally {
    if (previousVercel === undefined) delete process.env.VERCEL
    else process.env.VERCEL = previousVercel
    if (previousKey === undefined) delete process.env.AI_GATEWAY_API_KEY
    else process.env.AI_GATEWAY_API_KEY = previousKey
  }
})

test('yanıt vermeyen Gemini sürüm adları kullanıma sunulmaz', () => {
  // gemini-2.5-flash / -flash-lite ve Pro canlıda 500 donduruyor; bu surum
  // adlari anahtara acik degil. Listede kalirlarsa hem secicide gorunur hem
  // auto sirasinda denenip zaman harcarlar.
  const previous = process.env.GEMINI_API_KEY
  process.env.GEMINI_API_KEY = 'test-anahtari'
  try {
    const models = getAvailableModels()
    for (const dead of ['gemini-flash', 'gemini-flash-lite', 'gemini']) {
      assert.equal(models.includes(dead as never), false, `${dead} sunulmamalı`)
    }
    for (const alive of ['gemini-flash-latest', 'gemini-lite-latest', 'gemini-3-5-flash', 'gemini-3-1-lite']) {
      assert.equal(models.includes(alive as never), true, `${alive} sunulmalı`)
    }
  } finally {
    if (previous === undefined) delete process.env.GEMINI_API_KEY
    else process.env.GEMINI_API_KEY = previous
  }
})

test('ekonomik Gateway modeli Vercel kataloğundaki geçerli kimliği kullanır', () => {
  const model = getModelConfig('vercel-qwen-flash')
  assert.equal(model.gatewayModel, 'alibaba/qwen3.5-flash')
  assert.match(model.label, /Qwen 3\.5 Flash/)
})
