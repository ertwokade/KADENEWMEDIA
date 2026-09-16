import { NextRequest, NextResponse } from 'next/server'
import { queryTrends } from '@/lib/kade-search/store'
import { failure, isKadeSearchConfigured, requireReaderAccess } from '../_guard'
import { trendFiltersFromParams } from '@/lib/kade-search/filters'
import { ayiklanmisTrendler } from '@/lib/kade-search/relevance'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const guard = await requireReaderAccess()
  if (guard) return guard
  if (!isKadeSearchConfigured()) {
    const filters = trendFiltersFromParams(req.nextUrl.searchParams)
    return NextResponse.json({ adet: 0, filtreler: filters, trendler: [], localFallback: true })
  }
  try {
    const filters = trendFiltersFromParams(req.nextUrl.searchParams)
    const relevant = ayiklanmisTrendler(await queryTrends(filters))
    return NextResponse.json({ adet: relevant.length, filtreler: filters, trendler: relevant })
  } catch (e) {
    return failure(e, 'Trendler getirilemedi.')
  }
}
