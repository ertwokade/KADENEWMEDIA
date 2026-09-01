import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'
import { sendWhatsAppMessage, whatsappConfiguration } from './whatsapp'

/**
 * İşlem akışı ve WhatsApp bildirimi.
 *
 * Akış: olay ÖNCE deftere yazılır, sonra anlık bildirim denenir. Böylece
 * gönderim başarısız olsa da (sağlayıcı sınırı, ağ hatası) olay kaybolmaz ve
 * gün sonu özetinde görünür.
 *
 * NEDEN TAVAN VAR: CallMeBot pratikte dakikada sınırlı sayıda mesaj kabul
 * eder; her AI çağrısına mesaj atmak numaranın engellenmesine yol açar.
 * Saatlik bütçe dolduğunda olay yine kaydedilir, yalnız anlık mesaj atlanır
 * ve gün sonu özetine düşer.
 */

export type OperationKind =
  | 'signup'
  | 'checkout_started'
  | 'payment_completed'
  | 'payment_failed'
  | 'subscription_activated'
  | 'subscription_churned'
  | 'quote_requested'
  | 'tool_used'
  | 'pipeline_completed'
  | 'error'

const LABEL: Record<OperationKind, string> = {
  signup: '👤 Yeni üye',
  checkout_started: '🛒 Ödeme başlatıldı',
  payment_completed: '💰 Ödeme tamamlandı',
  payment_failed: '⚠️ Ödeme başarısız',
  subscription_activated: '✅ Abonelik açıldı',
  subscription_churned: '📉 Abonelik bitti',
  quote_requested: '📄 Teklif talebi',
  tool_used: '⚡ Araç çalıştırıldı',
  pipeline_completed: '🔗 Akış tamamlandı',
  error: '🔴 Hata',
}

/** Saat başına anlık mesaj tavanı. 0 = anlık bildirim kapalı, yalnız özet. */
function hourlyBudget() {
  const raw = Number(process.env.KADE_WA_HOURLY_LIMIT)
  return Number.isFinite(raw) && raw >= 0 ? raw : 20
}

/** Anlık bildirim gönderilmeyecek olay türleri (virgülle ayrılmış). */
function mutedKinds(): Set<string> {
  return new Set((process.env.KADE_WA_MUTED_KINDS || '').split(',').map((value) => value.trim()).filter(Boolean))
}

export interface OperationInput {
  kind: OperationKind
  title: string
  detail?: string | null
  userId?: string | null
}

/**
 * Olayı deftere yazar ve uygunsa anlık WhatsApp bildirimi gönderir.
 * Hiçbir zaman fırlatmaz: bildirim, üretim akışını durdurmamalı.
 */
export async function notifyOperation(input: OperationInput): Promise<void> {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('operation_events')
      .insert({
        kind: input.kind,
        title: input.title.slice(0, 200),
        detail: input.detail ? String(input.detail).slice(0, 500) : null,
        user_id: input.userId || null,
      })
      .select('id')
      .single()
    if (error || !data) return

    if (mutedKinds().has(input.kind)) return
    const budget = hourlyBudget()
    if (budget === 0) return
    if (!whatsappConfiguration().configured) return

    // Bütçe DENEMEYİ sayar, başarıyı değil.
    //
    // Önce yalnız gönderilmiş satırlar sayılıyordu; sağlayıcı hata verince
    // hiçbir satır "gönderildi" olmuyor, bütçe hiç dolmuyor ve her yeni olay
    // yeniden deniyordu. Canlıda tam bu oldu: sağlayıcı 503 dönerken elli
    // kadar istek üst üste gitti ve büyük olasılıkla hız sınırına takıldık.
    // Son bir saatte oluşan olay sayısı tavanı belirler; sağlayıcı düşse de
    // üstüne gidilmez.
    const since = new Date(Date.now() - 3_600_000).toISOString()
    const { count } = await admin
      .from('operation_events')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', since)
    if ((count ?? 0) > budget) return

    const lines = [`${LABEL[input.kind]} — ${input.title}`]
    if (input.detail) lines.push(input.detail)
    lines.push(new Date().toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' }))

    await sendWhatsAppMessage(lines.join('\n'))
    await admin.from('operation_events').update({ notified_at: new Date().toISOString() }).eq('id', data.id)
  } catch {
    // Bildirim telemetridir; üretim akışını hiçbir koşulda etkilemez.
  }
}

