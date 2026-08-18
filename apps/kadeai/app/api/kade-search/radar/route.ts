import { NextRequest, NextResponse } from 'next/server'
import { queryTrends } from '@/lib/kade-search/store'
import { failure, requireReaderAccess } from '../_guard'

export const dynamic = 'force-dynamic'

/**
 * Erken radar: dusuk hacim + yuksek hiz.
 * Genis bir hiz siralamasi cekilip yalnizca erken asamalar (emerging/rising)
 * birakilir — "girmek icin en iyi an" listesi.
 */
export async function GET(req: NextRequest) {
  const guard = await requireReaderAccess()
  if (guard) return guard
  try {
    const params = req.nextUrl.searchParams
    const limit = Math.min(Number(params.get('limit') ?? 25), 100)
    const since = Number(params.get('since') ?? 96)

    const rows = await queryTrends({ limit: 120, sort: 'velocity', sinceHours: since })
    const trendler = rows.filter((t) => t.stage === 'emerging' || t.stage === 'rising').slice(0, limit)

    return NextResponse.json({ adet: trendler.length, trendler })
  } catch (e) {
    return failure(e, 'Radar verisi getirilemedi.')
  }
}
