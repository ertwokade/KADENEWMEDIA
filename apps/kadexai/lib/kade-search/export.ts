import { CATEGORIES, KIND_LABELS, STAGES, platformLabel } from './taxonomy'
import type { CurrentTrendRow } from './types'

export function hasMeasuredVelocity(trend: Pick<CurrentTrendRow, 'inferred' | 'snapshot_count' | 'velocity' | 'breakdown'>) {
  return !trend.inferred && trend.snapshot_count >= 2 && trend.breakdown?.hizOlculdu === true
    && typeof trend.velocity === 'number' && Number.isFinite(trend.velocity)
}

/** Quote CSV delimiters and keep untrusted titles from becoming spreadsheet formulas. */
export function csvCell(value: unknown): string {
  let text = value == null || (typeof value === 'number' && !Number.isFinite(value)) ? '' : String(value)
  if (typeof value === 'string' && (/^[\s\uFEFF]*[=+\-@]/u.test(text) || /^[\t\r\n]/u.test(text))) text = `'${text}`
  return `"${text.replace(/"/g, '""')}"`
}

export function trendCsv(trends: CurrentTrendRow[]): string {
  const fields: Array<[string, (trend: CurrentTrendRow) => unknown]> = [
    ['Başlık', trend => trend.title], ['Platform', trend => platformLabel(trend.platform)],
    ['Ülke', trend => trend.country], ['Dil', trend => trend.language],
    ['Kategori', trend => CATEGORIES[trend.category || '']?.label || trend.category],
    ['Tür', trend => KIND_LABELS[trend.kind] || trend.kind], ['Skor', trend => trend.score],
    ['Günlük büyüme (%)', trend => hasMeasuredVelocity(trend) ? Number((trend.velocity! * 100).toFixed(2)) : null],
    ['Hız ölçümü', trend => hasMeasuredVelocity(trend) ? 'Ölçüldü' : 'Yeterli doğrulanmış ölçüm yok'],
    ['Veri niteliği', trend => trend.inferred ? 'Çıkarım' : 'Kaynak kaydı'],
    ['Aşama', trend => STAGES[trend.stage || '']?.label || trend.stage],
    ['Görüntülenme', trend => trend.views], ['Beğeni', trend => trend.likes],
    ['İlk görülme (ISO)', trend => trend.first_seen], ['Son görülme (ISO)', trend => trend.last_seen],
    ['Kaynak', trend => trend.url],
  ]
  return '\uFEFF' + [fields.map(([label]) => csvCell(label)), ...trends.map(trend => fields.map(([, read]) => csvCell(read(trend))))]
    .map(row => row.join(',')).join('\r\n')
}
