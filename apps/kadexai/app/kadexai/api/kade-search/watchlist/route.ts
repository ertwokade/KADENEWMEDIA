import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth/server'
import { watchlistAdd, watchlistAll, watchlistRemove } from '@/lib/kade-search/store'
import { failure, requireReaderAccess } from '../_guard'

export const dynamic = 'force-dynamic'

async function currentUserId() {
  const user = await getAuthenticatedUser()
  return user?.id ?? null
}

export async function GET() {
  const guard = await requireReaderAccess()
  if (guard) return guard
  try {
    const userId = await currentUserId()
    if (!userId) return NextResponse.json({ liste: [] })
    return NextResponse.json({ liste: await watchlistAll(userId) })
  } catch (e) {
    return failure(e, 'İzleme listesi getirilemedi.')
  }
}

export async function POST(req: NextRequest) {
  const guard = await requireReaderAccess()
  if (guard) return guard
  try {
    const userId = await currentUserId()
    if (!userId) return NextResponse.json({ error: 'Oturum gerekli.' }, { status: 401 })
    const { term, note } = (await req.json()) as { term?: string; note?: string }
    if (!term?.trim()) return NextResponse.json({ error: 'Terim boş olamaz.' }, { status: 400 })
    if (term.length > 120) return NextResponse.json({ error: 'Terim çok uzun.' }, { status: 400 })
    await watchlistAdd(userId, term, note)
    return NextResponse.json({ liste: await watchlistAll(userId) })
  } catch (e) {
    return failure(e, 'İzleme listesine eklenemedi.')
  }
}

export async function DELETE(req: NextRequest) {
  const guard = await requireReaderAccess()
  if (guard) return guard
  try {
    const userId = await currentUserId()
    if (!userId) return NextResponse.json({ error: 'Oturum gerekli.' }, { status: 401 })
    const term = req.nextUrl.searchParams.get('term')
    if (!term) return NextResponse.json({ error: 'Terim gerekli.' }, { status: 400 })
    await watchlistRemove(userId, term)
    return NextResponse.json({ liste: await watchlistAll(userId) })
  } catch (e) {
    return failure(e, 'İzleme listesinden çıkarılamadı.')
  }
}
