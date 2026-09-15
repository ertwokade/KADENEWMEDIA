const BOT_TOKEN_PATTERN = /^\d{5,20}:[A-Za-z0-9_-]{20,}$/
const NUMERIC_CHAT_PATTERN = /^-?\d{5,20}$/
const PUBLIC_CHAT_PATTERN = /^@[A-Za-z][A-Za-z0-9_]{4,31}$/
const WEBHOOK_SECRET_PATTERN = /^[A-Za-z0-9_-]{32,256}$/

function validChatId(value: string) {
  return NUMERIC_CHAT_PATTERN.test(value) || PUBLIC_CHAT_PATTERN.test(value)
}

export function telegramConfiguration() {
  const botToken = process.env.TELEGRAM_BOT_TOKEN?.trim() ?? ''
  const chatIds = [...new Set(
    (process.env.TELEGRAM_CHAT_IDS ?? '')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean),
  )]
  const missing: string[] = []
  const placeholderToken = /^(?:your|example|replace|change|dummy|test)[-_ ]/i.test(botToken)

  if (!BOT_TOKEN_PATTERN.test(botToken) || placeholderToken || /[\r\n]/.test(botToken)) {
    missing.push('TELEGRAM_BOT_TOKEN')
  }
  if (chatIds.length === 0 || chatIds.some((chatId) => !validChatId(chatId))) {
    missing.push('TELEGRAM_CHAT_IDS')
  }

  return {
    configured: missing.length === 0,
    missing,
    botToken,
    chatIds,
  }
}

export function telegramWebhookConfiguration() {
  const delivery = telegramConfiguration()
  const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET?.trim() ?? ''
  const missing = [...delivery.missing]

  if (!WEBHOOK_SECRET_PATTERN.test(webhookSecret) || /[\r\n]/.test(webhookSecret)) {
    missing.push('TELEGRAM_WEBHOOK_SECRET')
  }

  return {
    ...delivery,
    configured: missing.length === 0,
    missing,
    webhookSecret,
  }
}

export function maskTelegramChat(chatId: string) {
  if (chatId.startsWith('@')) {
    const visible = chatId.slice(-3)
    return `@${'*'.repeat(Math.max(1, chatId.length - visible.length - 1))}${visible}`
  }
  const visible = chatId.slice(-4)
  return `${chatId.startsWith('-') ? '-' : ''}${'*'.repeat(Math.max(1, chatId.replace('-', '').length - visible.length))}${visible}`
}
