import 'server-only'

import { isPlatformProviderEnabled } from '@/lib/ai/runtimeAvailability'
import { selectDailyDigestTrends } from '@/lib/kade-search/dailyDigest'
import { dailyDigestCandidates } from '@/lib/kade-search/store'
import { createAdminClient } from '@/lib/supabase/admin'
import { telegramConfiguration } from './telegramConfig'
import type { TelegramBotChatType, TelegramBotCommand } from './telegramBot'
import { parseTelegramContentPlatform } from './telegramContentLinks'
import { formatSavedContentResult, formatTelegramContentList } from './telegramContentPresentation'
import {
  deleteShotTelegramContent,
  deleteTelegramContent,
  listTelegramContent,
  markTelegramContentStatus,
  refreshTelegramContent,
  saveTelegramContent,
} from './telegramSavedContent'
import { whatsappConfiguration } from './whatsappConfig'

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

const AI_PROVIDERS = [
  ['google', 'Gemini'], ['vercel', 'AI Gateway'], ['groq', 'Groq'], ['cerebras', 'Cerebras'],
  ['openrouter', 'OpenRouter'], ['anthropic', 'Anthropic'], ['openai', 'OpenAI'], ['mistral', 'Mistral'],
] as const

export interface TelegramCommandContext {
  chatType: TelegramBotChatType
  groupActive: boolean
  chatId: string
  contentLibraryChatId?: string
  actorId: string
  ownerActor: boolean
  args?: string
}

function contentLibraryChatId(context: TelegramCommandContext) {
  return context.contentLibraryChatId ?? context.chatId
}

function clean(value: unknown, max = 160) {
  return String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, max)
}

function stamp() {
  return new Date().toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' })
}

function number(value: number) {
  return new Intl.NumberFormat('tr-TR').format(value)
}

