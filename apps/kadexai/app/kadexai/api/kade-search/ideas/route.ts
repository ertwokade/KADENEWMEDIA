import { NextRequest, NextResponse } from 'next/server'
import { generateIdeas } from '@/lib/kade-search/ideas'
import { failure, isKadeSearchConfigured, requireReaderAccess } from '../_guard'

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
      limit: Math.min(Number(p.get('limit') ?? 10), 40),
      category: p.get('category') ?? undefined,
      platform: p.get('platform') ?? undefined,
      country: p.get('country') ?? 'TR',
      language: p.get('language') ?? undefined,
      stage: p.get('stage') ?? undefined,
      format: p.get('format') ?? undefined,
      minScore: p.get('minScore') ? Number(p.get('minScore')) : undefined,
    }, req)
    return NextResponse.json({ adet: ideas.length, fikirler: ideas })
  } catch (e) {
    return failure(e, 'İçerik fikirleri üretilemedi.')
  }
}
