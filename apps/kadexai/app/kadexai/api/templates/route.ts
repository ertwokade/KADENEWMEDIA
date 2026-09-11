import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

async function readBody(request: NextRequest): Promise<Record<string, unknown> | null> {
  const body = await request.json().catch(() => null)
  return body && typeof body === 'object' && !Array.isArray(body) ? body : null
}

function boundedText(value: unknown, max: number) {
  return typeof value === 'string' && value.trim().length <= max ? value.trim() : ''
}

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

export async function GET() {
  const current = await session()
  if (!current) return NextResponse.json({ templates: [], cloud: false }, { status: 401 })
  const { data, error } = await current.supabase.from('content_templates').select('*').eq('user_id', current.user.id).order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: 'Şablonlar alınamadı.' }, { status: 500 })
  return NextResponse.json({ templates: data, cloud: true })
}

export async function POST(request: NextRequest) {
  const current = await session()
  if (!current) return NextResponse.json({ error: 'Oturum gerekli.' }, { status: 401 })
  const body = await readBody(request)
  const title = boundedText(body?.title, 200)
  const content = boundedText(body?.content, 20_000)
  const category = boundedText(body?.category ?? 'Diğer', 40)
  if (!title || !content || !category) return NextResponse.json({ error: 'Geçerli başlık, içerik ve kategori gerekli; alan sınırlarını aşma.' }, { status: 400 })
  const { data, error } = await current.supabase.from('content_templates').insert({
    user_id: current.user.id,
    workspace_id: current.preferences?.active_workspace_id || null,
    brand_id: current.preferences?.active_brand_id || null,
    title,
    content,
    category,
  }).select().single()
  if (error) return NextResponse.json({ error: 'Şablon oluşturulamadı.' }, { status: 500 })
  return NextResponse.json({ template: data }, { status: 201 })
}

export async function PUT(request: NextRequest) {
  const current = await session()
  if (!current) return NextResponse.json({ error: 'Oturum gerekli.' }, { status: 401 })
  const body = await readBody(request)
  const title = boundedText(body?.title, 200)
  const content = boundedText(body?.content, 20_000)
  const category = boundedText(body?.category ?? 'Diğer', 40)
  if (!body || typeof body.id !== 'string' || !body.id.trim() || !title || !content || !category) return NextResponse.json({ error: 'Geçerli şablon verisi gerekli.' }, { status: 400 })
  const { data, error } = await current.supabase.from('content_templates').update({ title, content, category, updated_at: new Date().toISOString() }).eq('id', body.id).eq('user_id', current.user.id).select().maybeSingle()
  if (error) return NextResponse.json({ error: 'Şablon güncellenemedi.' }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'Şablon bulunamadı.' }, { status: 404 })
  return NextResponse.json({ template: data })
}

export async function DELETE(request: NextRequest) {
  const current = await session()
  if (!current) return NextResponse.json({ error: 'Oturum gerekli.' }, { status: 401 })
  const body = await readBody(request)
  if (!body || typeof body.id !== 'string' || !body.id.trim()) return NextResponse.json({ error: 'Kayıt kimliği gerekli.' }, { status: 400 })
  const { data, error } = await current.supabase.from('content_templates').delete().eq('id', body.id).eq('user_id', current.user.id).select('id')
  if (error) return NextResponse.json({ error: 'Şablon silinemedi.' }, { status: 500 })
  if (!data?.length) return NextResponse.json({ error: 'Şablon bulunamadı.' }, { status: 404 })
  return NextResponse.json({ success: true })
}