function timeAgo(value: string) {
  const milliseconds = Date.now() - new Date(value).getTime()
  if (!Number.isFinite(milliseconds) || milliseconds < 0) return 'az önce'
  const minutes = Math.floor(milliseconds / 60_000)
  if (minutes < 1) return 'az önce'
  if (minutes < 60) return `${minutes} dk önce`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} sa önce`
  return `${Math.floor(hours / 24)} gün önce`
}

function istanbulDayStart(daysAgo = 0) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Istanbul', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date())
  const get = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((part) => part.type === type)?.value)
  const todayUtc = Date.UTC(get('year'), get('month') - 1, get('day')) - 3 * 60 * 60 * 1000
  return new Date(todayUtc - daysAgo * 24 * 60 * 60 * 1000).toISOString()
}

function appUrls() {
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://kadenewmedia.com').replace(/\/$/, '')
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://kadexai.kadenewmedia.com/kadexai').replace(/\/$/, '')
  return { siteUrl, appUrl }
}

async function measuredEndpoint(label: string, url: string) {
  const started = Date.now()
  try {
    const response = await fetch(url, { cache: 'no-store', redirect: 'follow', signal: AbortSignal.timeout(8_000) })
    return { label, ok: response.ok, status: response.status, milliseconds: Date.now() - started }
  } catch {
    return { label, ok: false, status: 0, milliseconds: Date.now() - started }
  }
}

async function endpointResults() {
  const { siteUrl, appUrl } = appUrls()
  return Promise.all([
    measuredEndpoint('Ana site', `${siteUrl}/`),
    measuredEndpoint('Paketler', `${siteUrl}/paketler`),
    measuredEndpoint('Sitemap', `${siteUrl}/sitemap.xml`),
    measuredEndpoint('KadexAI', `${appUrl}/api/health`),
    measuredEndpoint('KadexAI giriş', `${appUrl}/login`),
  ])
}

async function statusMessage() {
  const admin = createAdminClient()
  const [database, endpoints] = await Promise.all([
    admin.from('operation_events').select('id', { count: 'exact', head: true }).limit(1),
    endpointResults(),
  ])
  return [
    '🟢 KadeX sistem durumu',
    '',
    ...endpoints.map((item) => `${item.ok ? '✅' : '❌'} ${item.label}: ${item.status || 'erişim yok'} · ${item.milliseconds} ms`),
    `${database.error ? '❌' : '✅'} Veritabanı: ${database.error ? 'erişim sorunu' : 'çalışıyor'}`,
    '✅ Telegram webhook: çalışıyor',
    '',
    stamp(),
  ].join('\n')
}

async function periodOperationsMessage(days: number, title: string) {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('operation_events')
    .select('kind')
    .gte('created_at', istanbulDayStart(days - 1))
    .limit(5_000)
  if (error) throw new Error('Operasyonlar okunamadı.')
  const counts = new Map<string, number>()
  for (const row of data ?? []) counts.set(row.kind, (counts.get(row.kind) ?? 0) + 1)
  const lines = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([kind, count]) => `• ${OPERATION_LABELS[kind] ?? clean(kind, 40)}: ${number(count)}`)
  return [
    title,
    '',
    `Toplam olay: ${number(data?.length ?? 0)}`,
    ...(lines.length ? lines : ['Henüz kayıtlı işlem yok.']),
    '',
    stamp(),
  ].join('\n')
}

async function recentOperationsMessage() {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('operation_events')
    .select('kind, title, created_at')
    .order('created_at', { ascending: false })
    .limit(8)
  if (error) throw new Error('Son işlemler okunamadı.')
  return [
    '🕘 Son operasyonlar',
    '',
    ...(data?.length ? data.map((row, index) => (
      `${index + 1}. ${OPERATION_LABELS[row.kind] ?? clean(row.kind, 32)} · ${clean(row.title, 100)}\n   ${timeAgo(row.created_at)}`
    )) : ['Henüz kayıtlı işlem yok.']),
    '',
    stamp(),
  ].join('\n')
}

async function trendsMessage() {
  const rows = selectDailyDigestTrends(await dailyDigestCandidates(30), 8)
  if (!rows.length) return `🔥 Güncel trendler\n\nSon 36 saatte uygun içerik adayı bulunamadı.\n\n${stamp()}`
  return [
    '🔥 Güncel içerik fırsatları',
    '',
    ...rows.map((row, index) => (
      `${index + 1}. ${clean(row.title, 82)}\n   ${clean(row.platform, 24)} · ${clean(row.stage, 24)} · skor ${Math.round(row.score ?? 0)}`
    )),
    '',
    'Detay: https://kadenewmedia.com/kadexai/dashboard/kade-search',
  ].join('\n')
}

async function saveContentMessage(context: TelegramCommandContext) {
  const url = context.args?.trim()
  if (!url) {
    return '🎬 İçerik ekleme\n\nBir Instagram Reel veya TikTok video/fotoğraf bağlantısını doğrudan gönder ya da /ekle BAĞLANTI yaz.'
  }
  const result = await saveTelegramContent({ chatId: contentLibraryChatId(context), actorId: context.actorId, url })
  return formatSavedContentResult(result.row, result.updated)
}

function contentListArgs(args: string | undefined) {
  const value = args ?? ''
  const platform = parseTelegramContentPlatform(value)
  const pageToken = value.split(/\s+/).find((token) => /^\d{1,3}$/.test(token))
  const page = Math.max(1, Math.min(Number(pageToken) || 1, 100))
  return { platform, page }
}

async function savedContentMessage(
  context: TelegramCommandContext,
  sort: 'performance' | 'latest',
  status?: 'pending' | 'shot',
) {
  const { platform, page } = contentListArgs(context.args)
  const rows = await listTelegramContent({
    chatId: contentLibraryChatId(context), platform, status, sort, limit: 500,
  })
  const platformLabel = platform === 'instagram' ? ' · Instagram Reels' : platform === 'tiktok' ? ' · TikTok' : ''
  const baseCommand = status === 'shot' ? 'cekilenler' : status === 'pending' ? 'bekleyenler' : sort === 'latest' ? 'son' : 'icerikler'
  const command = `${baseCommand}${platform ? ` ${platform}` : ''}`
  const title = status === 'shot'
    ? `✅ Çekilmiş içerikler${platformLabel}`
    : status === 'pending'
      ? `⏳ Çekim bekleyen içerikler${platformLabel}`
      : sort === 'latest' ? `🕘 Son eklenen içerikler${platformLabel}` : `📋 Kayıtlı içerikler${platformLabel}`
  return formatTelegramContentList(rows, { title, sort, limit: 8, page, command })
}

async function refreshContentMessage(context: TelegramCommandContext) {
  const platform = parseTelegramContentPlatform(context.args ?? '')
  const result = await refreshTelegramContent(contentLibraryChatId(context), 50, platform)
  if (!result.total) return '♻️ Güncellenecek kayıtlı içerik yok.'
  return [
    '♻️ İçerik verileri yenilendi',
    '',
    `Başarılı: ${result.refreshed}/${result.total}`,
    `Veri alınamayan: ${result.failed}`,
    '',
    'Platform bir metriği vermiyorsa değer uydurulmaz; listede “veri alınamadı” görünür.',
  ].join('\n')
}

async function deleteContentMessage(context: TelegramCommandContext) {
  const reference = context.args?.trim()
  if (!reference) return '🗑️ Silmek için listedeki kısa kodu kullan: /sil KOD'
  const deleted = await deleteTelegramContent(contentLibraryChatId(context), reference)
  if (!deleted) return '⚠️ Ortak içerik kütüphanesinde belirtilen kod veya sıra bulunamadı. Önce /icerikler yaz.'
  return `🗑️ İçerik silindi\n\n${deleted.platform === 'instagram' ? 'Instagram Reels' : 'TikTok'} · ${clean(deleted.title || deleted.description || deleted.canonical_url, 160)}`
}

async function markContentMessage(context: TelegramCommandContext, status: 'pending' | 'shot') {
  const reference = context.args?.trim()
  if (!reference) {
    return status === 'shot'
      ? '✅ Çekildi olarak işaretlemek için: /cekildi KOD'
      : '↩️ Çekildi işaretini geri almak için: /cekilmedi KOD'
  }
  const row = await markTelegramContentStatus(contentLibraryChatId(context), context.actorId, reference, status)
  if (!row) return '⚠️ Belirtilen içerik kodu bulunamadı. Önce /icerikler yaz.'
  return [
    status === 'shot' ? '✅ İçerik çekildi olarak işaretlendi.' : '↩️ İçerik yeniden bekleyenlere alındı.',
    '',
    `${row.platform === 'instagram' ? 'Instagram Reels' : 'TikTok'} · ${clean(row.title || row.description || row.canonical_url, 160)}`,
    `Kod: ${row.id.slice(0, 8)}`,
    row.canonical_url,
  ].join('\n')
}

async function deleteShotContentMessage(context: TelegramCommandContext) {
  const chatId = contentLibraryChatId(context)
  const rows = await listTelegramContent({ chatId, status: 'shot', sort: 'latest', limit: 500 })
  if (!rows.length) return 'ℹ️ Silinecek çekilmiş içerik yok.'
  if (context.args?.trim().toLocaleUpperCase('tr-TR') !== 'ONAY') {
    return [
      '⚠️ Toplu silme onayı gerekiyor.',
      '',
      `${rows.length} çekilmiş içerik kalıcı olarak silinecek. Bekleyen içeriklere dokunulmayacak.`,
      'Devam etmek için: /cekilenlerisil ONAY',
    ].join('\n')
  }
  const deleted = await deleteShotTelegramContent(chatId)
  return `🗑️ ${deleted} çekilmiş içerik silindi. Bekleyen içerikler korundu.`
}

async function quotesMessage() {
  const admin = createAdminClient()
  const { data, error } = await admin.from('kadexai_quote_requests').select('status').limit(5_000)
  if (error) throw new Error('Teklifler okunamadı.')
  const counts = new Map<string, number>()
  for (const row of data ?? []) counts.set(row.status, (counts.get(row.status) ?? 0) + 1)
  const order = ['new', 'reviewing', 'offer_prepared', 'sent', 'accepted', 'payment_pending', 'completed', 'rejected']
  const labels: Record<string, string> = {
    new: 'Yeni', reviewing: 'İnceleniyor', offer_prepared: 'Teklif hazır', sent: 'Gönderildi',
    accepted: 'Kabul edildi', payment_pending: 'Ödeme bekliyor', completed: 'Tamamlandı', rejected: 'Reddedildi',
  }
  const active = order.slice(0, 6).reduce((sum, status) => sum + (counts.get(status) ?? 0), 0)
  return [
    '📄 KadexAI teklif özeti',
    '',
    `Aktif: ${number(active)} · Tüm kayıtlar: ${number(data?.length ?? 0)}`,
    ...order.map((status) => `• ${labels[status]}: ${number(counts.get(status) ?? 0)}`),
    '',
    stamp(),
  ].join('\n')
}

async function subscriptionsMessage() {
  const admin = createAdminClient()
  const { data, error } = await admin.from('kade_subscriptions').select('status, monthly_amount, currency').limit(5_000)
  if (error) throw new Error('Abonelikler okunamadı.')
  const counts = new Map<string, number>()
  let activeMonthlyTry = 0
  for (const row of data ?? []) {
    const status = clean(row.status, 32) || 'belirsiz'
    counts.set(status, (counts.get(status) ?? 0) + 1)
    if (status === 'aktif' && row.currency === 'TRY' && Number.isFinite(Number(row.monthly_amount))) {
      activeMonthlyTry += Number(row.monthly_amount)
    }
  }
  return [
    '🔁 Abonelik özeti',
    '',
    `Toplam: ${number(data?.length ?? 0)}`,
    ...[...counts.entries()].sort((a, b) => b[1] - a[1]).map(([status, count]) => `• ${status}: ${number(count)}`),
    `Aktif aylık TRY toplamı: ${activeMonthlyTry.toLocaleString('tr-TR', { maximumFractionDigits: 2 })} ₺`,
    '',
    stamp(),
  ].join('\n')
}

async function usersMessage() {
  const admin = createAdminClient()
  const [all, recent] = await Promise.all([
    admin.from('profiles').select('user_id', { count: 'exact', head: true }),
    admin.from('profiles').select('user_id', { count: 'exact', head: true }).gte('created_at', istanbulDayStart(6)),
  ])
  if (all.error || recent.error) throw new Error('Kullanıcı sayıları okunamadı.')
  return [
    '👤 KadexAI kullanıcıları',
    '',
    `Toplam profil: ${number(all.count ?? 0)}`,
    `Son 7 günde yeni: ${number(recent.count ?? 0)}`,
    '',
    'Kişisel bilgi gösterilmez; yalnız toplamlar raporlanır.',
    stamp(),
  ].join('\n')
}

async function usageMessage() {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('ai_usage_events')
    .select('total_tokens, cost_usd, byok, status, provider')
    .gte('created_at', istanbulDayStart(6))
    .limit(5_000)
  if (error) throw new Error('AI kullanım kayıtları okunamadı.')
  let tokens = 0
  let knownCost = 0
  let failed = 0
  let byok = 0
  const providers = new Map<string, number>()
  for (const row of data ?? []) {
    tokens += Number(row.total_tokens) || 0
    if (!row.byok) knownCost += Number(row.cost_usd) || 0
    if (row.byok) byok += 1
    if (row.status === 'failed') failed += 1
    const provider = clean(row.provider, 30) || 'belirsiz'
    providers.set(provider, (providers.get(provider) ?? 0) + 1)
  }
  return [
    '⚡ Son 7 gün AI kullanımı',
    '',
    `Çağrı: ${number(data?.length ?? 0)} · Başarısız: ${number(failed)}`,
    `Token: ${number(tokens)}`,
    `Bilinen platform maliyeti: $${knownCost.toFixed(4)}`,
    `Kullanıcı anahtarlı çağrı: ${number(byok)}`,
    '',
    ...[...providers.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([provider, count]) => `• ${provider}: ${number(count)}`),
    '',
    stamp(),
  ].join('\n')
}

function aiMessage() {
  const enabled = AI_PROVIDERS.filter(([id]) => isPlatformProviderEnabled(id))
  return [
    '🤖 AI sağlayıcı durumu',
    '',
    ...AI_PROVIDERS.map(([id, label]) => `${isPlatformProviderEnabled(id) ? '✅' : '⚪️'} ${label}`),
    '',
    `Kullanılabilir: ${enabled.length}/${AI_PROVIDERS.length}`,
    '⚪️ işareti anahtarın eksik veya sağlayıcının güvenli biçimde devre dışı olduğunu belirtir.',
    stamp(),
  ].join('\n')
}

async function notificationsMessage() {
  const admin = createAdminClient()
  const telegram = telegramConfiguration()
  const whatsapp = whatsappConfiguration()
  const { count, error } = await admin
    .from('operation_events')
    .select('id', { count: 'exact', head: true })
    .gte('notified_at', istanbulDayStart())
  return [
    '🔔 Bildirim kanalları',
    '',
    `${telegram.configured ? '✅' : '❌'} Telegram: ${telegram.configured ? 'hazır' : 'eksik ayar'}`,
    `${whatsapp.configured ? '✅' : '❌'} WhatsApp: ${whatsapp.configured ? 'hazır' : 'eksik ayar'}`,
    `Seçili kanallar: ${clean(process.env.KADE_NOTIFICATION_CHANNELS || 'whatsapp', 80)}`,
    `Bugün bildirim işaretli olay: ${error ? 'okunamadı' : number(count ?? 0)}`,
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
    .limit(8)
  if (error) throw new Error('Hata kayıtları okunamadı.')
  if (!data?.length) return `🟢 Son hata kayıtları\n\nKayıtlı sistem hatası yok.\n\n${stamp()}`
  return [
    '🔴 Son sistem hataları',
    '',
    ...data.flatMap((row, index) => [
      `${index + 1}. ${clean(row.title, 120)}`,
      ...(row.detail ? [`   ${clean(row.detail, 180)}`] : []),
      `   ${timeAgo(row.created_at)}`,
    ]),
  ].join('\n')
}

async function performanceMessage() {
  const results = await endpointResults()
  const successful = results.filter((item) => item.ok)
  const average = successful.length
    ? Math.round(successful.reduce((sum, item) => sum + item.milliseconds, 0) / successful.length)
    : 0
  return [
    '⏱️ Canlı performans ölçümü',
    '',
    ...results.map((item) => `${item.ok ? '✅' : '❌'} ${item.label}: ${item.milliseconds} ms · HTTP ${item.status || '-'}`),
    '',
    `Başarılı uç ortalaması: ${number(average)} ms`,
    `${successful.length}/${results.length} uç erişilebilir`,
    stamp(),
  ].join('\n')
}

async function sitemapMessage() {
  const { siteUrl } = appUrls()
  const started = Date.now()
  try {
    const response = await fetch(`${siteUrl}/sitemap.xml`, {
      cache: 'no-store', redirect: 'follow', signal: AbortSignal.timeout(8_000),
    })
    const body = response.ok ? await response.text() : ''
    const urls = body.match(/<loc>/g)?.length ?? 0
    return [
      '🗺️ Sitemap kontrolü',
      '',
      `${response.ok ? '✅' : '❌'} HTTP ${response.status}`,
      `URL sayısı: ${number(urls)}`,
      `Yanıt süresi: ${number(Date.now() - started)} ms`,
      `Adres: ${siteUrl}/sitemap.xml`,
      '',
      stamp(),
    ].join('\n')
  } catch {
    return `🗺️ Sitemap kontrolü\n\n❌ Sitemap'e erişilemedi.\n\n${stamp()}`
  }
}

