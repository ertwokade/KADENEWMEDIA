import { NextResponse } from 'next/server'
import { collectArsivhub } from '@/lib/materials/arsivhub'
import { collectTikTok } from '@/lib/materials/tiktok'
import { collectYouTube } from '@/lib/materials/youtube'
import { recordFailedRun, saveMaterials } from '@/lib/materials/store'
import { failure, requireCollectorAccess } from '../../kade-search/_guard'
import type { MaterialSyncResult } from '@/lib/materials/types'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const SOURCES = ['arsivhub', 'youtube', 'tiktok'] as const
type Source = (typeof SOURCES)[number]

async function runSource(source: Source): Promise<MaterialSyncResult> {
  try {
    if (source === 'arsivhub') return await saveMaterials(source, await collectArsivhub())
    if (source === 'youtube') {
      const items = await collectYouTube()
      if (!items.length && !process.env.YOUTUBE_API_KEY?.trim()) {
        return { source, found: 0, inserted: 0, updated: 0, ok: true, error: 'YOUTUBE_API_KEY tanımlı değil.' }
      }
      return await saveMaterials(source, items)
    }
    const tiktok = await collectTikTok()
    if (!tiktok.items.length && tiktok.reason) {
      return { source, found: 0, inserted: 0, updated: 0, ok: true, error: tiktok.reason }
    }
    return await saveMaterials(source, tiktok.items)
  } catch (e) {
    const message = e instanceof Error ? e.message : 'bilinmeyen hata'
    await recordFailedRun(source, message).catch(() => {})
    return { source, found: 0, inserted: 0, updated: 0, ok: false, error: message }
  }
}

/**
 * Kaynaklari yeniden okur ve havuzu tazeler. Her kaynak kendi sonucunu dondurur;
 * biri hata verse de digerleri yazilir.
 */
export async function POST(req: Request) {
  const guard = await requireCollectorAccess(req)
  if (guard) return guard
  try {
    const istenen = new URL(req.url).searchParams.get('source')
    const secilen: Source[] = istenen && SOURCES.includes(istenen as Source) ? [istenen as Source] : [...SOURCES]
    const sonuclar: MaterialSyncResult[] = []
    for (const source of secilen) sonuclar.push(await runSource(source))
    const toplam = sonuclar.reduce(
      (acc, r) => ({ found: acc.found + r.found, inserted: acc.inserted + r.inserted, updated: acc.updated + r.updated }),
      { found: 0, inserted: 0, updated: 0 }
    )
    return NextResponse.json({ toplam, sonuclar })
  } catch (e) {
    return failure(e, 'Materyal toplama başarısız.')
  }
}

/** Zamanlanmis is ayni ucu GET ile cagirabilsin. */
export async function GET(req: Request) {
  return POST(req)
}
