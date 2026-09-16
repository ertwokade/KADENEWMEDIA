import { NextRequest, NextResponse } from 'next/server'
import { DISCOVERY_LANGUAGES, type DiscoveryLanguage } from '@/lib/kade-search/discovery'
import { discoverContent } from '@/lib/kade-search/discoveryServer'
import { getRateLimitKey, rateLimit, rateLimitHeaders } from '@/lib/rateLimit'
import { isKadeSearchConfigured, requireReaderAccess } from '../_guard'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function POST(request: NextRequest) {
  const limited = rateLimit(getRateLimitKey(request, 'kade-search-discover'), 12, 60_000)
  const headers = { ...rateLimitHeaders(limited), 'Cache-Control': 'private, no-store' }
  if (!limited.allowed) return NextResponse.json({ error: 'Çok fazla arama yaptın. Bir dakika sonra yeniden dene.' }, { status: 429, headers })

  const guard = await requireReaderAccess()
  if (guard) return guard
  if (!isKadeSearchConfigured()) return NextResponse.json({ error: 'Trend veritabanı yapılandırılmamış.' }, { status: 503, headers })

  let body: Record<string, unknown>
  try {
    body = await request.json() as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: 'Geçersiz istek gövdesi.' }, { status: 400, headers })
  }

  const query = String(body.query ?? '').trim()
  const language = String(body.language ?? 'tr') as DiscoveryLanguage
  const country = String(body.country ?? 'TR').trim().toUpperCase()
  const periodDays = Number(body.periodDays ?? 7)
  const platforms = Array.isArray(body.platforms) ? body.platforms.map(String) : undefined
  if (query.length < 2 || query.length > 120) {
    return NextResponse.json({ error: 'Arama metni 2-120 karakter olmalı.' }, { status: 400, headers })
  }
  if (!(language in DISCOVERY_LANGUAGES)) {
    return NextResponse.json({ error: 'Desteklenmeyen arama dili.' }, { status: 400, headers })
  }
  if (!/^[A-Z]{2}$/.test(country)) {
    return NextResponse.json({ error: 'Geçerli bir ülke seç.' }, { status: 400, headers })
  }

  try {
    const result = await discoverContent({ query, language, country, periodDays, platforms, limit: 42 })
    return NextResponse.json(result, { headers })
  } catch (error) {
    const message = error instanceof Error ? error.message : ''
    const safe = /en az 2 karakter/i.test(message) ? message : 'İçerik araması tamamlanamadı.'
    return NextResponse.json({ error: safe }, { status: 503, headers })
  }
}
