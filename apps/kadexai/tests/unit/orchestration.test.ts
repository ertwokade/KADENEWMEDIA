import assert from 'node:assert/strict'
import { test } from 'node:test'
import { MAX_STEPS_PER_RUN, PIPELINES, canInvoke, getPipeline, isEntryStep } from '../../lib/orchestration/registry'

test('bir adım yalnızca kendisinden SONRAKİ adımı tetikleyebilir', () => {
  assert.equal(canInvoke('content-sprint', 'trends', 'competitor'), true)
  // Atlama yasak: zincir bağlamı eksik kalır.
  assert.equal(canInvoke('content-sprint', 'trends', 'content-plan'), false)
  // Geri dönüş yasak: sonsuz döngü riski.
  assert.equal(canInvoke('content-sprint', 'competitor', 'trends'), false)
  // Kendini çağırma yasak.
  assert.equal(canInvoke('content-sprint', 'trends', 'trends'), false)
})

test('bilinmeyen akış ve bilinmeyen adım için yetki verilmez', () => {
  assert.equal(canInvoke('uydurma-akis', 'trends', 'competitor'), false)
  assert.equal(canInvoke('content-sprint', 'trends', 'uydurma-adim'), false)
  assert.equal(getPipeline('uydurma-akis'), undefined)
})

test('yalnızca ilk adım dışarıdan tetiklenebilir', () => {
  assert.equal(isEntryStep('content-sprint', 'trends'), true)
  assert.equal(isEntryStep('content-sprint', 'hashtag'), false)
})

test('her akış adım tavanının altında ve adım kimlikleri benzersiz', () => {
  for (const pipeline of PIPELINES) {
    assert.ok(pipeline.steps.length <= MAX_STEPS_PER_RUN, `${pipeline.id} adım tavanını aşıyor`)
    const ids = pipeline.steps.map((step) => step.id)
    assert.equal(new Set(ids).size, ids.length, `${pipeline.id} içinde tekrar eden adım kimliği var`)
  }
})

test('her adımın timeout ve token tavanı tanımlı', () => {
  for (const pipeline of PIPELINES) {
    for (const step of pipeline.steps) {
      assert.ok(step.timeoutMs > 0 && step.timeoutMs <= 60_000, `${step.id} timeout aralık dışı`)
      assert.ok(step.maxTokens > 0 && step.maxTokens <= 4_000, `${step.id} token tavanı aralık dışı`)
    }
  }
})

test('her akış paket özelliği talep eder (yetkisiz çalıştırma yok)', () => {
  for (const pipeline of PIPELINES) {
    assert.ok(pipeline.requiresFeature, `${pipeline.id} özellik gerektirmiyor`)
  }
})