export interface DailySummary {
  total: number
  notified: number
  byKind: Array<{ kind: string; count: number }>
  sent: boolean
}

/** Gün sonu özeti: son 24 saatteki tüm işlemler tek mesajda. */
export async function sendDailyOperationSummary(): Promise<DailySummary> {
  const admin = createAdminClient()
  const since = new Date(Date.now() - 86_400_000).toISOString()
  const { data, error } = await admin
    .from('operation_events')
    .select('kind, notified_at')
    .gte('created_at', since)
    .limit(5_000)
  if (error) throw new Error(`İşlem akışı okunamadı: ${error.message}`)

  const rows = data || []
  const counts = new Map<string, number>()
  let notified = 0
  for (const row of rows) {
    counts.set(row.kind, (counts.get(row.kind) ?? 0) + 1)
    if (row.notified_at) notified += 1
  }
  const byKind = [...counts.entries()]
    .map(([kind, count]) => ({ kind, count }))
    .sort((a, b) => b.count - a.count)

  if (rows.length === 0 || !whatsappConfiguration().configured) {
    return { total: rows.length, notified, byKind, sent: false }
  }

  const lines = [
    `📊 KadexAI gün sonu özeti — ${new Date().toLocaleDateString('tr-TR', { timeZone: 'Europe/Istanbul' })}`,
    `Toplam işlem: ${rows.length}`,
    '',
    ...byKind.map((row) => `${LABEL[row.kind as OperationKind] ?? row.kind}: ${row.count}`),
  ]
  if (rows.length > notified) {
    lines.push('', `${rows.length - notified} işlem anlık gönderilmedi (saatlik tavan).`)
  }

  await sendWhatsAppMessage(lines.join('\n'))
  return { total: rows.length, notified, byKind, sent: true }
}

/**
 * Gün başı brifingi.
 *
 * Gün sonu özeti "dün ne oldu"yu anlatır; bu ise "bugün ne bekliyor"u.
 * İkisi aynı olsaydı sabah mesajı bir işe yaramazdı: sabah bakılacak şey
 * biriken iş — cevaplanmamış teklifler, bitmek üzere olan abonelikler,
 * onay bekleyen içerik adayları.
 */
export async function sendMorningOperationBriefing(): Promise<{ sent: boolean; satirlar: string[] }> {
  const admin = createAdminClient()
  const simdi = Date.now()
  const dun = new Date(simdi - 86_400_000).toISOString()
  const yediGun = new Date(simdi + 7 * 86_400_000).toISOString()

  const [olaylar, teklifler, abonelikler, adaylar] = await Promise.all([
    admin.from('operation_events').select('kind').gte('created_at', dun).limit(5_000),
    admin.from('kadexai_quote_requests').select('id', { count: 'exact', head: true }).eq('status', 'new'),
    admin.from('entitlements').select('id', { count: 'exact', head: true })
      .eq('status', 'active').lte('expires_at', yediGun).gte('expires_at', new Date(simdi).toISOString()),
    admin.from('kade_trend_current').select('id', { count: 'exact', head: true })
      .gte('last_seen', dun),
  ])

  const dunkuOlay = (olaylar.data ?? []).length
  const gelir = (olaylar.data ?? []).filter((r) => r.kind === 'payment_completed').length
  const yeniUye = (olaylar.data ?? []).filter((r) => r.kind === 'signup').length

  const satirlar = [
    `🌅 KadexAI gün başı — ${new Date().toLocaleDateString('tr-TR', { timeZone: 'Europe/Istanbul' })}`,
    '',
    `Dün: ${dunkuOlay} işlem · ${yeniUye} yeni üye · ${gelir} ödeme`,
    '',
    'Bugün bekleyen:',
    `📄 Cevaplanmamış teklif: ${teklifler.count ?? 0}`,
    `⏳ 7 gün içinde bitecek abonelik: ${abonelikler.count ?? 0}`,
    `🔎 Yeni içerik adayı: ${adaylar.count ?? 0}`,
  ]

  if (!whatsappConfiguration().configured) return { sent: false, satirlar }
  await sendWhatsAppMessage(satirlar.join('\n'))
  return { sent: true, satirlar }
}
