import { NextRequest, NextResponse } from 'next/server'
import { queryTrends } from '@/lib/kade-search/store'
import { failure, isKadeSearchConfigured, requireReaderAccess } from '../_guard'
import type { TrendFilters } from '@/lib/kade-search/types'

export const dynamic = 'force-dynamic'

function filtersFromSearchParams(params: URLSearchParams): TrendFilters {
  const num = (key: string) => (params.get(key) ? Number(params.get(key)) : undefined)
  return {
    platform: params.get('platform') ?? undefined,
    kind: params.get('kind') ?? undefined,
    category: params.get('category') ?? undefined,
    country: params.get('country') ?? undefined,
    stage: params.get('stage') ?? undefined,
    format: params.get('format') ?? undefined,
    q: params.get('q') ?? undefined,
    sort: (params.get('sort') as TrendFilters['sort']) ?? 'score',
    limit: num('limit') ?? 50,
    offset: num('offset') ?? 0,
    minScore: num('minScore'),
    sinceHours: num('since'),
  }
}

export async function GET(req: NextRequest) {
  const guard = await requireReaderAccess()
  if (guard) return guard
  if (!isKadeSearchConfigured()) {
    const filters = filtersFromSearchParams(req.nextUrl.searchParams)
    return NextResponse.json({ adet: 0, filtreler: filters, trendler: [], localFallback: true })
  }
  try {
    const filters = filtersFromSearchParams(req.nextUrl.searchParams)
    const trends = await queryTrends(filters)
    return NextResponse.json({ adet: trends.length, filtreler: filters, trendler: trends })
  } catch (e) {
    return failure(e, 'Trendler getirilemedi.')
  }
}
