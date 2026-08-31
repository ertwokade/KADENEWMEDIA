import { NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth/server'
import { getConnection, youtubeOAuthStatus } from '@/lib/youtube/oauth'

export const dynamic = 'force-dynamic'

export async function GET() {
  const config = youtubeOAuthStatus()
  const user = await getAuthenticatedUser()
  if (!user) {
    return NextResponse.json({ ...config, connected: false, channel: null })
  }

  try {
    const connection = await getConnection(user.id)
    return NextResponse.json({ ...config, connected: connection.connected, channel: connection.channel })
  } catch {
    return NextResponse.json({ ...config, connected: false, channel: null })
  }
}
