import type { TelegramReplyMarkup } from './telegramDelivery'

export const TELEGRAM_COMMANDS = [
  { command: 'start', description: 'KadeX yönetim menüsünü aç' },
  { command: 'durum', description: 'Site, KadexAI ve veritabanı durumunu göster' },
  { command: 'bugun', description: 'Bugünkü operasyon özetini göster' },
  { command: 'trendler', description: 'Güncel içerik fırsatlarını göster' },
  { command: 'teklifler', description: 'Bekleyen teklif sayılarını göster' },
  { command: 'hatalar', description: 'Son sistem hatalarını göster' },
  { command: 'rapor', description: 'Canlı kısa site raporu hazırla' },
  { command: 'yardim', description: 'Komutları ve güvenlik bilgisini göster' },
] as const

export type TelegramBotCommand = typeof TELEGRAM_COMMANDS[number]['command']

export interface TelegramBotAction {
  updateId: number
  chatId: string
  command: TelegramBotCommand
  callbackQueryId?: string
}

const COMMANDS = new Set<TelegramBotCommand>(TELEGRAM_COMMANDS.map((item) => item.command))

function normalizedCommand(value: unknown): TelegramBotCommand {
  const raw = String(value ?? '').trim().toLowerCase()
  const withoutPrefix = raw.startsWith('cmd:') ? raw.slice(4) : raw
  const firstToken = withoutPrefix.split(/\s+/, 1)[0] ?? ''
  const command = firstToken.replace(/^\//, '').split('@', 1)[0]
  if (command === 'help' || command === 'menu') return 'yardim'
  return COMMANDS.has(command as TelegramBotCommand) ? command as TelegramBotCommand : 'yardim'
}

function privateChatId(message: unknown, fromId: unknown) {
  if (!message || typeof message !== 'object') return null
  const chat = (message as { chat?: unknown }).chat
  if (!chat || typeof chat !== 'object') return null
  const type = (chat as { type?: unknown }).type
  const id = (chat as { id?: unknown }).id
  if (type !== 'private' || !Number.isSafeInteger(id) || id !== fromId) return null
  return String(id)
}

export function parseTelegramBotUpdate(input: unknown): TelegramBotAction | null {
  if (!input || typeof input !== 'object') return null
  const update = input as {
    update_id?: unknown
    message?: unknown
    callback_query?: unknown
  }
  if (!Number.isSafeInteger(update.update_id)) return null

  if (update.callback_query && typeof update.callback_query === 'object') {
    const callback = update.callback_query as {
      id?: unknown
      data?: unknown
      from?: { id?: unknown }
      message?: unknown
    }
    const chatId = privateChatId(callback.message, callback.from?.id)
    if (!chatId || typeof callback.id !== 'string' || callback.id.length < 1 || callback.id.length > 128) return null
    return {
      updateId: update.update_id as number,
      chatId,
      command: normalizedCommand(callback.data),
      callbackQueryId: callback.id,
    }
  }

  if (update.message && typeof update.message === 'object') {
    const message = update.message as { text?: unknown; from?: { id?: unknown } }
    const chatId = privateChatId(update.message, message.from?.id)
    if (!chatId || (message.text !== undefined && typeof message.text !== 'string')) return null
    return {
      updateId: update.update_id as number,
      chatId,
      command: normalizedCommand(message.text),
    }
  }

  return null
}

export const TELEGRAM_MAIN_KEYBOARD: TelegramReplyMarkup = {
  inline_keyboard: [
    [
      { text: '🟢 Durum', callback_data: 'cmd:durum' },
      { text: '📊 Bugün', callback_data: 'cmd:bugun' },
    ],
    [
      { text: '🔥 Trendler', callback_data: 'cmd:trendler' },
      { text: '📄 Teklifler', callback_data: 'cmd:teklifler' },
    ],
    [
      { text: '🔴 Hatalar', callback_data: 'cmd:hatalar' },
      { text: '🧪 Rapor', callback_data: 'cmd:rapor' },
    ],
    [{ text: '❓ Yardım', callback_data: 'cmd:yardim' }],
  ],
}
