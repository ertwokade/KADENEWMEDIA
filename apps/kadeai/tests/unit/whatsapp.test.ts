import assert from 'node:assert/strict'
import { afterEach, test } from 'node:test'
import { callMeBotResponseQueued, whatsappConfiguration } from '../../lib/notifications/whatsappConfig'

const originalPhone = process.env.WA_PHONE
const originalApiKey = process.env.WA_APIKEY

afterEach(() => {
  if (originalPhone === undefined) delete process.env.WA_PHONE
  else process.env.WA_PHONE = originalPhone
  if (originalApiKey === undefined) delete process.env.WA_APIKEY
  else process.env.WA_APIKEY = originalApiKey
})

test('WhatsApp configuration accepts a normalized real-looking pair', () => {
  process.env.WA_PHONE = '+90 555 123 45 67'
  process.env.WA_APIKEY = '123456'

  const config = whatsappConfiguration()
  assert.equal(config.configured, true)
  assert.equal(config.phone, '905551234567')
  assert.deepEqual(config.missing, [])
})

test('WhatsApp configuration rejects the documented phone placeholder', () => {
  process.env.WA_PHONE = '905XXXXXXXXX'
  process.env.WA_APIKEY = '123456'

  const config = whatsappConfiguration()
  assert.equal(config.configured, false)
  assert.deepEqual(config.missing, ['WA_PHONE'])
})

test('WhatsApp configuration rejects example API keys', () => {
  process.env.WA_PHONE = '905551234567'
  process.env.WA_APIKEY = 'your-callmebot-api-key'

  const config = whatsappConfiguration()
  assert.equal(config.configured, false)
  assert.deepEqual(config.missing, ['WA_APIKEY'])
})

test('CallMeBot success parser only accepts a queued acknowledgement', () => {
  assert.equal(callMeBotResponseQueued('Message queued. You will receive it in a few seconds.'), true)
  assert.equal(callMeBotResponseQueued('Message Queued'), true)
  assert.equal(callMeBotResponseQueued('APIKey is invalid'), false)
  assert.equal(callMeBotResponseQueued(''), false)
})
