import { NextResponse } from 'next/server'
import { assertAuthenticatedUser } from '@/lib/auth/server'
import { getBackendHealth } from '@/lib/backend/client'
import { captureApiError } from '@/lib/observability/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const user = await assertAuthenticatedUser()
  if (!user && !(process.env.NODE_ENV !== 'production' && process.env.KADE_DISABLE_AUTH === '1')) {
    return NextResponse.json({ error: 'Oturum gerekli.' }, { status: 401 })
  }
  try {
    const backend = await getBackendHealth()
    return NextResponse.json({ status: 'ok', backend }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    captureApiError(error, '/api/backend/health')
    return NextResponse.json({ error: 'FastAPI servisine ulaşılamıyor.' }, { status: 503 })
  }
}
