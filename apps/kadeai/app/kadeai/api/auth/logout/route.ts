import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    const supabase = await createClient()
    await supabase.auth.signOut({ scope: 'local' })
  } catch {
    // Logout remains idempotent; expired or unavailable sessions are treated as signed out.
  }
  return NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } })
}
