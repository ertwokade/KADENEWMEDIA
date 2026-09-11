import { NextRequest, NextResponse } from 'next/server'
import { generateIdeas } from '@/lib/kade-search/ideas'
import { failure, isKadeSearchConfigured, requireReaderAccess } from '../_guard'
import { boundedNumber, trendFiltersFromParams } from '@/lib/kade-search/filters'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const guard = await requireReaderAccess()
  if (guard) return guard
  if (!isKadeSearchConfigured()) {
    return NextResponse.json({ adet: 0, fikirler: [], localFallback: true })
  }
  try {
    const p = req.nextUrl.searchParams
    const ideas = await generateIdeas({
      ...trendFiltersFromParams(p, 'TR'),
      limit: boundedNumber(p.get('limit'), 10, 1, 40),
    }, req)
    return NextResponse.json({ adet: ideas.length, fikirler: ideas })
  } catch (e) {
    return failure(e, 'İçerik fikirleri üretilemedi.')
  }
}
