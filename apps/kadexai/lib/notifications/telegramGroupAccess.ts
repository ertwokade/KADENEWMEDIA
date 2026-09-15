import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'

export type TelegramGroupType = 'group' | 'supergroup'

function cleanTitle(value: string | undefined) {
  const title = String(value ?? '').replace(/[\u0000-\u001f\u007f]/g, '').replace(/\s+/g, ' ').trim()
  return title ? [...title].slice(0, 120).join('') : null
}

export async function telegramGroupIsActive(chatId: string) {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('telegram_bot_chats')
    .select('active')
    .eq('chat_id', chatId)
    .maybeSingle()
  if (error) throw new Error('Telegram grup yetkisi okunamadı.')
  return data?.active === true
}

export async function activateTelegramGroup(input: {
  chatId: string
  chatType: TelegramGroupType
  chatTitle?: string
  actorId: string
}) {
  const admin = createAdminClient()
  const now = new Date().toISOString()
  const { error } = await admin.from('telegram_bot_chats').upsert({
    chat_id: input.chatId,
    chat_type: input.chatType,
    title: cleanTitle(input.chatTitle),
    activated_by: input.actorId,
    active: true,
    activated_at: now,
    updated_at: now,
  }, { onConflict: 'chat_id' })
  if (error) throw new Error('Telegram grubu etkinleştirilemedi.')
}

export async function deactivateTelegramGroup(chatId: string) {
  const admin = createAdminClient()
  const { error } = await admin
    .from('telegram_bot_chats')
    .update({ active: false, updated_at: new Date().toISOString() })
    .eq('chat_id', chatId)
  if (error) throw new Error('Telegram grubu durdurulamadı.')
}
