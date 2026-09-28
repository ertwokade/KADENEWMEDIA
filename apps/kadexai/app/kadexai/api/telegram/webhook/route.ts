import { timingSafeEqual } from 'node:crypto'
import { NextResponse } from 'next/server'
import { captureApiError } from '@/lib/observability/server'
import { acknowledgeTelegramButton, sendTelegramBotReply } from '@/lib/notifications/telegram'
import { telegramWebhookConfiguration } from '@/lib/notifications/telegramConfig'
import { executeTelegramCommand } from '@/lib/notifications/telegramCommands'
import { parseTelegramBotUpdate, TELEGRAM_MAIN_KEYBOARD } from '@/lib/notifications/telegramBot'
import { activateTelegramGroup, deactivateTelegramGroup, telegramGroupIsActive } from '@/lib/notifications/telegramGroupAccess'
import {
  approveTelegramUser,
  listTelegramUsers,
  requestTelegramUserAccess,
  revokeTelegramUser,
  telegramUserIsAuthorized,
  validTelegramUserId,
} from '@/lib/notifications/telegramUserAccess'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 60

const seenUpdates = new Set<number>()
const OWNER_ONLY_COMMANDS = new Set(['ekle', 'guncelle', 'cekildi', 'cekilmedi', 'cekilenlerisil', 'sil'])
const ACCESS_ADMIN_COMMANDS = new Set(['yetkiver', 'yetkial', 'yetkililer'])

function clean(value: string | undefined, max = 120) {
  return String(value ?? '').replace(/[\u0000-\u001f\u007f]/g, '').replace(/\s+/g, ' ').trim().slice(0, max)
}

function accessLabel(input: { actorId: string; actorName?: string; actorUsername?: string }) {
  const name = clean(input.actorName) || 'İsimsiz Telegram hesabı'
  const username = clean(input.actorUsername, 32)
  return `${name}${username ? ` · @${username}` : ''}\nID: ${input.actorId}`
}

function accessTarget(args: string | undefined) {
  const target = String(args ?? '').trim().split(/\s+/, 1)[0] ?? ''
  return validTelegramUserId(target) ? target : null
}

async function handleAccessAdminCommand(
  action: NonNullable<ReturnType<typeof parseTelegramBotUpdate>>,
  primaryOwner: boolean,
  primaryOwnerIds: string[],
) {
  if (!ACCESS_ADMIN_COMMANDS.has(action.command)) return null
  if (!primaryOwner) return '🔒 Telegram hesap yetkilerini yalnız ana sahip hesabı yönetebilir.'

  if (action.command === 'yetkililer') {
    const users = await listTelegramUsers()
    const lines = users.map((user) => {
      const icon = user.status === 'active' ? '✅' : user.status === 'pending' ? '⏳' : '⛔'
      const label = user.username ? `@${user.username}` : user.display_name || 'İsimsiz hesap'
      return `${icon} ${label} · ${user.user_id}`
    })
    return [
      '👥 KadeX Telegram erişimleri',
      '',
      `Ana sahip: ${primaryOwnerIds.length}`,
      ...(lines.length ? lines : ['Henüz ek yetki veya bekleyen istek yok.']),
      '',
      'Yetki ver: /yetkiver ID',
      'Yetki kaldır: /yetkial ID',
    ].join('\n')
  }

  const target = accessTarget(action.args)
  if (!target) return `⚠️ Kullanım: /${action.command} TELEGRAM_ID`
  if (primaryOwnerIds.includes(target)) return 'ℹ️ Bu hesap ana sahip listesinde; Telegram içinden yetkisi kaldırılamaz.'

  if (action.command === 'yetkiver') {
    const user = await approveTelegramUser(target, action.actorId)
    await sendTelegramBotReply(
      target,
      '✅ KadeX erişimin açıldı. Şimdi /start veya /yardim yazarak bütün komutları kullanabilirsin.',
      TELEGRAM_MAIN_KEYBOARD,
      [target],
    )
    const label = user.username ? `@${user.username}` : user.display_name || target
    return `✅ KadeX erişimi verildi\n\n${label} · ${target}`
  }

  const user = await revokeTelegramUser(target)
  if (!user) return '⚠️ Bu ID için kayıtlı ek Telegram yetkisi bulunamadı.'
  await sendTelegramBotReply(
    target,
    '⛔ KadeX erişimin ana sahip tarafından kapatıldı.',
    undefined,
    [target],
  ).catch(() => undefined)
  return `⛔ KadeX erişimi kaldırıldı\n\n${target}`
}

