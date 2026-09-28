import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'

export type TelegramBotUserStatus = 'pending' | 'active' | 'revoked'

export interface TelegramBotUserAccess {
  user_id: string
  status: TelegramBotUserStatus
  display_name: string | null
  username: string | null
  requested_at: string
  approved_by: string | null
  approved_at: string | null
  revoked_at: string | null
  updated_at: string
}

const USER_ID_PATTERN = /^[0-9]{5,20}$/

export function validTelegramUserId(value: string) {
  return USER_ID_PATTERN.test(value.trim())
}

function clean(value: string | undefined, max: number) {
  const normalized = String(value ?? '')
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  return normalized ? [...normalized].slice(0, max).join('') : null
}

export async function telegramUserIsAuthorized(userId: string) {
  if (!validTelegramUserId(userId)) return false
  const { data, error } = await createAdminClient()
    .from('telegram_bot_users')
    .select('status')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw new Error('Telegram kullanıcı yetkisi okunamadı.')
  return data?.status === 'active'
}

export async function requestTelegramUserAccess(input: {
  userId: string
  displayName?: string
  username?: string
}) {
  if (!validTelegramUserId(input.userId)) throw new Error('Geçersiz Telegram kullanıcı kimliği.')
  const admin = createAdminClient()
  const { data: existing, error: readError } = await admin
    .from('telegram_bot_users')
    .select('status')
    .eq('user_id', input.userId)
    .maybeSingle()
  if (readError) throw new Error('Telegram erişim isteği okunamadı.')
  if (existing?.status === 'active') return { created: false, active: true }
  if (existing?.status === 'pending') return { created: false, active: false }

  const now = new Date().toISOString()
  const { error } = await admin.from('telegram_bot_users').upsert({
    user_id: input.userId,
    status: 'pending',
    display_name: clean(input.displayName, 120),
    username: clean(input.username?.replace(/^@/, ''), 32),
    requested_at: now,
    approved_by: null,
    approved_at: null,
    revoked_at: null,
    updated_at: now,
  }, { onConflict: 'user_id' })
  if (error) throw new Error('Telegram erişim isteği kaydedilemedi.')
  return { created: true, active: false }
}

export async function approveTelegramUser(userId: string, approvedBy: string) {
  if (!validTelegramUserId(userId) || !validTelegramUserId(approvedBy)) {
    throw new Error('Geçersiz Telegram kullanıcı kimliği.')
  }
  const now = new Date().toISOString()
  const { data, error } = await createAdminClient().from('telegram_bot_users').upsert({
    user_id: userId,
    status: 'active',
    approved_by: approvedBy,
    approved_at: now,
    revoked_at: null,
    updated_at: now,
  }, { onConflict: 'user_id' }).select('user_id,status,display_name,username').single()
  if (error || !data) throw new Error('Telegram kullanıcı yetkisi verilemedi.')
  return data as Pick<TelegramBotUserAccess, 'user_id' | 'status' | 'display_name' | 'username'>
}

export async function revokeTelegramUser(userId: string) {
  if (!validTelegramUserId(userId)) throw new Error('Geçersiz Telegram kullanıcı kimliği.')
  const now = new Date().toISOString()
  const { data, error } = await createAdminClient().from('telegram_bot_users')
    .update({ status: 'revoked', revoked_at: now, updated_at: now })
    .eq('user_id', userId)
    .select('user_id,status,display_name,username')
    .maybeSingle()
  if (error) throw new Error('Telegram kullanıcı yetkisi kaldırılamadı.')
  return data as Pick<TelegramBotUserAccess, 'user_id' | 'status' | 'display_name' | 'username'> | null
}

export async function listTelegramUsers() {
  const { data, error } = await createAdminClient().from('telegram_bot_users')
    .select('user_id,status,display_name,username,requested_at,approved_at,updated_at')
    .order('updated_at', { ascending: false })
    .limit(100)
  if (error) throw new Error('Telegram kullanıcı yetkileri listelenemedi.')
  return (data ?? []) as Array<Pick<TelegramBotUserAccess,
    'user_id' | 'status' | 'display_name' | 'username' | 'requested_at' | 'approved_at' | 'updated_at'>>
}
