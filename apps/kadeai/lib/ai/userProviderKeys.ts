import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'
import { decryptSecret, encryptSecret, hasTokenEncryptionKey } from '@/lib/security/tokenCrypto'

export const USER_KEY_PROVIDERS = ['openai', 'anthropic', 'google'] as const
export type UserKeyProvider = typeof USER_KEY_PROVIDERS[number]

export interface UserProviderKeyStatus {
  provider: UserKeyProvider
  configured: boolean
  hint: string | null
  updatedAt: string | null
}

export function isUserKeyProvider(value: unknown): value is UserKeyProvider {
  return USER_KEY_PROVIDERS.includes(value as UserKeyProvider)
}

function keyHint(secret: string) {
  const clean = secret.trim()
  if (clean.length <= 8) return '••••••••'
  return `${clean.slice(0, 3)}••••${clean.slice(-4)}`
}

export async function listUserProviderKeyStatus(userId: string): Promise<UserProviderKeyStatus[]> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('user_provider_keys')
    .select('provider, key_hint, updated_at')
    .eq('user_id', userId)
  if (error) throw new Error('API anahtarı durumu okunamadı.')

  const rows = new Map((data || []).map((row) => [row.provider, row]))
  return USER_KEY_PROVIDERS.map((provider) => {
    const row = rows.get(provider)
    return {
      provider,
      configured: Boolean(row),
      hint: row?.key_hint || null,
      updatedAt: row?.updated_at || null,
    }
  })
}

export async function saveUserProviderKey(userId: string, provider: UserKeyProvider, secret: string) {
  const clean = secret.trim()
  if (!hasTokenEncryptionKey()) throw new Error('Anahtar şifreleme servisi yapılandırılmamış.')
  if (clean.length < 16 || clean.length > 512 || /[\r\n\0]/.test(clean)) {
    throw new Error('API anahtarı biçimi geçersiz.')
  }

  const encrypted = encryptSecret(clean)
  const admin = createAdminClient()
  const { error } = await admin.from('user_provider_keys').upsert({
    user_id: userId,
    provider,
    encrypted_secret: `\\x${Buffer.from(encrypted).toString('hex')}`,
    key_hint: keyHint(clean),
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id,provider' })
  if (error) throw new Error('API anahtarı kaydedilemedi.')
}

export async function deleteUserProviderKey(userId: string, provider: UserKeyProvider) {
  const admin = createAdminClient()
  const { error } = await admin
    .from('user_provider_keys')
    .delete()
    .eq('user_id', userId)
    .eq('provider', provider)
  if (error) throw new Error('API anahtarı silinemedi.')
}

export async function getUserProviderKey(userId: string, provider: UserKeyProvider): Promise<string | null> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('user_provider_keys')
    .select('encrypted_secret')
    .eq('user_id', userId)
    .eq('provider', provider)
    .maybeSingle()
  if (error) throw new Error('API anahtarı okunamadı.')
  if (!data?.encrypted_secret) return null
  return decryptSecret(data.encrypted_secret as unknown as string)
}
