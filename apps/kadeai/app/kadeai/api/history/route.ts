import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const TOOL_PATTERN = /^[a-z0-9-]{1,64}$/

function cleanObject(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return value as Record<string, unknown>
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ history: [], cloud: false }, { status: 401 })

    const params = request.nextUrl.searchParams
    const tool = params.get('tool')
    const status = params.get('status')
    const from = params.get('from')
    const to = params.get('to')
    const limit = Math.min(Math.max(Number(params.get('limit')) || 100, 1), 200)

    let query = supabase.from('tool_runs').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(limit)
    if (tool && TOOL_PATTERN.test(tool)) query = query.eq('tool', tool)
    if (status === 'completed' || status === 'failed') query = query.eq('status', status)
    if (from && !Number.isNaN(Date.parse(from))) query = query.gte('created_at', new Date(from).toISOString())
    if (to && !Number.isNaN(Date.parse(to))) query = query.lte('created_at', new Date(to).toISOString())

    const { data, error } = await query
    if (!error) return NextResponse.json({ history: data ?? [], cloud: true })

    // Eski kurulumlar migration uygulanana kadar mevcut geçmiş tablosunu okuyabilir.
    const { data: legacy, error: legacyError } = await supabase
      .from('content_history')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit)
    if (legacyError) throw error
    return NextResponse.json({
      history: (legacy ?? []).map((entry) => ({ ...entry, status: 'completed', completed_at: entry.created_at })),
      cloud: true,
      legacy: true,
    })
  } catch {
    return NextResponse.json({ history: [], cloud: false, warning: 'Geçmiş yüklenemedi.' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const size = Number(request.headers.get('content-length') || 0)
    if (size > 300_000) return NextResponse.json({ error: 'Çalıştırma kaydı çok büyük.' }, { status: 413 })
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

    const body = await request.json()
    const tool = typeof body.tool === 'string' ? body.tool.slice(0, 64) : ''
    if (!TOOL_PATTERN.test(tool)) return NextResponse.json({ error: 'Geçersiz araç kimliği.' }, { status: 400 })
    const status = body.status === 'failed' ? 'failed' : 'completed'
    const snapshot = cleanObject(body.profile_snapshot)
    const workspace = cleanObject(snapshot.workspace)
    const brand = cleanObject(snapshot.brand)
    const input = cleanObject(body.input_data)
    const model = typeof body.model === 'string' ? body.model.slice(0, 80) : 'auto'
    const output = typeof body.output === 'string' ? body.output.slice(0, 200_000) : ''
    const errorMessage = typeof body.error_message === 'string' ? body.error_message.slice(0, 2000) : null

    const payload = {
      user_id: user.id,
      workspace_id: typeof workspace.id === 'string' ? workspace.id : null,
      brand_id: typeof brand.id === 'string' ? brand.id : null,
      tool,
      model,
      provider: typeof body.provider === 'string' ? body.provider.slice(0, 80) : model.split('-')[0],
      input_data: input,
      profile_snapshot: snapshot,
      output,
      status,
      error_message: errorMessage,
      tokens_used: Number.isFinite(body.tokens_used) ? Math.max(0, Math.floor(body.tokens_used)) : null,
      completed_at: new Date().toISOString(),
    }

    const { data, error } = await supabase.from('tool_runs').insert(payload).select().single()
    if (!error) return NextResponse.json({ entry: data }, { status: 201 })

    // Tamamlanmış kayıtlar eski şemaya da yazılabilir; hatalı denemeler yerelde korunur.
    if (status === 'completed' && output) {
      const { data: legacy, error: legacyError } = await supabase
        .from('content_history')
        .insert({ user_id: user.id, tool, model, input_data: input, output })
        .select()
        .single()
      if (!legacyError) return NextResponse.json({ entry: { ...legacy, status }, legacy: true }, { status: 201 })
    }
    throw error
  } catch {
    return NextResponse.json({ error: 'Geçmiş kaydedilemedi.' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
    const { id } = await request.json()
    if (typeof id !== 'string' || id.length > 80) return NextResponse.json({ error: 'Geçersiz kayıt.' }, { status: 400 })

    const { error } = await supabase.from('tool_runs').delete().eq('id', id).eq('user_id', user.id)
    if (error) {
      const { error: legacyError } = await supabase.from('content_history').delete().eq('id', id).eq('user_id', user.id)
      if (legacyError) throw error
    }
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Kayıt silinemedi.' }, { status: 500 })
  }
}
