import 'server-only'

import { createClient } from '@/lib/supabase/server'

export async function getAuthenticatedUser() {
  if (process.env.NODE_ENV !== 'production' && process.env.KADE_DISABLE_AUTH === '1') return null
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return null
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    return user
  } catch {
    return null
  }
}

export async function hasAuthenticatedUser() {
  if (process.env.NODE_ENV !== 'production' && process.env.KADE_DISABLE_AUTH === '1') return true
  return Boolean(await getAuthenticatedUser())
}

export async function assertAuthenticatedUser() {
  if (process.env.NODE_ENV !== 'production' && process.env.KADE_DISABLE_AUTH === '1') return null
  const user = await getAuthenticatedUser()
  if (!user) throw new Error('Oturum gerekli.')
  return user
}
