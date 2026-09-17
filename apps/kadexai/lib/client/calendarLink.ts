/** Takvime ekle bağlantısı: başlık, platform ve varsayılan olarak yarının tarihi taşınır. */
export function nextDayIstanbul(now = new Date()) {
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Istanbul', year: 'numeric', month: '2-digit', day: '2-digit' }).format(tomorrow)
}

const HOOK_FORMAT_PLATFORM: Record<string, string> = { reels: 'instagram', tiktok: 'tiktok', shorts: 'youtube', youtube: 'youtube' }

export function calendarHref(title: string, platformOrFormat?: string, date = nextDayIstanbul()) {
  const params = new URLSearchParams({ title: title.slice(0, 300), date })
  const platform = platformOrFormat ? (HOOK_FORMAT_PLATFORM[platformOrFormat] ?? platformOrFormat) : ''
  if (platform) params.set('platform', platform)
  return `/dashboard/calendar?${params}`
}
