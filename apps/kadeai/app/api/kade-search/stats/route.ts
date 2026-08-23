import { NextResponse } from 'next/server'
import { statsSummary } from '@/lib/kade-search/store'
import { availableSources } from '@/lib/kade-search/collectors'
import { failure, isKadeSearchConfigured, requireReaderAccess } from '../_guard'

export const dynamic = 'force-dynamic'

export async function GET() {
  const guard = await requireReaderAccess()
  if (guard) return guard
  if (!isKadeSearchConfigured()) {
    return NextResponse.json({
      trends: 0,
      snapshots: 0,
      links: 0,
      alerts: 0,
      lastRun: null,
      byPlatform: [],
      byKind: [],
      byCategory: [],
      byCountry: [],
      byStage: [],
      kaynaklar: availableSources(),
      localFallback: true,
    })
  }
  try {
    const stats = await statsSummary()
    return NextResponse.json({ ...stats, kaynaklar: availableSources() })
  } catch (e) {
    return failure(e, 'Durum bilgisi getirilemedi.')
  }
}
