import 'server-only'

import { NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth/server'
import { isSettingsOwnerUser } from '@/lib/featureAccess'

const AUTH_DISABLED = process.env.NODE_ENV !== 'production' && process.env.KADE_DISABLE_AUTH === '1'

export function isKadeSearchConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
  )
}

/**
 * Toplama, ortak veri havuzuna yazar ve dis kaynaklara istek atar; bu yuzden
 * yalnizca hesap sahibine (ya da CRON_SECRET tasiyan zamanlanmis ise) aciktir.
 */
export async function requireCollectorAccess(req: Request): Promise<NextResponse | null> {
  const cronSecret = process.env.CRON_SECRET?.trim()
  if (cronSecret) {
    if (req.headers.get('x-cron-secret')?.trim() === cronSecret) return null
    /* Vercel'in zamanlanmis isleri gizli anahtari Authorization ile tasiyor. */
    if (req.headers.get('authorization')?.trim() === `Bearer ${cronSecret}`) return null
  }
  if (AUTH_DISABLED) return null

  const user = await getAuthenticatedUser()
  if (!user) return NextResponse.json({ error: 'Oturum açman gerekiyor.' }, { status: 401 })
  if (!isSettingsOwnerUser(user)) {
    return NextResponse.json({ error: 'Veri toplama yalnızca hesap sahibine açıktır.' }, { status: 403 })
  }
  return null
}

/** Trend verisini okumak icin oturum yeterlidir. */
export async function requireReaderAccess(): Promise<NextResponse | null> {
  if (AUTH_DISABLED) return null
  if (!isKadeSearchConfigured()) {
    return NextResponse.json({ error: 'Veritabanı yapılandırılmamış.' }, { status: 503 })
  }
  if (await getAuthenticatedUser()) return null
  return NextResponse.json({ error: 'Oturum açman gerekiyor.' }, { status: 401 })
}

export function failure(e: unknown, fallback: string) {
  const message = e instanceof Error ? e.message : fallback
  // Supabase "relation does not exist" -> migration uygulanmamis
  if (/fetch failed|ENOTFOUND|ECONNREFUSED|getaddrinfo/i.test(message)) {
    return NextResponse.json(
      { error: 'Veritabanına ulaşılamıyor. NEXT_PUBLIC_SUPABASE_URL ve anahtarları kontrol et.' },
      { status: 503 }
    )
  }
  if (/relation .* does not exist|schema cache/i.test(message)) {
    return NextResponse.json(
      { error: 'Trend Radar tabloları henüz oluşturulmamış. supabase/migrations/202608180001_kade_trend_radar.sql dosyasını uygula.' },
      { status: 503 }
    )
  }
  return NextResponse.json({ error: fallback }, { status: 500 })
}
