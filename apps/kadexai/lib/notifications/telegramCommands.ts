import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'
import { dailyDigestCandidates } from '@/lib/kade-search/store'
import { selectDailyDigestTrends } from '@/lib/kade-search/dailyDigest'
import type { TelegramBotCommand } from './telegramBot'

const OPERATION_LABELS: Record<string, string> = {
  signup: 'Yeni üye',
  checkout_started: 'Ödeme başlatıldı',
  payment_completed: 'Ödeme tamamlandı',
  payment_failed: 'Ödeme başarısız',
  subscription_activated: 'Abonelik açıldı',
  subscription_churned: 'Abonelik bitti',
  quote_requested: 'Teklif talebi',
  tool_used: 'Araç kullanımı',
  pipeline_completed: 'Akış tamamlandı',
  error: 'Hata',
}

function clean(value: unknown, max = 160) {
  return String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, max)
}

function stamp() {
  return new Date().toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' })
}

function istanbulDayStart() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Istanbul', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date())
  const get = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((part) => part.type === type)?.value)
  return new Date(Date.UTC(get('year'), get('month') - 1, get('day')) - 3 * 60 * 60 * 1000).toISOString()
}

async function statusMessage() {
  const admin = createAdminClient()
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://kadenewmedia.com').replace(/\/$/, '')
  const [database, site] = await Promise.all([
    admin.from('operation_events').select('id', { count: 'exact', head: true }).limit(1),
    fetch(`${siteUrl}/`, { cache: 'no-store', redirect: 'follow', signal: AbortSignal.timeout(8_000) })
      .then((response) => response.ok)
      .catch(() => false),
  ])
  return [
    '🟢 KadeX sistem durumu',
    '',
    'KadexAI: çalışıyor',
    `Ana site: ${site ? 'çalışıyor' : 'erişim sorunu'}`,
    `Veritabanı: ${database.error ? 'erişim sorunu' : 'çalışıyor'}`,
    'Telegram: çalışıyor',
    '',
    stamp(),
  ].join('\n')
}

async function todayMessage() {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('operation_events')
    .select('kind')
    .gte('created_at', istanbulDayStart())
    .limit(5_000)
  if (error) throw new Error('Bugünkü operasyonlar okunamadı.')
  const counts = new Map<string, number>()
  for (const row of data ?? []) counts.set(row.kind, (counts.get(row.kind) ?? 0) + 1)
  const lines = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([kind, count]) => `• ${OPERATION_LABELS[kind] ?? clean(kind, 40)}: ${count}`)
  return [
    '📊 Bugünkü KadexAI operasyonları',
    '',
    `Toplam: ${data?.length ?? 0}`,
    ...(lines.length ? lines : ['Henüz kayıtlı işlem yok.']),
    '',
    stamp(),
  ].join('\n')
}

async function trendsMessage() {
  const rows = selectDailyDigestTrends(await dailyDigestCandidates(20), 5)
  if (!rows.length) return `🔥 Güncel trendler\n\nSon 36 saatte uygun içerik adayı bulunamadı.\n\n${stamp()}`
  return [
    '🔥 Güncel içerik fırsatları',
    '',
    ...rows.map((row, index) => (
      `${index + 1}. ${clean(row.title, 72)}\n   ${clean(row.platform, 24)} · ${clean(row.stage, 24)} · skor ${Math.round(row.score ?? 0)}`
    )),
    '',
    'Detay: https://kadenewmedia.com/kadexai/dashboard/kade-search',
  ].join('\n')
}

async function quotesMessage() {
  const admin = createAdminClient()
  const { data, error } = await admin.from('kadexai_quote_requests').select('status').limit(5_000)
  if (error) throw new Error('Teklifler okunamadı.')
  const counts = new Map<string, number>()
  for (const row of data ?? []) counts.set(row.status, (counts.get(row.status) ?? 0) + 1)
  const active = ['new', 'reviewing', 'offer_prepared', 'sent', 'accepted', 'payment_pending']
  const labels: Record<string, string> = {
    new: 'Yeni', reviewing: 'İnceleniyor', offer_prepared: 'Teklif hazır', sent: 'Gönderildi',
    accepted: 'Kabul edildi', payment_pending: 'Ödeme bekliyor',
  }
  const total = active.reduce((sum, status) => sum + (counts.get(status) ?? 0), 0)
  return [
    '📄 Aktif KadexAI teklifleri',
    '',
    `Toplam bekleyen: ${total}`,
    ...active.map((status) => `• ${labels[status]}: ${counts.get(status) ?? 0}`),
    '',
    stamp(),
  ].join('\n')
}

async function errorsMessage() {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('operation_events')
    .select('title, detail, created_at')
    .eq('kind', 'error')
    .order('created_at', { ascending: false })
    .limit(5)
  if (error) throw new Error('Hata kayıtları okunamadı.')
  if (!data?.length) return `🟢 Son hata kayıtları\n\nKayıtlı sistem hatası yok.\n\n${stamp()}`
  return [
    '🔴 Son sistem hataları',
    '',
    ...data.flatMap((row, index) => [
      `${index + 1}. ${clean(row.title, 120)}`,
      ...(row.detail ? [`   ${clean(row.detail, 180)}`] : []),
      `   ${new Date(row.created_at).toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' })}`,
    ]),
  ].join('\n')
}

async function reportMessage() {
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://kadenewmedia.com').replace(/\/$/, '')
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || `${siteUrl}/kadexai`).replace(/\/$/, '')
  const targets = [
    ['Ana site', `${siteUrl}/`],
    ['Sitemap', `${siteUrl}/sitemap.xml`],
    ['KadexAI', `${appUrl}/api/health`],
  ] as const
  const results = await Promise.all(targets.map(async ([label, url]) => {
    const started = Date.now()
    try {
      const response = await fetch(url, { cache: 'no-store', redirect: 'follow', signal: AbortSignal.timeout(8_000) })
      return `${response.ok ? '✅' : '❌'} ${label}: HTTP ${response.status} · ${Date.now() - started} ms`
    } catch {
      return `❌ ${label}: erişim yok · ${Date.now() - started} ms`
    }
  }))
  return ['🧪 KadeX canlı kısa rapor', '', ...results, '', stamp()].join('\n')
}

function helpMessage(start = false) {
  return [
    start ? '👋 KadeX yönetim botu hazır.' : '❓ KadeX komutları',
    '',
    '/durum — sistem sağlığı',
    '/bugun — bugünkü operasyonlar',
    '/trendler — içerik fırsatları',
    '/teklifler — bekleyen teklifler',
    '/hatalar — son sistem hataları',
    '/rapor — canlı kısa site raporu',
    '/yardim — bu menü',
    '',
    'Yalnız izinli özel Telegram hesabı komut verebilir. Komutlar salt okunurdur; veri silmez veya ödeme işlemi yapmaz.',
  ].join('\n')
}

export async function executeTelegramCommand(command: TelegramBotCommand) {
  switch (command) {
    case 'durum': return statusMessage()
    case 'bugun': return todayMessage()
    case 'trendler': return trendsMessage()
    case 'teklifler': return quotesMessage()
    case 'hatalar': return errorsMessage()
    case 'rapor': return reportMessage()
    case 'start': return helpMessage(true)
    case 'yardim': return helpMessage(false)
  }
}
