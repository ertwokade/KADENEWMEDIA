import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    return NextResponse.json({ active: Boolean(user) }, {
      status: user ? 200 : 401,
      headers: { 'Cache-Control': 'no-store' },
    })
  } catch {
    return NextResponse.json({ active: false }, { status: 401, headers: { 'Cache-Control': 'no-store' } })
  }
}
