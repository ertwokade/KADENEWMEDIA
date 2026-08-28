import assert from 'node:assert/strict'
import { test } from 'node:test'
import { estimateCostUsd, getModelRate, resetRateCacheForTests } from '../../lib/ai/pricing'
import { getLimitForTier, isTokenQuotaEnforced, FREE_TIER } from '../../lib/payments/limits'
import { entitlementAllows, tierOf } from '../../lib/payments/planRules'
import { canAccessFeature, isAdminOnlyRoute } from '../../lib/featureAccess'
import { compareModelsFrom } from '../../lib/ai/models'

test('bilinmeyen modelin maliyeti sıfır değil, null döner', () => {
  // 0 dönerse admin panelindeki brüt marj olduğundan iyi görünür.
  assert.equal(estimateCostUsd({ model: 'kayitsiz-model', inputTokens: 1000, outputTokens: 1000 }), null)
})

test('input/output ayrımı verildiğinde maliyet iki tarifeden hesaplanır', () => {
  // claude: 3 $/1M girdi, 15 $/1M çıktı
  const cost = estimateCostUsd({ model: 'claude', inputTokens: 1_000_000, outputTokens: 1_000_000 })
  assert.equal(cost, 18)
})

test('yalnız toplam token varsa çıktı tarifesi kullanılır (marjı iyimser göstermez)', () => {
  const cost = estimateCostUsd({ model: 'claude', totalTokens: 1_000_000 })
  assert.equal(cost, 15)
})

test('BYOK çağrısının maliyeti KadeAI hesabına yazılmaz', () => {
  assert.equal(estimateCostUsd({ model: 'claude', inputTokens: 1_000_000, outputTokens: 1_000_000, byok: true }), 0)
})

test('token bilgisi hiç yoksa maliyet uydurulmaz', () => {
  assert.equal(estimateCostUsd({ model: 'claude' }), null)
})

test('AI_MODEL_RATES_JSON tarifeyi geçersiz kılar, bozuk JSON varsayılana düşer', () => {
  const original = process.env.AI_MODEL_RATES_JSON
  try {
    process.env.AI_MODEL_RATES_JSON = '{"claude":{"in":1,"out":2}}'
    resetRateCacheForTests()
    assert.deepEqual(getModelRate('claude'), { in: 1, out: 2 })

    process.env.AI_MODEL_RATES_JSON = 'bozuk-json'
    resetRateCacheForTests()
    assert.deepEqual(getModelRate('claude'), { in: 3, out: 15 })
  } finally {
    if (original === undefined) delete process.env.AI_MODEL_RATES_JSON
    else process.env.AI_MODEL_RATES_JSON = original
    resetRateCacheForTests()
  }
})

test('paket limitleri merkezi tablodan gelir; sınırsız -1 ile ifade edilir', () => {
  assert.equal(getLimitForTier('sinirsiz', 'monthly_ai_tokens'), -1)
  assert.ok(getLimitForTier('pro', 'monthly_ai_tokens') > getLimitForTier('baslangic', 'monthly_ai_tokens'))
  assert.ok(getLimitForTier('baslangic', 'monthly_ai_tokens') > getLimitForTier(FREE_TIER, 'monthly_ai_tokens'))
  // Bilinmeyen tier ücretsiz pakete düşer (fail-safe).
  assert.equal(getLimitForTier('yok' as never, 'projects'), getLimitForTier(FREE_TIER, 'projects'))
})

test('token kotası varsayılan olarak zorlanmaz', () => {
  const original = process.env.KADEAI_ENFORCE_TOKEN_QUOTA
  try {
    delete process.env.KADEAI_ENFORCE_TOKEN_QUOTA
    assert.equal(isTokenQuotaEnforced(), false)
    process.env.KADEAI_ENFORCE_TOKEN_QUOTA = '1'
    assert.equal(isTokenQuotaEnforced(), true)
  } finally {
    if (original === undefined) delete process.env.KADEAI_ENFORCE_TOKEN_QUOTA
    else process.env.KADEAI_ENFORCE_TOKEN_QUOTA = original
  }
})

test('entitlement motoru: api özelliği features dizisinden değil api_included alanından okunur', () => {
  const proNoApi = { tier: 'pro' as const, period: 'monthly' as const, api_included: false, features: ['bulk'], expires_at: '' }
  assert.equal(entitlementAllows(proNoApi, 'api'), false)
  assert.equal(entitlementAllows({ ...proNoApi, api_included: true }, 'api'), true)
  assert.equal(entitlementAllows(proNoApi, 'bulk'), true)
  assert.equal(entitlementAllows(proNoApi, 'auto-publish'), false)
})

test('yetkisi olmayan kullanıcı ücretsiz pakete düşer', () => {
  assert.equal(tierOf(null), FREE_TIER)
})

test('maliyet uçları admin-only rota sınıfında', () => {
  assert.equal(isAdminOnlyRoute('/api/admin/usage'), true)
  assert.equal(isAdminOnlyRoute('/dashboard/admin'), true)
  assert.equal(isAdminOnlyRoute('/dashboard/title'), false)
  assert.equal(isAdminOnlyRoute('/api/administrator'), false)
})

test('sahip rotaları ortam bayrağına DEĞİL kimliğe bağlı', () => {
  // NEXT_PUBLIC_KADE_OWNER_MODE canlıda set edilmediği için Satış Merkezi
  // hesap sahibine bile kapanmıştı; artık admin rota sınıfında.
  assert.equal(isAdminOnlyRoute('/dashboard/shopier'), true)
  assert.equal(isAdminOnlyRoute('/api/shopier'), true)
  assert.equal(isAdminOnlyRoute('/dashboard/admin'), true)
  assert.equal(isAdminOnlyRoute('/api/admin/usage'), true)
})

test('sahip rotaları owner-mode bayrağıyla artık engellenmiyor', () => {
  // canAccessFeature ikinci parametresi false (owner mode kapalı) olsa bile
  // Satış Merkezi erişilebilir kalmalı; kimlik kontrolü proxy'de yapılıyor.
  assert.equal(canAccessFeature('/dashboard/shopier', false), true)
  assert.equal(canAccessFeature('/dashboard/admin', false), true)
  // Sürümde kapalı araçlar kapalı kalmayı sürdürüyor.
  assert.equal(canAccessFeature('/dashboard/editor', false), false)
})

test('karşılaştırma modelleri yapılandırılmış sağlayıcılarla kesişir', () => {
  // Canlıda yalnız Gemini yapılandırılıyken "3 Modelle Karşılaştır" üç ayrı
  // model adı gösteriyor ama üçü de aynı yedeğe düşüyordu.
  assert.deepEqual(compareModelsFrom(['gemini-flash']), [], 'tek model kaldıysa karşılaştırma anlamsız')
  assert.deepEqual(compareModelsFrom([]), [])
  assert.deepEqual(
    compareModelsFrom(['gemini-flash', 'groq-llama-70b', 'baska-model']),
    ['groq-llama-70b', 'gemini-flash'],
  )
  assert.equal(compareModelsFrom(['cerebras-glm-4-7', 'groq-llama-70b', 'gemini-flash']).length, 3)
})
