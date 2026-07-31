import 'server-only'

import bcrypt from 'bcryptjs'
import type { User } from '@supabase/supabase-js'
import { adminAuthEmail } from '@/lib/auth/adminIdentity'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

const DUMMY_PASSWORD_HASH = '$2b$12$Zv/RZV4jtUVmRECllfTrU.8ZX2yimHgCZJMD8gZd.EhWDnoCrSc.u'

type AdminAccount = {
  id: string
  username: string
  email: string | null
  password_hash: string
  role: string
}

export type AdminBridgeResult =
  | { ok: true; user: User }
  | { ok: false; reason: 'invalid_credentials' | 'not_admin' | 'unavailable' }

async function findAdminAccount(identifier: string): Promise<AdminAccount | null> {
  const admin = createAdminClient()
  const normalized = identifier.trim()
  let query = admin
    .from('kade_users')
    .select('id, username, email, password_hash, role')

  query = normalized.includes('@')
    ? query.ilike('email', normalized)
    : query.eq('username', normalized)

  const { data, error } = await query.limit(1).maybeSingle()
  if (error) throw error
  return data as AdminAccount | null
}

async function createSupabaseSession(account: AdminAccount) {
  const admin = createAdminClient()
  const email = adminAuthEmail(account)
  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email,
    options: {
      data: {
        display_name: account.username,
        kade_admin_username: account.username,
      },
    },
  })
  if (linkError || !linkData.user || !linkData.properties?.hashed_token) {
    throw linkError || new Error('KadeAI oturumu üretilemedi.')
  }

  const authUser = linkData.user
  const { data: updated, error: updateError } = await admin.auth.admin.updateUserById(authUser.id, {
    app_metadata: {
      ...(authUser.app_metadata || {}),
      kade_admin_id: account.id,
      kade_admin_role: account.role,
      kade_admin_username: account.username,
    },
    user_metadata: {
      ...(authUser.user_metadata || {}),
      display_name: authUser.user_metadata?.display_name || account.username,
      kade_admin_username: account.username,
    },
  })
  if (updateError) throw updateError

  const supabase = await createClient()
  const { data: sessionData, error: verifyError } = await supabase.auth.verifyOtp({
    token_hash: linkData.properties.hashed_token,
    type: 'magiclink',
  })
  if (verifyError || !sessionData.session || !sessionData.user) {
    throw verifyError || new Error('KadeAI oturumu doğrulanamadı.')
  }

  return updated.user || sessionData.user
}

export async function signInWithAdminCredentials(identifier: string, password: string): Promise<AdminBridgeResult> {
  try {
    const account = await findAdminAccount(identifier)
    const hash = account?.password_hash || DUMMY_PASSWORD_HASH
    const passwordMatches = await bcrypt.compare(password, hash)

    if (!account || !passwordMatches) {
      return { ok: false, reason: 'invalid_credentials' }
    }
    if (account.role !== 'admin') {
      return { ok: false, reason: 'not_admin' }
    }

    const user = await createSupabaseSession(account)
    return { ok: true, user }
  } catch (error) {
    console.error('[kadeai/admin-bridge] giriş köprüsü kullanılamıyor:', {
      message: error instanceof Error ? error.message : 'unknown',
    })
    return { ok: false, reason: 'unavailable' }
  }
}
