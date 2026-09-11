import test from 'node:test'
import assert from 'node:assert/strict'
import { deliverWhatsApp } from '../../lib/notifications/whatsappDelivery'
import { notificationHourlyBudget, callMeBotResponseQueued } from '../../lib/notifications/whatsappConfig'

const config = { phone: '905551234567', apiKey: 'secret-fixture' }

test('delivery is acknowledged as queued, not delivered, with encoded text and masked recipient', async () => {
  const result = await deliverWhatsApp('Merhaba + & 🎬', config, async (input, init) => {
    const url = new URL(String(input))
    assert.equal(url.searchParams.get('text'), 'Merhaba + & 🎬')
    assert.equal(init?.redirect, 'error')
    return new Response('Message <b>queued</b>')
  })
  assert.equal(result.providerStatus, 'queued')
  assert.equal(result.recipient, '********4567')
})

test('rejections and network failures never expose credentials or replay messages', async () => {
  for (const status of [200, 400, 429, 503, 0]) {
    let calls = 0
    await assert.rejects(deliverWhatsApp('Test', config, async () => {
      calls++
      if (!status) throw new Error(`URL with ${config.apiKey}`)
      return new Response(`Invalid APIKey ${config.apiKey}`, { status })
    }), (error: Error) => !error.message.includes(config.apiKey))
    assert.equal(calls, 1)
  }
})

test('empty notification fails before any outbound request', async () => {
  await assert.rejects(deliverWhatsApp(' ', config, async () => { throw new Error('must not fetch') }), /boş/)
})

test('negative or mixed acknowledgements are not considered success', () => {
  assert.equal(callMeBotResponseQueued('Message not queued'), false)
  assert.equal(callMeBotResponseQueued('ERROR: example success text Message queued'), false)
  assert.equal(callMeBotResponseQueued('Message&nbsp;queued'), true)
})

test('unset and blank hourly limits use default while explicit zero disables', () => {
  for (const value of [undefined, '', ' ', '-1', 'foo', '0.5']) assert.equal(notificationHourlyBudget(value), 20)
  assert.equal(notificationHourlyBudget('0'), 0)
  assert.equal(notificationHourlyBudget('10'), 10)
})