function sameSecret(provided: string, expected: string) {
  const left = Buffer.from(provided)
  const right = Buffer.from(expected)
  return left.length === right.length && timingSafeEqual(left, right)
}

function alreadySeen(updateId: number) {
  if (seenUpdates.has(updateId)) return true
  seenUpdates.add(updateId)
  if (seenUpdates.size > 1_000) seenUpdates.delete(seenUpdates.values().next().value as number)
  return false
}

export async function POST(request: Request) {
  const config = telegramWebhookConfiguration()
  if (!config.configured) {
    return NextResponse.json({ ok: false }, { status: 503, headers: { 'Cache-Control': 'no-store' } })
  }

  const providedSecret = request.headers.get('x-telegram-bot-api-secret-token') ?? ''
  if (!sameSecret(providedSecret, config.webhookSecret)) {
    return NextResponse.json({ ok: false }, { status: 401, headers: { 'Cache-Control': 'no-store' } })
  }

  const length = Number(request.headers.get('content-length') ?? 0)
  if (Number.isFinite(length) && length > 64 * 1024) {
    return NextResponse.json({ ok: false }, { status: 413, headers: { 'Cache-Control': 'no-store' } })
  }

  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ ok: false }, { status: 400, headers: { 'Cache-Control': 'no-store' } })
  }

  const action = parseTelegramBotUpdate(payload)
  if (!action || alreadySeen(action.updateId)) {
    return NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } })
  }

  const primaryOwnerIds = config.chatIds.filter((chatId) => /^[0-9]{5,20}$/.test(chatId))
  const primaryOwner = config.chatIds.includes(action.actorId)
  const isGroup = action.chatType !== 'private'
  let delegatedActor = false
  try {
    delegatedActor = !primaryOwner && await telegramUserIsAuthorized(action.actorId)
  } catch (error) {
    captureApiError(error, '/api/telegram/webhook/access-check')
  }
  const ownerActor = primaryOwner || delegatedActor

  if (!isGroup && (!ownerActor || action.chatId !== action.actorId)) {
    try {
      if (action.command === 'start' || action.command === 'yetkiiste') {
        const requestResult = await requestTelegramUserAccess({
          userId: action.actorId,
          displayName: action.actorName,
          username: action.actorUsername,
        })
        if (requestResult.created) {
          const approvalKeyboard = {
            inline_keyboard: [[
              { text: '✅ Yetki ver', callback_data: `cmd:yetkiver ${action.actorId}` },
              { text: '🚫 Reddet', callback_data: `cmd:yetkial ${action.actorId}` },
            ]],
          }
          await Promise.allSettled(primaryOwnerIds.map((ownerId) => sendTelegramBotReply(
            ownerId,
            `🔐 Yeni KadeX erişim isteği\n\n${accessLabel(action)}\n\nYalnız hesabı tanıyorsan onayla.`,
            approvalKeyboard,
          )))
        }
        await sendTelegramBotReply(
          action.chatId,
          requestResult.active
            ? '✅ Bu Telegram hesabı zaten KadeX için yetkili. /start yazarak devam edebilirsin.'
            : `⏳ KadeX erişim isteğin ana hesaba gönderildi.\n\nTelegram ID: ${action.actorId}\nOnay verildiğinde bot sana bildirim gönderecek.`,
          undefined,
          [action.chatId],
        )
      } else {
        await sendTelegramBotReply(
          action.chatId,
          `🔒 Bu Telegram hesabı henüz yetkili değil.\n\nErişim istemek için /yetkiiste yaz.\nTelegram ID: ${action.actorId}`,
          undefined,
          [action.chatId],
        )
      }
    } catch (error) {
      captureApiError(error, '/api/telegram/webhook/access-request')
      await sendTelegramBotReply(
        action.chatId,
        '⚠️ Erişim isteği şu anda kaydedilemedi. Biraz sonra /yetkiiste komutunu yeniden dene.',
        undefined,
        [action.chatId],
      ).catch(() => undefined)
    }
    return NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } })
  }

  let canReply = !isGroup && ownerActor
  try {
    if (isGroup && (ACCESS_ADMIN_COMMANDS.has(action.command) || action.command === 'yetkiiste')) {
      await sendTelegramBotReply(
        action.chatId,
        '🔐 Telegram hesap yetkilerini yönetmek için KadeX ile özel sohbeti aç ve komutu orada kullan.',
        undefined,
        [action.chatId],
      )
      return NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } })
    }
    const accessMessage = await handleAccessAdminCommand(action, primaryOwner, primaryOwnerIds)
    if (accessMessage) {
      await sendTelegramBotReply(
        action.chatId,
        accessMessage,
        TELEGRAM_MAIN_KEYBOARD,
        isGroup || delegatedActor ? [action.chatId] : [],
      )
      return NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } })
    }
    if (action.command === 'yetkiiste') {
      await sendTelegramBotReply(
        action.chatId,
        primaryOwner ? '✅ Bu hesap ana KadeX sahibi.' : '✅ Bu Telegram hesabının KadeX erişimi zaten açık.',
        TELEGRAM_MAIN_KEYBOARD,
        delegatedActor ? [action.chatId] : [],
      )
      return NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } })
    }
    let groupActive = false
    if (isGroup) {
      if (action.command === 'baslat') {
        if (!ownerActor) return NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } })
        await activateTelegramGroup({
          chatId: action.chatId,
          chatType: action.chatType === 'supergroup' ? 'supergroup' : 'group',
          chatTitle: action.chatTitle,
          actorId: action.actorId,
        })
        groupActive = true
        canReply = true
      } else if (action.command === 'durdur') {
        if (!ownerActor) return NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } })
        canReply = true
        await deactivateTelegramGroup(action.chatId)
      } else {
        groupActive = await telegramGroupIsActive(action.chatId)
        canReply = groupActive
        if (!groupActive) {
          if (ownerActor) {
            await sendTelegramBotReply(
              action.chatId,
              '⏸️ KadeX bu grupta henüz etkin değil. Bu grubun sahibi olarak /baslat yaz; ardından rapor komutları açılır.',
              undefined,
              [action.chatId],
            )
          }
          return NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } })
        }
      }
    }
    if (action.callbackQueryId) {
      await acknowledgeTelegramButton(action.callbackQueryId).catch(() => undefined)
    }
    if (isGroup && OWNER_ONLY_COMMANDS.has(action.command) && !ownerActor) {
      await sendTelegramBotReply(
        action.chatId,
        '🔒 Bu grupta içerik ekleme, yenileme, çekim durumu ve silme işlemlerini yalnız yetkili sahip yapabilir.',
        TELEGRAM_MAIN_KEYBOARD,
        [action.chatId],
      )
      return NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } })
    }
    const message = await executeTelegramCommand(action.command, {
      chatType: action.chatType,
      groupActive,
      chatId: action.chatId,
      contentLibraryChatId: primaryOwnerIds[0] ?? action.chatId,
      actorId: action.actorId,
      ownerActor,
      args: action.args,
    })
    await sendTelegramBotReply(
      action.chatId,
      message,
      TELEGRAM_MAIN_KEYBOARD,
      isGroup || delegatedActor ? [action.chatId] : [],
    )
  } catch (error) {
    captureApiError(error, '/api/telegram/webhook')
    if (canReply) {
      await sendTelegramBotReply(
        action.chatId,
        '⚠️ KadeX bu komutu şu anda tamamlayamadı. Sistem kaydı alındı; biraz sonra yeniden deneyebilirsin.',
        TELEGRAM_MAIN_KEYBOARD,
        isGroup || delegatedActor ? [action.chatId] : [],
      ).catch(() => undefined)
    }
  }

  return NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } })
}
