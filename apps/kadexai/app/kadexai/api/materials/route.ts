import { NextRequest, NextResponse } from 'next/server'
import { materialStats, queryMaterials } from '@/lib/materials/store'
import { boundedNumber } from '@/lib/kade-search/filters'
import { getAuthenticatedUser } from '@/lib/auth/server'
import { isSettingsOwnerUser } from '@/lib/featureAccess'
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
      limit: boundedNumber(params.get('limit'), 60, 1, 120),
      offset: boundedNumber(params.get('offset'), 0, 0, 100_000),
    }
    const [materyaller, istatistik] = await Promise.all([queryMaterials(filters), materialStats()])
    const canCollect = isSettingsOwnerUser(await getAuthenticatedUser())
    return NextResponse.json({ adet: materyaller.length, filtreler: filters, istatistik, materyaller, canCollect })
  } catch (e) {
    return failure(e, 'Materyaller getirilemedi.')
  }
}
