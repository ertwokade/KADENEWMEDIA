import { NextRequest, NextResponse } from 'next/server'
import { assertAuthenticatedUser } from '@/lib/auth/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const user = await assertAuthenticatedUser()
  if (!user) return NextResponse.json({ error: 'Oturum gerekli.' }, { status: 401 })
  const orderId = request.nextUrl.searchParams.get('orderId') || ''
  if (!/^[0-9a-f-]{36}$/i.test(orderId)) return NextResponse.json({ error: 'Geçersiz sipariş.' }, { status: 400 })
  const supabase = await createClient()
  const { data, error } = await supabase.from('payment_orders')
    .select('id, product_id, amount_minor, currency, status, created_at, updated_at')
    .eq('id', orderId).eq('user_id', user.id).maybeSingle()
  if (error) return NextResponse.json({ error: 'Ödeme durumu okunamadı.' }, { status: 503 })
  if (!data) return NextResponse.json({ error: 'Sipariş bulunamadı.' }, { status: 404 })
  return NextResponse.json({ order: data }, { headers: { 'Cache-Control': 'no-store' } })
}
