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
  const title = typeof body.title === 'string' && body.title.trim().length <= 300 ? body.title.trim() : ''
  const platform = typeof body.platform === 'string' && ['youtube', 'instagram', 'tiktok', 'x', 'linkedin', 'pinterest'].includes(body.platform) ? body.platform : ''
  const rawDate = typeof body.publish_at === 'string' ? body.publish_at : ''
  const validDate = /^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})?$/.test(rawDate)
    && Number.isFinite(Date.parse(rawDate))
    && new Date(`${rawDate.slice(0, 10)}T00:00:00Z`).toISOString().slice(0, 10) === rawDate.slice(0, 10)
  const publishAt = validDate ? new Date(rawDate).toISOString() : ''
  return { title, platform, publish_at: publishAt }
}

async function readBody(request: NextRequest): Promise<Record<string, unknown> | null> {
  const body = await request.json().catch(() => null)
  return body && typeof body === 'object' && !Array.isArray(body) ? body : null
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
  const body = await readBody(request)
  if (!body || ('entries' in body && (!Array.isArray(body.entries) || body.entries.length > 50))) {
    return NextResponse.json({ error: 'Bir istekte en fazla 50 geçerli takvim kaydı gönderilebilir.' }, { status: 400 })
  }
  const input: unknown[] = Array.isArray(body.entries) ? body.entries : [body]
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
  const body = await readBody(request)
  if (!body || typeof body.id !== 'string' || !body.id.trim()) return NextResponse.json({ error: 'Geçerli kayıt kimliği ve durum gerekli.' }, { status: 400 })
  const changes: Record<string, string> = {}
  if ('status' in body) {
    if (typeof body.status !== 'string' || !['taslak', 'hazır', 'yayında'].includes(body.status)) return NextResponse.json({ error: 'Geçerli kayıt kimliği ve durum gerekli.' }, { status: 400 })
    changes.status = body.status
  }
  // Başlık, platform ve tarih birlikte gönderilir; biri geçersizse hiçbir alan yazılmaz.
  if ('title' in body || 'platform' in body || 'publish_at' in body) {
    const entry = normalizeEntry(body)
    if (!entry.title || !entry.platform || !entry.publish_at) return NextResponse.json({ error: 'Başlık, platform ve geçerli tarih gerekli.' }, { status: 400 })
    Object.assign(changes, entry)
  }
  if (!Object.keys(changes).length) return NextResponse.json({ error: 'Geçerli kayıt kimliği ve durum gerekli.' }, { status: 400 })
  const { data, error } = await current.supabase.from('content_calendar_items').update({ ...changes, updated_at: new Date().toISOString() }).eq('id', body.id).eq('user_id', current.user.id).select().maybeSingle()
  if (error) return NextResponse.json({ error: 'Takvim kaydı güncellenemedi.' }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'Takvim kaydı bulunamadı.' }, { status: 404 })
  return NextResponse.json({ entry: data })
}

export async function DELETE(request: NextRequest) {
  const current = await session()
  if (!current) return NextResponse.json({ error: 'Oturum gerekli.' }, { status: 401 })
  const body = await readBody(request)
  if (!body || typeof body.id !== 'string' || !body.id.trim()) return NextResponse.json({ error: 'Kayıt kimliği gerekli.' }, { status: 400 })
  const { data, error } = await current.supabase.from('content_calendar_items').delete().eq('id', body.id).eq('user_id', current.user.id).select('id')
  if (error) return NextResponse.json({ error: 'Takvim kaydı silinemedi.' }, { status: 500 })
  if (!data?.length) return NextResponse.json({ error: 'Takvim kaydı bulunamadı.' }, { status: 404 })
  return NextResponse.json({ success: true })
}
