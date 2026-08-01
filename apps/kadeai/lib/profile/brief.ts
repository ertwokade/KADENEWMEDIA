import { AccountContextValue, normalizeAccountContext } from '@/lib/profile/types'

export const MAX_COMPANY_BRIEF_LENGTH = 12_000
export const SAMPLE_COMPANY_BRIEF_DOWNLOADS = [
  { label: 'Word', path: '/downloads/kadeai-sirket-briefi-ornek.docx' },
  { label: 'PDF', path: '/downloads/kadeai-sirket-briefi-ornek.pdf' },
] as const

export interface CompanyBriefImportResult {
  account: AccountContextValue
  importedFields: string[]
}

type BriefValues = Record<string, string>

const FIELD_ALIASES: Record<string, string[]> = {
  brandName: ['marka adı', 'marka adi', 'şirket adı', 'sirket adi', 'brand name'],
  website: ['web sitesi', 'website', 'site'],
  niche: ['sektör / niş', 'sektor / nis', 'sektör', 'sektor', 'niş', 'nis', 'industry'],
  audience: ['hedef kitle', 'müşteri profili', 'musteri profili', 'target audience'],
  voice: ['marka tonu', 'marka dili', 'brand voice', 'tone of voice'],
  products: ['ürün ve hizmetler', 'urun ve hizmetler', 'ürün / hizmetler', 'urun / hizmetler', 'products', 'services'],
  contentGoals: ['içerik hedefleri', 'icerik hedefleri', 'hedefler', 'content goals'],
  keywords: ['anahtar kelimeler', 'keywords'],
  forbiddenWords: ['kaçınılacak kelimeler', 'kacinilacak kelimeler', 'yasaklı kelimeler', 'yasakli kelimeler', 'forbidden words'],
  competitors: ['rakipler', 'competitors'],
  platforms: ['tercih edilen platformlar', 'platformlar', 'preferred platforms'],
  tone: ['varsayılan içerik tonu', 'varsayilan icerik tonu', 'içerik tonu', 'icerik tonu', 'default tone'],
  language: ['dil', 'içerik dili', 'icerik dili', 'language'],
}

const FIELD_LABELS: Record<string, string> = {
  brandName: 'Marka adı',
  website: 'Web sitesi',
  niche: 'Sektör / niş',
  audience: 'Hedef kitle',
  voice: 'Marka tonu',
  products: 'Ürün ve hizmetler',
  contentGoals: 'İçerik hedefleri',
  keywords: 'Anahtar kelimeler',
  forbiddenWords: 'Kaçınılacak kelimeler',
  competitors: 'Rakipler',
  platforms: 'Platformlar',
  tone: 'Varsayılan ton',
  language: 'Dil',
}

function normalizeHeading(value: string) {
  return value
    .toLocaleLowerCase('tr-TR')
    .replace(/[*_`:#]/g, '')
    .replace(/[–—-]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function canonicalField(heading: string) {
  const normalized = normalizeHeading(heading)
  return Object.entries(FIELD_ALIASES).find(([, aliases]) =>
    aliases.some((alias) => normalizeHeading(alias) === normalized)
  )?.[0]
}

function cleanText(value: string) {
  return value
    .replace(/^\s*[-*]\s+/gm, '')
    .replace(/\r/g, '')
    .trim()
}

function list(value: string) {
  return value
    .split(/\n|,|;/)
    .map((item) => item.replace(/^\s*[-*•\d.)]+\s*/, '').trim())
    .filter(Boolean)
    .slice(0, 30)
}

function parseMarkdown(text: string): BriefValues {
  const values: BriefValues = {}
  let currentField: string | undefined

  for (const line of text.split(/\r?\n/)) {
    const heading = line.match(/^\s{0,3}#{1,6}\s+(.+?)\s*$/)
    if (heading) {
      currentField = canonicalField(heading[1])
      continue
    }

    const inline = line.match(/^\s*(?:[-*]\s*)?(?:\*\*)?([^:]{2,60})(?:\*\*)?\s*:\s*(.+?)\s*$/)
    const inlineField = inline ? canonicalField(inline[1]) : undefined
    if (inline && inlineField) {
      values[inlineField] = cleanText(inline[2])
      currentField = undefined
      continue
    }

    if (currentField && line.trim()) {
      values[currentField] = `${values[currentField] || ''}\n${line}`.trim()
    }
  }

  return values
}

function parseJson(text: string): BriefValues | null {
  try {
    const parsed = JSON.parse(text) as Record<string, unknown>
    const source = parsed.brand && typeof parsed.brand === 'object'
      ? { ...parsed, ...(parsed.brand as Record<string, unknown>) }
      : parsed
    const values: BriefValues = {}

    for (const [key, value] of Object.entries(source)) {
      const field = canonicalField(key) || Object.keys(FIELD_ALIASES).find((candidate) => candidate === key)
      if (!field || value == null) continue
      values[field] = Array.isArray(value) ? value.join('\n') : String(value)
    }
    return values
  } catch {
    return null
  }
}

function languageCode(value: string) {
  const normalized = normalizeHeading(value)
  if (normalized.startsWith('türk') || normalized === 'tr') return 'tr'
  if (normalized.startsWith('ing') || normalized.startsWith('engl') || normalized === 'en') return 'en'
  return cleanText(value).slice(0, 16)
}

export function applyCompanyBriefText(
  current: AccountContextValue,
  input: string
): CompanyBriefImportResult {
  const raw = input.replace(/\u0000/g, '').trim().slice(0, MAX_COMPANY_BRIEF_LENGTH)
  const values = (raw.startsWith('{') ? parseJson(raw) : null) || parseMarkdown(raw)
  const next = normalizeAccountContext(current)
  const importedFields: string[] = []

  next.brand.description = raw

  const assignText = (
    field: keyof Pick<AccountContextValue['brand'], 'name' | 'website' | 'niche' | 'audience' | 'voice'>,
    source: string
  ) => {
    if (!values[source]) return
    next.brand[field] = cleanText(values[source])
    importedFields.push(FIELD_LABELS[source])
  }
  const assignList = (
    field: keyof Pick<AccountContextValue['brand'], 'products' | 'contentGoals' | 'keywords' | 'forbiddenWords' | 'competitors'>,
    source: string
  ) => {
    if (!values[source]) return
    next.brand[field] = list(values[source])
    importedFields.push(FIELD_LABELS[source])
  }

  assignText('name', 'brandName')
  assignText('website', 'website')
  assignText('niche', 'niche')
  assignText('audience', 'audience')
  assignText('voice', 'voice')
  assignList('products', 'products')
  assignList('contentGoals', 'contentGoals')
  assignList('keywords', 'keywords')
  assignList('forbiddenWords', 'forbiddenWords')
  assignList('competitors', 'competitors')

  if (values.platforms) {
    const platforms = list(values.platforms)
    next.brand.preferredPlatforms = platforms
    next.preferences.platforms = platforms
    importedFields.push(FIELD_LABELS.platforms)
  }
  if (values.tone) {
    next.preferences.tone = cleanText(values.tone)
    importedFields.push(FIELD_LABELS.tone)
  }
  if (values.language) {
    const language = languageCode(values.language)
    next.brand.language = language
    next.preferences.language = language
    importedFields.push(FIELD_LABELS.language)
  }

  return {
    account: next,
    importedFields: [...new Set(importedFields)],
  }
}
