import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth/server'
import { buildApprovalDraft, formatApprovalWhatsApp, normalizeApprovalStatus, sanitizeApprovalIdea } from '@/lib/kade-search/approvals'
import { approvalGet, approvalList, approvalUpsert } from '@/lib/kade-search/store'
import { sendWhatsAppMessage, whatsappConfiguration } from '@/lib/notifications/whatsapp'
import { failure, requireReaderAccess } from '../_guard'

export const dynamic = 'force-dynamic'

async function userId() {
  return (await getAuthenticatedUser())?.id ?? null
}

export async function GET() {
  const guard = await requireReaderAccess()
  if (guard) return guard
  try {
    const id = await userId()
    if (!id) return NextResponse.json({ approvals: [] })
    return NextResponse.json({ approvals: await approvalList(id) })
  } catch (error) {
    return failure(error, 'İçerik onayları getirilemedi.')
  }
}

export async function POST(req: NextRequest) {
  const guard = await requireReaderAccess()
  if (guard) return guard
  try {
    const id = await userId()
    if (!id) return NextResponse.json({ error: 'Oturum gerekli.' }, { status: 401 })
    const body = await req.json() as Record<string, unknown>
    const trendId = String(body.trendId ?? '').trim().slice(0, 220)
    if (!trendId) return NextResponse.json({ error: 'Trend kimliği gerekli.' }, { status: 400 })

    if (body.action === 'notify') {
      const row = await approvalGet(id, trendId)
      if (!row || !['approved', 'published'].includes(row.status)) {
        return NextResponse.json({ error: 'Önce içeriği onaylamalısın.' }, { status: 400 })
      }
      const config = whatsappConfiguration()
      if (!config.configured) {
        return NextResponse.json({ error: 'WhatsApp yapılandırılmamış.', missing: config.missing }, { status: 503 })
      }
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || 'https://kadenewmedia.com'
      const delivery = await sendWhatsAppMessage(formatApprovalWhatsApp(
        row.idea,
        row.draft,
        `${siteUrl}/kadexai/dashboard/kade-search?trend=${encodeURIComponent(trendId)}`,
      ))
      return NextResponse.json({ sent: true, provider: delivery.provider })
    }

    const idea = sanitizeApprovalIdea(body.idea)
    if (!idea.trendId || idea.trendId !== trendId || !idea.baslik) {
      return NextResponse.json({ error: 'Geçerli içerik fikri gerekli.' }, { status: 400 })
    }
    const status = normalizeApprovalStatus(body.status)
    const draft = buildApprovalDraft(idea)
    const approval = await approvalUpsert({
      userId: id,
      trendId,
      status,
      idea,
      draft,
      notes: String(body.notes ?? '').slice(0, 1000),
    })
    return NextResponse.json({ approval })
  } catch (error) {
    return failure(error, 'İçerik onayı kaydedilemedi.')
  }
}