async function generalMessage() {
  const admin = createAdminClient()
  const today = istanbulDayStart()
  const [users, quotes, subscriptions, operations, trends, errors] = await Promise.all([
    admin.from('profiles').select('user_id', { count: 'exact', head: true }),
    admin.from('kadexai_quote_requests').select('id', { count: 'exact', head: true }),
    admin.from('kade_subscriptions').select('id', { count: 'exact', head: true }).eq('status', 'aktif'),
    admin.from('operation_events').select('id', { count: 'exact', head: true }).gte('created_at', today),
    admin.from('kade_trends').select('id', { count: 'exact', head: true }).gte('last_seen', today),
    admin.from('operation_events').select('id', { count: 'exact', head: true }).eq('kind', 'error').gte('created_at', today),
  ])
  const metric = (label: string, result: { count: number | null; error: unknown }) => (
    `${result.error ? '⚠️' : '•'} ${label}: ${result.error ? 'okunamadı' : number(result.count ?? 0)}`
  )
  return [
    '🏠 KadeX yönetim özeti',
    '',
    metric('KadexAI profili', users),
    metric('Toplam teklif', quotes),
    metric('Aktif abonelik', subscriptions),
    metric('Bugünkü operasyon', operations),
    metric('Bugün görülen trend', trends),
    metric('Bugünkü hata', errors),
    '',
    'Hızlı işlemler için aşağıdaki düğmeleri kullan.',
    stamp(),
  ].join('\n')
}

