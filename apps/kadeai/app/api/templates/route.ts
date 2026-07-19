import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

async function session() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: preferences } = await supabase.from('user_preferences').select('active_workspace_id,active_brand_id').eq('user_id', user.id).maybeSingle()
  return { supabase, user, preferences }
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
  const body = await request.json()
  const title = typeof body.title === 'string' ? body.title.trim().slice(0, 200) : ''
  const content = typeof body.content === 'string' ? body.content.trim().slice(0, 20_000) : ''
  const category = typeof body.category === 'string' ? body.category.trim().slice(0, 40) : 'Diğer'
  if (!title || !content) return NextResponse.json({ error: 'Başlık ve içerik gerekli.' }, { status: 400 })
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
  const body = await request.json()
  const title = typeof body.title === 'string' ? body.title.trim().slice(0, 200) : ''
  const content = typeof body.content === 'string' ? body.content.trim().slice(0, 20_000) : ''
  const category = typeof body.category === 'string' ? body.category.trim().slice(0, 40) : 'Diğer'
  if (typeof body.id !== 'string' || !title || !content) return NextResponse.json({ error: 'Geçerli şablon verisi gerekli.' }, { status: 400 })
  const { data, error } = await current.supabase.from('content_templates').update({ title, content, category, updated_at: new Date().toISOString() }).eq('id', body.id).eq('user_id', current.user.id).select().single()
  if (error) return NextResponse.json({ error: 'Şablon güncellenemedi.' }, { status: 500 })
  return NextResponse.json({ template: data })
}

export async function DELETE(request: NextRequest) {
  const current = await session()
  if (!current) return NextResponse.json({ error: 'Oturum gerekli.' }, { status: 401 })
  const { id } = await request.json()
  if (typeof id !== 'string') return NextResponse.json({ error: 'Kayıt kimliği gerekli.' }, { status: 400 })
  const { error } = await current.supabase.from('content_templates').delete().eq('id', id).eq('user_id', current.user.id)
  if (error) return NextResponse.json({ error: 'Şablon silinemedi.' }, { status: 500 })
  return NextResponse.json({ success: true })
}
