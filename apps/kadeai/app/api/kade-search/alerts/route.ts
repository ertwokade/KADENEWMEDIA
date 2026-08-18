import { NextRequest, NextResponse } from 'next/server'
import { recentAlerts } from '@/lib/kade-search/store'
import { failure, requireReaderAccess } from '../_guard'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const guard = await requireReaderAccess()
  if (guard) return guard
  try {
    const limit = Math.min(Number(req.nextUrl.searchParams.get('limit') ?? 50), 200)
    return NextResponse.json({ uyarilar: await recentAlerts(limit) })
  } catch (e) {
    return failure(e, 'Uyarılar getirilemedi.')
  }
}
