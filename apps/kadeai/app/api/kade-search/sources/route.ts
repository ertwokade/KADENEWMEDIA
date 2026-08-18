import { NextResponse } from 'next/server'
import { availableSources } from '@/lib/kade-search/collectors'
import { requireReaderAccess } from '../_guard'

export const dynamic = 'force-dynamic'

export async function GET() {
  const guard = await requireReaderAccess()
  if (guard) return guard
  return NextResponse.json({ kaynaklar: availableSources() })
}
