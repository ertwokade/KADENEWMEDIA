import { NextRequest, NextResponse } from 'next/server'
import { queryTrends } from '@/lib/kade-search/store'
import { failure, isKadeSearchConfigured, requireReaderAccess } from '../_guard'
import { ayiklanmisTrendler, turkceGorunuyor } from '@/lib/kade-search/relevance'
import { boundedNumber, trendFiltersFromParams } from '@/lib/kade-search/filters'
import { hasMeasuredVelocity } from '@/lib/kade-search/export'

export const dynamic = 'force-dynamic'

/**
 * Erken radar: dusuk hacim + yuksek hiz.
 * Genis bir hiz siralamasi cekilip yalnizca erken asamalar (emerging/rising)
 * birakilir — "girmek icin en iyi an" listesi.
 */
export async function GET(req: NextRequest) {
  const guard = await requireReaderAccess()
  if (guard) return guard
  if (!isKadeSearchConfigured()) {
    return NextResponse.json({ adet: 0, trendler: [], localFallback: true })
  }
  try {
    const params = req.nextUrl.searchParams
    const limit = boundedNumber(params.get('limit'), 25, 1, 100)
    const filters = trendFiltersFromParams(params, 'TR')
    const language = filters.language
    const rows = ayiklanmisTrendler(await queryTrends({
      ...filters,
      limit: 120,
      sort: 'velocity',
      sinceHours: filters.sinceHours ?? 96,
    }))
    const trendler = rows
      .filter((trend) => language !== 'tr' || turkceGorunuyor(trend))
      .filter((trend) => hasMeasuredVelocity(trend) && trend.velocity! > 0)
      .filter((trend) => trend.stage === 'emerging' || trend.stage === 'rising')
      .slice(0, limit)

    return NextResponse.json({ adet: trendler.length, trendler })
  } catch (e) {
    return failure(e, 'Radar verisi getirilemedi.')
  }
}
