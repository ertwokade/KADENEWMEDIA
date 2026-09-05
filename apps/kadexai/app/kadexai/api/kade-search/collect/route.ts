import { NextRequest, NextResponse } from 'next/server'
import { collectSource, finalizeCollection, isSourceId } from '@/lib/kade-search/collect'
import { SOURCE_ORDER } from '@/lib/kade-search/collectors'
import { replaceSourceHealthAlert } from '@/lib/kade-search/store'
import { sendWhatsAppMessage, whatsappConfiguration } from '@/lib/notifications/whatsapp'
import { failure, requireCollectorAccess } from '../_guard'

export const dynamic = 'force-dynamic'
// Tek kaynagin taranmasi (or. YouTube'un 14 kategorisi) dakikalar surebilir.
export const maxDuration = 300

interface CollectBody {
  source?: string
  countries?: string[]
  limit?: number
  period?: number
  runId?: string
  finalize?: boolean
}

/**
 * Toplama tek kaynak icin calisir; pano kaynaklari sirayla cagirir ve en sonda
 * `finalize: true` ile capraz baglanti + skorlamayi tetikler. Boylece her istek
 * sunucusuz sure siniri icinde kalir.
 */
export async function POST(req: NextRequest) {
  const guard = await requireCollectorAccess(req)
  if (guard) return guard

  let body: CollectBody
  try {
    body = (await req.json()) as CollectBody
  } catch {
    return NextResponse.json({ error: 'Geçersiz istek gövdesi.' }, { status: 400 })
  }

  try {
    if (body.finalize) {
      return NextResponse.json({ ozet: await finalizeCollection() })
    }

    const source = String(body.source ?? '')
    if (!isSourceId(source)) {
      return NextResponse.json(
        { error: `Bilinmeyen kaynak. Geçerli değerler: ${SOURCE_ORDER.join(', ')}` },
        { status: 400 }
      )
    }

    const countries = (Array.isArray(body.countries) ? body.countries : ['TR'])
      .map((c) => String(c).trim().toUpperCase())
      .filter((c) => /^[A-Z]{2}$/.test(c))
      .slice(0, 6)

    const result = await collectSource({
      source,
      countries: countries.length ? countries : ['TR'],
      limit: Math.min(Number(body.limit ?? 50), 100),
      period: Math.min(Number(body.period ?? 7), 120),
      runId: typeof body.runId === 'string' ? body.runId : undefined,
    })

    return NextResponse.json({ sonuc: result })
  } catch (e) {
    return failure(e, 'Toplama tamamlanamadı.')
  }
}

/**
 * Vercel Cron yalnız GET gönderir. Cron iki saatte bir çalışır ve kaynakları
 * döngüsel tarar; böylece her kaynak günde iki kez yeniden ölçülür. Altı ağır
 * toplayıcıyı tek isteğe sıkıştırmadan hız hesabına gerçek ikinci veri noktası
 * sağlanır.
 */
export async function GET(req: NextRequest) {
  const guard = await requireCollectorAccess(req)
  if (guard) return guard

  try {
    const twoHourBucket = Math.floor(Date.now() / (2 * 60 * 60 * 1000))
    const source = SOURCE_ORDER[twoHourBucket % SOURCE_ORDER.length]
    const result = await collectSource({ source, countries: ['TR'], limit: 50, period: 7 })
    let bildirim: 'gonderildi' | 'yapilandirilmamis' | 'basarisiz' | 'gereksiz' = 'gereksiz'
    if (result.found === 0) {
      const message = `${result.label} zamanlanmış toplaması sıfır kayıtla tamamlandı.${result.errors.length ? ` Hatalar: ${result.errors.join(' · ')}` : ''}`
      await replaceSourceHealthAlert(message)
      if (whatsappConfiguration().configured) {
        try {
          await sendWhatsAppMessage(`⚠️ KadexAI kaynak uyarısı\n${message}`)
          bildirim = 'gonderildi'
        } catch {
          bildirim = 'basarisiz'
        }
      } else {
        bildirim = 'yapilandirilmamis'
      }
    }
    const ozet = await finalizeCollection()
    return NextResponse.json({ source, sonuc: result, ozet, bildirim })
  } catch (e) {
    return failure(e, 'Zamanlanmış toplama tamamlanamadı.')
  }
}