async function reportMessage() {
  const [health, operations, usage] = await Promise.all([
    endpointResults(),
    periodOperationsMessage(7, '📅 Son 7 gün operasyonları'),
    usageMessage(),
  ])
  return [
    '🧪 KadeX kapsamlı canlı rapor',
    '',
    'SERVİSLER',
    ...health.map((item) => `${item.ok ? '✅' : '❌'} ${item.label}: HTTP ${item.status || '-'} · ${item.milliseconds} ms`),
    '',
    operations.split('\n').slice(2, -2).join('\n'),
    '',
    usage.split('\n').slice(2, 6).join('\n'),
    '',
    stamp(),
  ].join('\n')
}

function groupMessage(context: TelegramCommandContext) {
  if (context.chatType === 'private') {
    return '👥 Grup kullanımı\n\nKadeX’i bir Telegram grubuna ekle, ardından o grupta yalnız yetkili sahip hesabından /baslat yaz. Durdurmak için /durdur kullan.'
  }
  return [
    '👥 Bu grubun KadeX durumu',
    '',
    context.groupActive ? '✅ Etkin' : '⏸️ Etkin değil',
    context.groupActive ? 'Gruptaki üyeler salt-okunur rapor komutlarını kullanabilir.' : 'Yetkili sahip /baslat yazmalıdır.',
    'Yalnız yetkili sahip /durdur komutuyla botu kapatabilir.',
  ].join('\n')
}

