import { NextResponse } from 'next/server'
import { checkOfficialSocialAccess } from '@/lib/kade-search/officialSocial'
import { requireCollectorAccess } from '../_guard'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

/** TikTok ve Instagram resmi API bilgilerini canlı doğrular; sır değerlerini döndürmez. */
export async function GET(request: Request) {
  const guard = await requireCollectorAccess(request)
  if (guard) return guard
  const checks = await checkOfficialSocialAccess()
  return NextResponse.json({ checkedAt: new Date().toISOString(), checks }, { headers: { 'Cache-Control': 'private, no-store' } })
}
