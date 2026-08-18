import { NextResponse } from 'next/server'
import { getTrendDetail } from '@/lib/kade-search/store'
import { failure, requireReaderAccess } from '../../_guard'

export const dynamic = 'force-dynamic'

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireReaderAccess()
  if (guard) return guard
  try {
    const { id } = await ctx.params
    const trend = await getTrendDetail(id)
    if (!trend) return NextResponse.json({ error: 'Trend bulunamadı.' }, { status: 404 })
    return NextResponse.json({ trend })
  } catch (e) {
    return failure(e, 'Trend detayı getirilemedi.')
  }
}