function lifecycleMessage(command: 'baslat' | 'durdur', context: TelegramCommandContext) {
  if (context.chatType === 'private') {
    return `ℹ️ /${command} yalnız grup veya süpergrup içinde kullanılır. Bot özel sohbette zaten hazırdır.`
  }
  return command === 'baslat'
    ? '✅ KadeX bu grupta etkinleştirildi. Gruptaki üyeler aşağıdaki salt-okunur rapor komutlarını kullanabilir. Kapatmak için yalnız sahip hesabı /durdur yazabilir.'
    : '⏸️ KadeX bu grupta durduruldu. Yeniden açmak için yetkili sahip /baslat yazabilir.'
}

function aboutMessage() {
  return [
    '✨ KadeX neler yapar?',
    '',
    '• Kade New Media ve KadexAI servislerini canlı kontrol eder.',
    '• Operasyon, kullanıcı, teklif ve abonelik sayılarını özetler.',
    '• Güncel trendleri ve içerik fırsatlarını getirir.',
    '• Instagram Reels ve TikTok bağlantılarını metadata ve erişilebilen gerçek metriklerle saklar.',
    '• Kayıtlı içerikleri performansa veya eklenme zamanına göre sıralar; 09:00 ve 12:00’de özetler.',
    '• AI kullanımı, token ve bilinen maliyeti raporlar.',
    '• Son hata ve işlem kayıtlarını güvenli biçimde gösterir.',
    '• Özel sohbette ve sahip tarafından etkinleştirilen gruplarda çalışır.',
    '',
    'KadeX yalnız kayıtlı sosyal içeriklerde açıkça istenen ekleme, yenileme ve silme işlemlerini yapar; ödeme yapmaz ve parola/anahtar göstermez.',
  ].join('\n')
}

