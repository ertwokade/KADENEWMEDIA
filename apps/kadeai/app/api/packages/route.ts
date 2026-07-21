import { NextResponse } from 'next/server'
import { listPackages } from '@/lib/payments/catalog'

export const dynamic = 'force-dynamic'

/** Satın alınabilir paketleri listeler (UI için). */
export async function GET() {
  const packages = listPackages().map((p) => ({
    id: p.id,
    name: p.name,
    tier: p.tier,
    period: p.period,
    apiIncluded: p.apiIncluded,
    amountMinor: p.amountMinor,
    currency: p.currency,
    features: p.features ?? [],
  }))
  return NextResponse.json({ packages }, { headers: { 'Cache-Control': 'no-store' } })
}
