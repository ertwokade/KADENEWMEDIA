import { NextRequest, NextResponse } from 'next/server'
import { assertAuthenticatedUser } from '@/lib/auth/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getPaymentProduct } from '@/lib/payments/catalog'
import { buildShopierForm, minorToDecimalString } from '@/lib/payments/shopier'
import { getRateLimitKey, rateLimit, rateLimitHeaders } from '@/lib/rateLimit'
import { captureApiError } from '@/lib/observability/server'
import { escapeHtml } from '@/lib/security/escape'

export const dynamic = 'force-dynamic'

/**
 * Kullanıcıyı Shopier'e yönlendirir: imzalı formu üretip otomatik POST eder.
 * 15 dk geçerli kişiye özel teklifler burada süre kontrolünden geçer —
 * süresi dolan sipariş için ödeme sayfası AÇILMAZ.
 */
export async function GET(request: NextRequest) {
  const limit = rateLimit(getRateLimitKey(request, 'shopier-redirect'), 10, 60_000)
  if (!limit.allowed) {
    return NextResponse.json({ error: 'Çok fazla istek.' }, { status: 429, headers: rateLimitHeaders(limit) })
  }

  const user = await assertAuthenticatedUser()
  if (!user) return NextResponse.json({ error: 'Oturum gerekli.' }, { status: 401 })

  const orderId = request.nextUrl.searchParams.get('order') || ''
  if (!/^[0-9a-f-]{36}$/i.test(orderId)) {
    return NextResponse.json({ error: 'Geçersiz sipariş.' }, { status: 400 })
  }

  try {
    const admin = createAdminClient()
    const { data: order } = await admin
      .from('payment_orders')
      .select('id, user_id, product_id, amount_minor, currency, status, expires_at')
      .eq('id', orderId)
      .eq('provider', 'shopier')
      .maybeSingle()

    if (!order || order.user_id !== user.id) {
      return NextResponse.json({ error: 'Sipariş bulunamadı.' }, { status: 404 })
    }
    if (order.status !== 'pending') {
      return htmlMessage('Bu sipariş zaten sonuçlanmış.', 409)
    }
    // 15 dk kuralı: süresi dolmuş kişiye özel teklif ödenemez.
    if (order.expires_at && new Date(order.expires_at).getTime() < Date.now()) {
      await admin.from('payment_orders')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('id', order.id)
      return htmlMessage('Bu teklifin süresi (15 dk) doldu. Lütfen yeni bir teklif oluşturun.', 410)
    }

    const product = getPaymentProduct(order.product_id)
    const productName = product?.name ?? 'KadeAI Paketi'

    const { fields, actionUrl } = buildShopierForm(
      {
        orderId: order.id,
        totalOrderValue: minorToDecimalString(order.amount_minor),
        productName,
        buyer: { name: user.email?.split('@')[0] || 'Musteri', email: user.email || '' },
      },
      { apiKey: process.env.SHOPIER_API_KEY || '', apiSecret: process.env.SHOPIER_API_SECRET || '' },
    )

    const inputs = Object.entries(fields)
      .map(([k, v]) => `<input type="hidden" name="${escapeHtml(k)}" value="${escapeHtml(v)}">`)
      .join('')

    const body = `<!doctype html><html lang="tr"><head><meta charset="utf-8">
<title>Ödemeye yönlendiriliyorsunuz…</title></head>
<body style="font-family:sans-serif;background:#09090b;color:#e4e4e7;display:flex;align-items:center;justify-content:center;height:100vh">
<div style="text-align:center">
<p>Güvenli ödeme sayfasına yönlendiriliyorsunuz…</p>
<form id="shopier" method="post" action="${escapeHtml(actionUrl)}">${inputs}</form>
</div>
<script>document.getElementById('shopier').submit();</script>
</body></html>`

    return new NextResponse(body, {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
    })
  } catch (error) {
    captureApiError(error, '/api/payments/shopier/redirect')
    return NextResponse.json({ error: 'Ödeme başlatılamadı.' }, { status: 500 })
  }
}

function htmlMessage(message: string, status: number) {
  const body = `<!doctype html><html lang="tr"><head><meta charset="utf-8"><title>KadeAI</title></head>
<body style="font-family:sans-serif;background:#09090b;color:#e4e4e7;display:flex;align-items:center;justify-content:center;height:100vh">
<p style="max-width:32rem;text-align:center">${message}</p></body></html>`
  return new NextResponse(body, {
    status,
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
  })
}
