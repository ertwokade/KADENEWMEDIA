import { NextRequest, NextResponse } from 'next/server'
import { queryTrends } from '@/lib/kade-search/store'
import { failure, isKadeSearchConfigured, requireReaderAccess } from '../_guard'
import { ayiklanmisTrendler, turkceGorunuyor } from '@/lib/kade-search/relevance'

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
    const limit = Math.min(Number(params.get('limit') ?? 25), 100)
    const since = Number(params.get('since') ?? 96)

    const language = params.get('language') ?? undefined
    const rows = ayiklanmisTrendler(await queryTrends({
      limit: 120,
      sort: 'velocity',
      sinceHours: since,
      country: params.get('country') ?? 'TR',
      language,
    }))
    const trendler = rows
      .filter((trend) => language !== 'tr' || turkceGorunuyor(trend))
      .filter((trend) => trend.stage === 'emerging' || trend.stage === 'rising')
      .slice(0, limit)

    return NextResponse.json({ adet: trendler.length, trendler })
  } catch (e) {
    return failure(e, 'Radar verisi getirilemedi.')
  }
}
