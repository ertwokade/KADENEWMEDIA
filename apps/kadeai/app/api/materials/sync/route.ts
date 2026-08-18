import { NextResponse } from 'next/server'
import { collectArsivhub } from '@/lib/materials/arsivhub'
import { recordFailedRun, saveMaterials } from '@/lib/materials/store'
import { failure, requireCollectorAccess } from '../../kade-search/_guard'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/**
 * Kaynagi yeniden okur ve havuzu tazeler. Sitemap tam listeyi verdigi icin
 * ayni cagri hem yeni kayitlari ekler hem mevcutlarin izlenme/tarih gibi
 * alanlarini gunceller.
 */
export async function POST(req: Request) {
  const guard = await requireCollectorAccess(req)
  if (guard) return guard
  try {
    const items = await collectArsivhub()
    const sonuc = await saveMaterials('arsivhub', items)
    return NextResponse.json({ sonuc })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'bilinmeyen hata'
    await recordFailedRun('arsivhub', message).catch(() => {})
    return failure(e, 'Materyal toplama başarısız.')
  }
}

/** Zamanlanmis is ayni ucu GET ile cagirabilsin. */
export async function GET(req: Request) {
  return POST(req)
}
