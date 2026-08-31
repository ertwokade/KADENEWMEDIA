import assert from 'node:assert/strict'
import { test } from 'node:test'
import { generateMockContent } from '../../lib/ai/mockProvider'
import { MockEmailProvider } from '../../lib/email/mockProvider'
import { renderEmail } from '../../lib/email/templates'
import { MockPaymentProvider } from '../../lib/payments/mockProvider'
import { processVerifiedPaymentEvent } from '../../lib/payments/processor'
import { signPaymentPayload } from '../../lib/payments/signature'
import { getPaymentProduct } from '../../lib/payments/catalog'
import type { PaymentEventStore, VerifiedPaymentEvent } from '../../lib/payments/types'

test('AI mock is deterministic and never reports provider tokens', () => {
  const result = generateMockContent({ prompt: 'Bir başlık yaz', model: 'auto' })
  assert.equal(result.tokensUsed, 0)
  assert.match(result.content, /^\[MOCK\]/)
  assert.match(result.routingReason || '', /harici AI çağrısı yapılmadı/)
})

test('AI mock returns valid structured payloads for schema-driven tools', () => {
  const clickbait = JSON.parse(generateMockContent({
    prompt: 'JSON: {"clickbait_skoru":0-100,"alternatifler":[]}',
    systemPrompt: 'Yanıtını sadece JSON ver.',
    model: 'auto',
  }).content)
  assert.equal(clickbait.clickbait_skoru, 42)
  assert.ok(clickbait.alternatifler.length > 0)

  const hashtags = JSON.parse(generateMockContent({
    prompt: 'Konu: dijital pazarlama',
    systemPrompt: 'Sen sosyal medya hashtag stratejistisisin.',
    model: 'auto',
  }).content)
  assert.ok(hashtags.niche.includes('#kadexai'))

  const carousel = JSON.parse(generateMockContent({
    prompt: 'JSON: {"baslik":"","slayts":[],"caption":"","hashtags":[]}',
    systemPrompt: 'Carousel uzmanısın.',
    model: 'auto',
  }).content)
  assert.equal(carousel.slayts.length, 5)
})

test('email templates escape user-controlled HTML and mock captures without sending', async () => {
  const message = renderEmail('user@example.test', { kind: 'welcome', displayName: '<script>alert(1)</script>' })
  assert.doesNotMatch(message.html, /<script>/)
  const provider = new MockEmailProvider()
  const result = await provider.send(message, 'welcome-order-123')
  assert.equal(result.id, 'mock-1')
  assert.equal(provider.sent.length, 1)
})

test('payment mock rejects forged signatures and accepts signed payloads', () => {
  const secret = 'unit-test-secret-that-is-long-enough'
  const raw = JSON.stringify({ eventId: 'evt-1', orderId: 'order-1', status: 'paid' })
  const provider = new MockPaymentProvider(secret)
  assert.throws(() => provider.verifyWebhook(raw, '0'.repeat(64)), /imza/)
  assert.deepEqual(provider.verifyWebhook(raw, signPaymentPayload(raw, secret)), {
    eventId: 'evt-1', orderId: 'order-1', status: 'paid',
  })
})

test('payment event processing is idempotent', async () => {
  const seen = new Set<string>()
  let updates = 0
  const store: PaymentEventStore = {
    async has(id) { return seen.has(id) },
    async record(event) { seen.add(event.eventId) },
    async updateOrder() { updates++ },
  }
  const event: VerifiedPaymentEvent = { eventId: 'evt-2', orderId: 'order-2', status: 'paid' }
  assert.deepEqual(await processVerifiedPaymentEvent(event, store), { duplicate: false })
  assert.deepEqual(await processVerifiedPaymentEvent(event, store), { duplicate: true })
  assert.equal(updates, 1)
})

test('checkout amount and currency come only from the server catalog', () => {
  const clientBody = { productId: 'sandbox-credit', amountMinor: 1, currency: 'USD' }
  const product = getPaymentProduct(clientBody.productId)
  assert.equal(product?.amountMinor, 10000)
  assert.equal(product?.currency, 'TRY')
  assert.equal(Object.isFrozen(product), true)
})
