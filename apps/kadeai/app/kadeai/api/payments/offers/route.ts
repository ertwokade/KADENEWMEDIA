import { NextResponse } from 'next/server'
import { assertAuthenticatedUser } from '@/lib/auth/server'
import { createClient } from '@/lib/supabase/server'
import { getPaymentProduct } from '@/lib/payments/catalog'

export const dynamic = 'force-dynamic'

export async function GET() {
  const user = await assertAuthenticatedUser()
  if (!user) return NextResponse.json({ error: 'Oturum gerekli.' }, { status: 401 })
  const supabase = await createClient()
  const { data, error } = await supabase.from('payment_orders')
    .select('id, product_id, amount_minor, currency, status, checkout_url, expires_at, created_at')
    .eq('user_id', user.id)
    .like('idempotency_key', 'custom-offer-%')
    .eq('status', 'pending')
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(5)
  if (error) return NextResponse.json({ error: 'Özel teklifler okunamadı.' }, { status: 503 })
  const offers = (data || []).map((offer) => ({
    ...offer,
    productName: getPaymentProduct(offer.product_id)?.name || 'KadeAI Özel Paket',
  }))
  return NextResponse.json({ offers }, { headers: { 'Cache-Control': 'private, no-store' } })
}