function helpMessage(start = false, context?: TelegramCommandContext) {
  const groupNote = context?.chatType === 'private'
    ? 'Grup kurulumu: botu gruba ekle ve grupta /baslat yaz.'
    : context?.groupActive ? 'Bu grupta KadeX etkin.' : 'Bu grupta yetkili sahip /baslat yazmalıdır.'
  return [
    start ? '👋 KadeX kapsamlı yönetim botu hazır.' : '❓ KadeX komutları',
    '',
    'YÖNETİM',
    '/genel — ana yönetim özeti',
    '/bugun — bugünkü operasyonlar',
    '/hafta — son 7 gün',
    '/sonislemler — son 8 işlem',
    '/kullanicilar — kullanıcı toplamları',
    '',
    'TİCARİ',
    '/teklifler — teklif durumları',
    '/abonelikler — abonelik ve aylık toplam',
    '/kullanim — AI çağrı/token/maliyet özeti',
    '',
    'İÇERİK VE TEKNİK',
    '/trendler — 8 güncel fırsat',
    '/ekle BAĞLANTI — Reel veya TikTok kaydet',
    '/icerikler [instagram|tiktok] [SAYFA] — sayfalı içerik tablosu',
    '/son [instagram|tiktok] [SAYFA] — son eklenenleri göster',
    '/eniyi [instagram|tiktok] [SAYFA] — en yüksek performanslıları göster',
    '/bekleyenler [SAYFA] — çekim bekleyenleri göster',
    '/cekildi KOD — içeriği çekildi olarak işaretle',
    '/cekilmedi KOD — çekildi işaretini geri al',
    '/cekilenler [SAYFA] — çekilmiş içerikleri göster',
    '/cekilenlerisil — güvenli toplu silme onayını göster',
    '/guncelle [instagram|tiktok] — metadata ve metrikleri yenile',
    '/sil KOD — kayıtlı içeriği sil',
    '/durum — servis ve veritabanı sağlığı',
    '/performans — canlı hız ölçümü',
    '/sitemap — site haritası kontrolü',
    '/ai — sağlayıcı durumu',
    '/bildirimler — kanal durumu',
    '/hatalar — son 8 hata',
    '/rapor — kapsamlı canlı rapor',
    '',
    'GRUP VE YARDIM',
    '/baslat · /durdur · /grup · /hakkinda · /yardim',
    '/yetkiiste — başka Telegram hesabından erişim iste',
    '/yetkiver ID · /yetkial ID · /yetkililer — ana sahip erişim yönetimi',
    '',
    groupNote,
    'Bağlantıyı doğrudan göndermek de /ekle ile aynıdır. Gruplarda yazma işlemleri yalnız yetkili sahibe açıktır.',
    'Kişisel bilgi, parola veya API anahtarı gösterilmez.',
  ].join('\n')
}

