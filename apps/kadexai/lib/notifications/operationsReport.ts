const VIEW_LABELS: Record<string, string> = {
  dashboard: 'Operasyon Özeti',
  comments: 'SentScan',
  crm: 'Prodüksiyon CRM',
  banana: 'Banana Studio',
  vibe: 'Vibe Coding',
  radar: 'AI Radar',
  settings: 'Operasyon Ayarları',
  pages: 'Notlar',
}

const TYPE_LABELS: Record<string, string> = {
  success: 'Başarılı',
  warning: 'Uyarı',
  error: 'Hata',
  info: 'Bilgi',
}

function clean(value: unknown, max: number) {
  return String(value ?? '').replace(/[\u0000-\u001f\u007f]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max)
}

export function normalizeOperationsReport(input: unknown) {
  const body = input && typeof input === 'object' && !Array.isArray(input)
    ? input as Record<string, unknown>
    : {}
  const message = clean(body.message, 320)
  const view = clean(body.view, 32)
  const type = clean(body.type, 16)
  return {
    message,
    view: VIEW_LABELS[view] ? view : 'dashboard',
    type: TYPE_LABELS[type] ? type : 'info',
  }
}

export function formatOperationsReport(
  report: { message: string; view: string; type: string },
  now = new Date(),
) {
  const time = new Intl.DateTimeFormat('tr-TR', {
    timeZone: 'Europe/Istanbul',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(now)
  return [
    '*KadexAI · Operasyon Raporu*',
    '',
    `İşlem: ${report.message}`,
    `Bölüm: ${VIEW_LABELS[report.view] ?? VIEW_LABELS.dashboard}`,
    `Durum: ${TYPE_LABELS[report.type] ?? TYPE_LABELS.info}`,
    `Zaman: ${time}`,
  ].join('\n')
}
