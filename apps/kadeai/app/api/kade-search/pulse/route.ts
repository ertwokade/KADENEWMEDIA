import { NextRequest, NextResponse } from 'next/server'
import { categoryPulse } from '@/lib/kade-search/ideas'
import { failure, requireReaderAccess } from '../_guard'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const guard = await requireReaderAccess()
  if (guard) return guard
  try {
    const limit = Math.min(Number(req.nextUrl.searchParams.get('limit') ?? 3), 10)
    return NextResponse.json({ nabiz: await categoryPulse(limit) })
  } catch (e) {
    return failure(e, 'Kategori nabzı getirilemedi.')
  }
}