export async function executeTelegramCommand(command: TelegramBotCommand, context: TelegramCommandContext) {
  switch (command) {
    case 'genel': return generalMessage()
    case 'durum': return statusMessage()
    case 'bugun': return periodOperationsMessage(1, '📊 Bugünkü KadexAI operasyonları')
    case 'hafta': return periodOperationsMessage(7, '📅 Son 7 gün KadexAI operasyonları')
    case 'sonislemler': return recentOperationsMessage()
    case 'trendler': return trendsMessage()
    case 'ekle': return saveContentMessage(context)
    case 'icerikler': return savedContentMessage(context, 'performance')
    case 'son': return savedContentMessage(context, 'latest')
    case 'eniyi': return savedContentMessage(context, 'performance')
    case 'bekleyenler': return savedContentMessage(context, 'latest', 'pending')
    case 'cekildi': return markContentMessage(context, 'shot')
    case 'cekilmedi': return markContentMessage(context, 'pending')
    case 'cekilenler': return savedContentMessage(context, 'latest', 'shot')
    case 'cekilenlerisil': return deleteShotContentMessage(context)
    case 'guncelle': return refreshContentMessage(context)
    case 'sil': return deleteContentMessage(context)
    case 'teklifler': return quotesMessage()
    case 'abonelikler': return subscriptionsMessage()
    case 'kullanicilar': return usersMessage()
    case 'kullanim': return usageMessage()
    case 'ai': return aiMessage()
    case 'bildirimler': return notificationsMessage()
    case 'hatalar': return errorsMessage()
    case 'performans': return performanceMessage()
    case 'sitemap': return sitemapMessage()
    case 'rapor': return reportMessage()
    case 'grup': return groupMessage(context)
    case 'yetkiiste': return '🔐 Bu komut Telegram hesap eşleştirme akışında işlenir.'
    case 'yetkiver': return '🔐 Bu komut yalnız ana sahip tarafından özel sohbette kullanılabilir.'
    case 'yetkial': return '🔐 Bu komut yalnız ana sahip tarafından özel sohbette kullanılabilir.'
    case 'yetkililer': return '🔐 Bu komut yalnız ana sahip tarafından özel sohbette kullanılabilir.'
    case 'hakkinda': return aboutMessage()
    case 'baslat': return lifecycleMessage('baslat', context)
    case 'durdur': return lifecycleMessage('durdur', context)
    case 'start': return helpMessage(true, context)
    case 'yardim': return helpMessage(false, context)
  }
}
