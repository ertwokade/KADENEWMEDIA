import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

async function session() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return null
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    const { data: preferences } = await supabase.from('user_preferences').select('active_workspace_id,active_brand_id').eq('user_id', user.id).maybeSingle()
    return { supabase, user, preferences }
  } catch {
    return null
  }
}

function normalizeEntry(body: Record<string, unknown>) {
  const title = typeof body.title === 'string' ? body.title.trim().slice(0, 300) : ''
  const platform = typeof body.platform === 'string' ? body.platform.trim().slice(0, 30) : ''
  const publishAt = typeof body.publish_at === 'string' && !Number.isNaN(Date.parse(body.publish_at)) ? new Date(body.publish_at).toISOString() : ''
  return { title, platform, publish_at: publishAt }
}

export async function GET() {
  const current = await session()
  if (!current) return NextResponse.json({ entries: [], cloud: false }, { status: 401 })
  const { data, error } = await current.supabase.from('content_calendar_items').select('*').eq('user_id', current.user.id).order('publish_at')
  if (error) return NextResponse.json({ error: 'Takvim verisi alınamadı.' }, { status: 500 })
  return NextResponse.json({ entries: data, cloud: true })
}

export async function POST(request: NextRequest) {
  const current = await session()
  if (!current) return NextResponse.json({ error: 'Oturum gerekli.' }, { status: 401 })
  const body = await request.json()
  const input: unknown[] = Array.isArray(body.entries) ? (body.entries as unknown[]).slice(0, 50) : [body]
  const entries = input.map((entry: unknown) => normalizeEntry(entry && typeof entry === 'object' ? entry as Record<string, unknown> : {}))
  if (!entries.length || entries.some((entry) => !entry.title || !entry.platform || !entry.publish_at)) {
    return NextResponse.json({ error: 'Her kayıt için başlık, platform ve geçerli tarih gerekli.' }, { status: 400 })
  }
  const rows = entries.map((entry) => ({
    ...entry,
    user_id: current.user.id,
    workspace_id: current.preferences?.active_workspace_id || null,
    brand_id: current.preferences?.active_brand_id || null,
    status: 'taslak',
  }))
  const { data, error } = await current.supabase.from('content_calendar_items').insert(rows).select()
  if (error) return NextResponse.json({ error: 'Takvim kaydı oluşturulamadı.' }, { status: 500 })
  return NextResponse.json(Array.isArray(body.entries) ? { entries: data } : { entry: data?.[0] }, { status: 201 })
}

export async function PUT(request: NextRequest) {
  const current = await session()
  if (!current) return NextResponse.json({ error: 'Oturum gerekli.' }, { status: 401 })
  const body = await request.json()
  if (typeof body.id !== 'string') return NextResponse.json({ error: 'Kayıt kimliği gerekli.' }, { status: 400 })
  const allowedStatus = ['taslak', 'hazır', 'yayında'].includes(body.status) ? body.status : 'taslak'
  const { data, error } = await current.supabase.from('content_calendar_items').update({ status: allowedStatus, updated_at: new Date().toISOString() }).eq('id', body.id).eq('user_id', current.user.id).select().single()
  if (error) return NextResponse.json({ error: 'Takvim kaydı güncellenemedi.' }, { status: 500 })
  return NextResponse.json({ entry: data })
}

export async function DELETE(request: NextRequest) {
  const current = await session()
  if (!current) return NextResponse.json({ error: 'Oturum gerekli.' }, { status: 401 })
  const { id } = await request.json()
  if (typeof id !== 'string') return NextResponse.json({ error: 'Kayıt kimliği gerekli.' }, { status: 400 })
  const { error } = await current.supabase.from('content_calendar_items').delete().eq('id', id).eq('user_id', current.user.id)
  if (error) return NextResponse.json({ error: 'Takvim kaydı silinemedi.' }, { status: 500 })
  return NextResponse.json({ success: true })
}
