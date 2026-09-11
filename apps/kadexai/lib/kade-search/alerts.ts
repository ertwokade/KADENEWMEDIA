/** Identical cross-platform observations can originate from several trend IDs.
 * Keep the newest representative without deleting historical database rows.
 * Other alert types retain their trend identity and distinct messages.
 */
export function uniqueAlerts<T extends { trend_id: string | null; type: string; message: string }>(rows: T[]): T[] {
  const seen = new Set<string>()
  return rows.filter((row) => {
    const message = row.message.normalize('NFC').trim().replace(/\s+/g, ' ')
    const key = JSON.stringify([row.type, row.type === 'cross_platform' ? null : row.trend_id, message])
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

/** Do not spread the trend's `id` over the alert's numeric ID. */
export function withAlertTrend<T>(alert: T, trend?: { title: string | null; platform: string | null; url: string | null }) {
  return trend ? { ...alert, title: trend.title, platform: trend.platform, url: trend.url } : alert
}
