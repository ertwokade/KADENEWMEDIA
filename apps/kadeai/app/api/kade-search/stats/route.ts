import { NextResponse } from 'next/server'
import { statsSummary } from '@/lib/kade-search/store'
import { availableSources } from '@/lib/kade-search/collectors'
import { failure, requireReaderAccess } from '../_guard'

export const dynamic = 'force-dynamic'

export async function GET() {
  const guard = await requireReaderAccess()
  if (guard) return guard
  try {
    const stats = await statsSummary()
    return NextResponse.json({ ...stats, kaynaklar: availableSources() })
  } catch (e) {
    return failure(e, 'Durum bilgisi getirilemedi.')
  }
}
