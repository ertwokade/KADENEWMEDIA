import type { TrendFilters } from './types'

export function boundedNumber(value: string | null, fallback: number, min: number, max: number) {
  if (value == null || !value.trim()) return fallback
  const number = Number(value)
  return Number.isFinite(number) ? Math.min(max, Math.max(min, Math.floor(number))) : fallback
}

export function trendFiltersFromParams(params: URLSearchParams, defaultCountry?: string): TrendFilters {
  const text = (key: string) => params.get(key)?.trim().slice(0, 200) || undefined
  const requestedSort = text('sort')
  const sort = ['score', 'velocity', 'views', 'new', 'title'].includes(requestedSort || '') ? requestedSort as TrendFilters['sort'] : 'score'
  return {
    platform: text('platform'), kind: text('kind'), category: text('category'),
    // Explicit "all" must not silently become the default country.
    country: text('country') ?? defaultCountry, language: text('language'),
    stage: text('stage'), format: text('format'), q: text('q'), sort,
    limit: boundedNumber(params.get('limit'), 50, 1, 300),
    offset: boundedNumber(params.get('offset'), 0, 0, 100_000),
    minScore: params.has('minScore') ? boundedNumber(params.get('minScore'), 0, 0, 100) : undefined,
    sinceHours: params.has('since') ? boundedNumber(params.get('since'), 168, 1, 8760) : undefined,
  }
}
