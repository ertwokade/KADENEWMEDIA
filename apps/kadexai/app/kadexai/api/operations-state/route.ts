import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

    const { data, error } = await supabase
      .from('operations_state')
      .select('state, updated_at')
      .eq('user_id', user.id)
      .maybeSingle()

    if (error) throw error
    return NextResponse.json({ state: data?.state ?? null, updatedAt: data?.updated_at ?? null })
  } catch {
    return NextResponse.json({ error: 'Operasyon verisi alınamadı.' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

    const body = await request.json()
    const state = body?.state
    if (!state || typeof state !== 'object' || Array.isArray(state)) {
      return NextResponse.json({ error: 'Geçersiz operasyon verisi.' }, { status: 400 })
    }
    if (JSON.stringify(state).length > 2_000_000) {
      return NextResponse.json({ error: 'Operasyon verisi 2 MB sınırını aşıyor.' }, { status: 413 })
    }

    const { error } = await supabase
      .from('operations_state')
      .upsert({ user_id: user.id, state, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Operasyon verisi kaydedilemedi.' }, { status: 500 })
  }
}
