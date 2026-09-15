import assert from 'node:assert/strict'
import { afterEach, test } from 'node:test'
import {
  answerTelegramCallback,
  deliverTelegram,
  deliverTelegramToAllowedChat,
} from '../../lib/notifications/telegramDelivery'
import {
  maskTelegramChat,
  telegramConfiguration,
  telegramWebhookConfiguration,
} from '../../lib/notifications/telegramConfig'

const originalToken = process.env.TELEGRAM_BOT_TOKEN
const originalChats = process.env.TELEGRAM_CHAT_IDS
const originalWebhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET
const token = '123456789:abcdefghijklmnopqrstuvwxyzABCDE_12345'

afterEach(() => {
  if (originalToken === undefined) delete process.env.TELEGRAM_BOT_TOKEN
  else process.env.TELEGRAM_BOT_TOKEN = originalToken
  if (originalChats === undefined) delete process.env.TELEGRAM_CHAT_IDS
  else process.env.TELEGRAM_CHAT_IDS = originalChats
  if (originalWebhookSecret === undefined) delete process.env.TELEGRAM_WEBHOOK_SECRET
  else process.env.TELEGRAM_WEBHOOK_SECRET = originalWebhookSecret
})

test('Telegram webhook requires a strong secret in addition to delivery settings', () => {
  process.env.TELEGRAM_BOT_TOKEN = token
  process.env.TELEGRAM_CHAT_IDS = '123456789'
  process.env.TELEGRAM_WEBHOOK_SECRET = 'short'
  assert.equal(telegramWebhookConfiguration().configured, false)
  assert.deepEqual(telegramWebhookConfiguration().missing, ['TELEGRAM_WEBHOOK_SECRET'])

  process.env.TELEGRAM_WEBHOOK_SECRET = 'a'.repeat(32)
  const config = telegramWebhookConfiguration()
  assert.equal(config.configured, true)
  assert.equal(config.webhookSecret.length, 32)
})

test('Telegram configuration accepts and deduplicates an allowlist', () => {
  process.env.TELEGRAM_BOT_TOKEN = token
  process.env.TELEGRAM_CHAT_IDS = '123456789, -1001234567890, 123456789, @kade_alerts'

  const config = telegramConfiguration()
  assert.equal(config.configured, true)
  assert.deepEqual(config.chatIds, ['123456789', '-1001234567890', '@kade_alerts'])
  assert.deepEqual(config.missing, [])
})

test('Telegram configuration rejects placeholders and malformed recipients', () => {
  process.env.TELEGRAM_BOT_TOKEN = 'your-telegram-token'
  process.env.TELEGRAM_CHAT_IDS = 'not a chat'

  const config = telegramConfiguration()
  assert.equal(config.configured, false)
  assert.deepEqual(config.missing, ['TELEGRAM_BOT_TOKEN', 'TELEGRAM_CHAT_IDS'])
})

test('Telegram delivery uses POST, limits text and masks recipients', async () => {
  const longMessage = ` Bildirim ${'ü'.repeat(4_200)} `
  const result = await deliverTelegram(longMessage, { botToken: token, chatIds: ['123456789'] }, async (input, init) => {
    assert.equal(String(input), `https://api.telegram.org/bot${token}/sendMessage`)
    assert.equal(init?.method, 'POST')
    assert.equal(init?.redirect, 'error')
    const body = JSON.parse(String(init?.body))
    assert.equal(body.chat_id, '123456789')
    assert.equal([...body.text].length, 4096)
    assert.deepEqual(body.link_preview_options, { is_disabled: true })
    assert.equal(body.protect_content, true)
    return Response.json({ ok: true, result: { message_id: 42 } })
  })

  assert.equal(result.providerStatus, 'sent')
  assert.deepEqual(result.delivered, [{ recipient: '*****6789', messageId: 42 }])
})

test('Telegram does not retry uncertain or rate-limited deliveries and never leaks the token', async () => {
  for (const scenario of ['network', 'rate-limit'] as const) {
    let calls = 0
    await assert.rejects(deliverTelegram('Test', { botToken: token, chatIds: ['123456789'] }, async () => {
      calls += 1
      if (scenario === 'network') throw new Error(`secret ${token}`)
      return Response.json({ ok: false, parameters: { retry_after: 17 } }, { status: 429 })
    }), (error: Error) => !error.message.includes(token) && (scenario !== 'rate-limit' || error.message.includes('17 saniye')))
    assert.equal(calls, 1)
  }
})

test('Telegram returns partial success without exposing failed chat IDs', async () => {
  const result = await deliverTelegram('Test', { botToken: token, chatIds: ['123456789', '-1001234567890'] }, async (_input, init) => {
    const body = JSON.parse(String(init?.body))
    return body.chat_id === '123456789'
      ? Response.json({ ok: true, result: { message_id: 9 } })
      : Response.json({ ok: false }, { status: 403 })
  })

  assert.equal(result.providerStatus, 'partial')
  assert.equal(result.delivered.length, 1)
  assert.equal(result.failures.length, 1)
  assert.equal(result.failures[0].includes('-1001234567890'), false)
  assert.equal(maskTelegramChat('@kade_alerts').endsWith('rts'), true)
})

test('Telegram bot replies only to an allowed chat and includes inline buttons', async () => {
  const replyMarkup = { inline_keyboard: [[{ text: 'Durum', callback_data: 'cmd:durum' }]] }
  const result = await deliverTelegramToAllowedChat(
    'Hazır',
    '123456789',
    { botToken: token, chatIds: ['123456789'] },
    { replyMarkup },
    async (_input, init) => {
      const body = JSON.parse(String(init?.body))
      assert.equal(body.chat_id, '123456789')
      assert.deepEqual(body.reply_markup, replyMarkup)
      assert.equal(body.protect_content, true)
      return Response.json({ ok: true, result: { message_id: 77 } })
    },
  )
  assert.equal(result.messageId, 77)

  await assert.rejects(
    deliverTelegramToAllowedChat('Hayır', '999999999', { botToken: token, chatIds: ['123456789'] }),
    /izin listesinde değil/,
  )
})

test('Telegram callback acknowledgement uses the dedicated API method', async () => {
  await answerTelegramCallback('callback-1', token, async (input, init) => {
    assert.equal(String(input), `https://api.telegram.org/bot${token}/answerCallbackQuery`)
    assert.deepEqual(JSON.parse(String(init?.body)), { callback_query_id: 'callback-1' })
    return Response.json({ ok: true, result: true })
  })
})
