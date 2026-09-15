import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  parseTelegramBotUpdate,
  TELEGRAM_COMMANDS,
  TELEGRAM_MAIN_KEYBOARD,
} from '../../lib/notifications/telegramBot'

test('Telegram bot parses owner private-chat commands and bot suffixes', () => {
  assert.deepEqual(parseTelegramBotUpdate({
    update_id: 101,
    message: {
      text: '/durum@KadeXAiBot',
      from: { id: 123456789 },
      chat: { id: 123456789, type: 'private' },
    },
  }), {
    updateId: 101,
    chatId: '123456789',
    actorId: '123456789',
    chatType: 'private',
    command: 'durum',
  })
})

test('Telegram bot parses inline button callbacks', () => {
  assert.deepEqual(parseTelegramBotUpdate({
    update_id: 102,
    callback_query: {
      id: 'callback-102',
      data: 'cmd:trendler',
      from: { id: 123456789 },
      message: { chat: { id: 123456789, type: 'private' } },
    },
  }), {
    updateId: 102,
    chatId: '123456789',
    actorId: '123456789',
    chatType: 'private',
    command: 'trendler',
    callbackQueryId: 'callback-102',
  })
})

test('Telegram bot parses group activation with actor and title', () => {
  assert.deepEqual(parseTelegramBotUpdate({
    update_id: 103,
    message: {
      text: '/baslat@KadeXAiBot',
      from: { id: 123456789 },
      chat: { id: -1001234567890, type: 'supergroup', title: 'Kade Ekibi' },
    },
  }), {
    updateId: 103,
    chatId: '-1001234567890',
    actorId: '123456789',
    chatType: 'supergroup',
    chatTitle: 'Kade Ekibi',
    command: 'baslat',
  })
})

test('Telegram bot rejects private-chat impersonation and malformed updates', () => {
  assert.equal(parseTelegramBotUpdate({
    update_id: 104,
    message: {
      text: '/durum',
      from: { id: 123456789 },
      chat: { id: 987654321, type: 'private' },
    },
  }), null)
  assert.equal(parseTelegramBotUpdate({ message: { text: '/durum' } }), null)
})

test('Telegram bot maps unknown text to help and every button to a registered command', () => {
  const action = parseTelegramBotUpdate({
    update_id: 105,
    message: {
      text: 'selam',
      from: { id: 123456789 },
      chat: { id: 123456789, type: 'private' },
    },
  })
  assert.equal(action?.command, 'yardim')
  assert.equal(TELEGRAM_COMMANDS.length, 22)

  const registered = new Set(TELEGRAM_COMMANDS.map((item) => item.command))
  for (const row of TELEGRAM_MAIN_KEYBOARD.inline_keyboard) {
    for (const button of row) assert.equal(registered.has(button.callback_data.replace('cmd:', '') as never), true)
  }
})

test('Telegram bot supports Turkish and English lifecycle aliases', () => {
  for (const [text, command] of [['/başlat', 'baslat'], ['/stop', 'durdur'], ['/menu', 'yardim']] as const) {
    const action = parseTelegramBotUpdate({
      update_id: 200 + text.length,
      message: {
        text,
        from: { id: 123456789 },
        chat: { id: -1001234567890, type: 'supergroup' },
      },
    })
    assert.equal(action?.command, command)
  }
})
