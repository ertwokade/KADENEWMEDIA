import type { TelegramReplyMarkup } from './telegramDelivery'

export const TELEGRAM_COMMANDS = [
  { command: 'start', description: 'KadeX ana menüsünü aç' },
  { command: 'baslat', description: 'KadeX’i bu grupta etkinleştir' },
  { command: 'durdur', description: 'KadeX’i bu grupta durdur' },
  { command: 'genel', description: 'Yönetim özetini göster' },
  { command: 'durum', description: 'Tüm servislerin sağlık durumunu göster' },
  { command: 'bugun', description: 'Bugünkü operasyon özetini göster' },
  { command: 'hafta', description: 'Son 7 günün operasyon özetini göster' },
  { command: 'sonislemler', description: 'Son operasyon kayıtlarını göster' },
  { command: 'trendler', description: 'Güncel içerik fırsatlarını göster' },
  { command: 'teklifler', description: 'Tekliflerin durum özetini göster' },
  { command: 'abonelikler', description: 'Aboneliklerin durum özetini göster' },
  { command: 'kullanicilar', description: 'KadexAI kullanıcı sayısını göster' },
  { command: 'kullanim', description: 'AI kullanım ve token özetini göster' },
  { command: 'ai', description: 'AI sağlayıcılarının durumunu göster' },
  { command: 'bildirimler', description: 'Bildirim kanallarının durumunu göster' },
  { command: 'hatalar', description: 'Son sistem hatalarını göster' },
  { command: 'performans', description: 'Canlı uçların hızını ölç' },
  { command: 'sitemap', description: 'Site haritasını kontrol et' },
  { command: 'rapor', description: 'Kapsamlı canlı rapor hazırla' },
  { command: 'grup', description: 'Bu sohbetin bot durumunu göster' },
  { command: 'hakkinda', description: 'KadeX yeteneklerini göster' },
  { command: 'yardim', description: 'Tüm komutları göster' },
] as const

export type TelegramBotCommand = typeof TELEGRAM_COMMANDS[number]['command']
export type TelegramBotChatType = 'private' | 'group' | 'supergroup'

export interface TelegramBotAction {
  updateId: number
  chatId: string
  actorId: string
  chatType: TelegramBotChatType
  chatTitle?: string
  command: TelegramBotCommand
  callbackQueryId?: string
}

const COMMANDS = new Set<TelegramBotCommand>(TELEGRAM_COMMANDS.map((item) => item.command))

function normalizedCommand(value: unknown): TelegramBotCommand {
  const raw = String(value ?? '').trim().toLocaleLowerCase('tr-TR')
  const withoutPrefix = raw.startsWith('cmd:') ? raw.slice(4) : raw
  const firstToken = withoutPrefix.split(/\s+/, 1)[0] ?? ''
  const command = firstToken.replace(/^\//, '').split('@', 1)[0]
  const aliases: Record<string, TelegramBotCommand> = {
    help: 'yardim', menu: 'yardim', yardım: 'yardim',
    başlat: 'baslat', ac: 'baslat', aç: 'baslat',
    stop: 'durdur', kapat: 'durdur',
    weekly: 'hafta', today: 'bugun', status: 'durum',
    users: 'kullanicilar', usage: 'kullanim', about: 'hakkinda',
  }
  if (aliases[command]) return aliases[command]
  return COMMANDS.has(command as TelegramBotCommand) ? command as TelegramBotCommand : 'yardim'
}

function parsedChat(message: unknown, fromId: unknown) {
  if (!message || typeof message !== 'object' || !Number.isSafeInteger(fromId)) return null
  const chat = (message as { chat?: unknown }).chat
  if (!chat || typeof chat !== 'object') return null
  const type = (chat as { type?: unknown }).type
  const id = (chat as { id?: unknown }).id
  const title = (chat as { title?: unknown }).title
  if (!Number.isSafeInteger(id) || !['private', 'group', 'supergroup'].includes(String(type))) return null
  if (type === 'private' && id !== fromId) return null
  if (type !== 'private' && Number(id) >= 0) return null
  return {
    chatId: String(id),
    actorId: String(fromId),
    chatType: type as TelegramBotChatType,
    ...(typeof title === 'string' && title.trim() ? { chatTitle: title } : {}),
  }
}

export function parseTelegramBotUpdate(input: unknown): TelegramBotAction | null {
  if (!input || typeof input !== 'object') return null
  const update = input as { update_id?: unknown; message?: unknown; callback_query?: unknown }
  if (!Number.isSafeInteger(update.update_id)) return null

  if (update.callback_query && typeof update.callback_query === 'object') {
    const callback = update.callback_query as {
      id?: unknown
      data?: unknown
      from?: { id?: unknown }
      message?: unknown
    }
    const chat = parsedChat(callback.message, callback.from?.id)
    if (!chat || typeof callback.id !== 'string' || callback.id.length < 1 || callback.id.length > 128) return null
    return {
      updateId: update.update_id as number,
      ...chat,
      command: normalizedCommand(callback.data),
      callbackQueryId: callback.id,
    }
  }

  if (update.message && typeof update.message === 'object') {
    const message = update.message as { text?: unknown; from?: { id?: unknown } }
    const chat = parsedChat(update.message, message.from?.id)
    if (!chat || typeof message.text !== 'string') return null
    return {
      updateId: update.update_id as number,
      ...chat,
      command: normalizedCommand(message.text),
    }
  }

  return null
}

export const TELEGRAM_MAIN_KEYBOARD: TelegramReplyMarkup = {
  inline_keyboard: [
    [
      { text: '🏠 Genel', callback_data: 'cmd:genel' },
      { text: '🟢 Durum', callback_data: 'cmd:durum' },
    ],
    [
      { text: '📊 Bugün', callback_data: 'cmd:bugun' },
      { text: '📅 Hafta', callback_data: 'cmd:hafta' },
    ],
    [
      { text: '🔥 Trendler', callback_data: 'cmd:trendler' },
      { text: '📄 Teklifler', callback_data: 'cmd:teklifler' },
    ],
    [
      { text: '🔁 Abonelikler', callback_data: 'cmd:abonelikler' },
      { text: '⚡ Kullanım', callback_data: 'cmd:kullanim' },
    ],
    [
      { text: '🤖 AI', callback_data: 'cmd:ai' },
      { text: '🔔 Bildirim', callback_data: 'cmd:bildirimler' },
    ],
    [
      { text: '🔴 Hatalar', callback_data: 'cmd:hatalar' },
      { text: '🧪 Rapor', callback_data: 'cmd:rapor' },
    ],
    [
      { text: '👥 Grup', callback_data: 'cmd:grup' },
      { text: '❓ Yardım', callback_data: 'cmd:yardim' },
    ],
  ],
}
