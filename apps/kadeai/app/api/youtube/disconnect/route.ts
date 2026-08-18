import { NextResponse } from 'next/server'
import { getAuthenticatedUser, requireApiUser } from '@/lib/auth/server'
import { disconnect } from '@/lib/youtube/oauth'

export const dynamic = 'force-dynamic'

export async function POST() {
  const guard = await requireApiUser()
  if (guard) return guard
  const user = await getAuthenticatedUser()
  if (!user) return NextResponse.json({ error: 'Oturum gerekli.' }, { status: 401 })
  await disconnect(user.id)
  return NextResponse.json({ connected: false })
}
