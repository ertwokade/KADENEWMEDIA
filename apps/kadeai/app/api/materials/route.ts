import { NextRequest, NextResponse } from 'next/server'
import { materialStats, queryMaterials } from '@/lib/materials/store'
import { failure, requireReaderAccess } from '../kade-search/_guard'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const guard = await requireReaderAccess()
  if (guard) return guard
  try {
    const params = req.nextUrl.searchParams
    const filters = {
      q: params.get('q') ?? undefined,
      kind: params.get('kind') ?? undefined,
      source: params.get('source') ?? undefined,
      sort: (params.get('sort') as 'yeni' | 'izlenme' | 'sure') ?? 'yeni',
      limit: Math.min(Number(params.get('limit') ?? 60) || 60, 120),
      offset: Number(params.get('offset') ?? 0) || 0,
    }
    const [materyaller, istatistik] = await Promise.all([queryMaterials(filters), materialStats()])
    return NextResponse.json({ adet: materyaller.length, filtreler: filters, istatistik, materyaller })
  } catch (e) {
    return failure(e, 'Materyaller getirilemedi.')
  }
}
