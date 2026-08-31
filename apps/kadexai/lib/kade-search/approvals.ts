import type { ContentIdea } from './ideas'

export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'published'

export interface ApprovalDraft {
  title: string
  hook: string
  caption: string
  hashtags: string[]
  visualBrief: string
  shotList: string[]
  cta: string
  platform: string
  sourceUrl: string | null
}

export interface ApprovalIdeaSnapshot {
  trendId: string
  baslik: string
  kategori: string
  kanca: string
  kurgu: string[]
  cta: string
  hashtagler: string[]
  paylasimSaati: string[]
  neden: string
  kaynak: {
    platform: string
    url: string | null
    skor: number
    asama: string
  }
  format: {
    label: string
    aciklama: string
  }
}

const STATUS = new Set<ApprovalStatus>(['pending', 'approved', 'rejected', 'published'])

function clean(value: unknown, max: number) {
  return String(value ?? '').replace(/[\u0000-\u001f\u007f]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max)
}

function cleanList(value: unknown, limit: number, max: number) {
  return (Array.isArray(value) ? value : []).map((item) => clean(item, max)).filter(Boolean).slice(0, limit)
}

function safeUrl(value: unknown) {
  const raw = clean(value, 1000)
  if (!raw) return null
  try {
    const url = new URL(raw)
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : null
  } catch {
    return null
  }
}

export function normalizeApprovalStatus(value: unknown): ApprovalStatus {
  const status = clean(value, 20) as ApprovalStatus
  return STATUS.has(status) ? status : 'pending'
}

export function sanitizeApprovalIdea(value: unknown): ApprovalIdeaSnapshot {
  const raw = value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {}
  const source = raw.kaynak && typeof raw.kaynak === 'object' && !Array.isArray(raw.kaynak)
    ? raw.kaynak as Record<string, unknown>
    : {}
  const format = raw.format && typeof raw.format === 'object' && !Array.isArray(raw.format)
    ? raw.format as Record<string, unknown>
    : {}

  return {
    trendId: clean(raw.trendId, 220),
    baslik: clean(raw.baslik, 180),
    kategori: clean(raw.kategori, 80),
    kanca: clean(raw.kanca, 320),
    kurgu: cleanList(raw.kurgu, 8, 220),
    cta: clean(raw.cta, 220),
    hashtagler: cleanList(raw.hashtagler, 20, 60),
    paylasimSaati: cleanList(raw.paylasimSaati, 8, 40),
    neden: clean(raw.neden, 500),
    kaynak: {
      platform: clean(source.platform, 60),
      url: safeUrl(source.url),
      skor: Math.max(0, Math.min(100, Number(source.skor) || 0)),
      asama: clean(source.asama, 80),
    },
    format: {
      label: clean(format.label, 80),
      aciklama: clean(format.aciklama, 240),
    },
  }
}

export function buildApprovalDraft(value: ApprovalIdeaSnapshot | ContentIdea): ApprovalDraft {
  const idea = sanitizeApprovalIdea(value)
  const hashtags = idea.hashtagler.map((tag) => tag.startsWith('#') ? tag : `#${tag}`)
  const story = idea.kurgu.length
    ? idea.kurgu
    : ['0-2 sn: Sonucu göster', '2-15 sn: Ana fikri anlat', '15-25 sn: Örneği göster', '25-30 sn: CTA']
  const captionParts = [idea.kanca, idea.neden, idea.cta].filter(Boolean)

  return {
    title: idea.baslik,
    hook: idea.kanca,
    caption: captionParts.join('\n\n').slice(0, 1800),
    hashtags,
    visualBrief: [
      `${idea.kaynak.platform || 'Sosyal medya'} için ${idea.format.label || 'kısa video'} formatı.`,
      idea.format.aciklama,
      'Kade New Media marka renkleri, temiz tipografi ve ilk iki saniyede okunur ana vaat.',
    ].filter(Boolean).join(' '),
    shotList: story,
    cta: idea.cta,
    platform: idea.kaynak.platform,
    sourceUrl: idea.kaynak.url,
  }
}

export function formatApprovalWhatsApp(
  ideaValue: ApprovalIdeaSnapshot | ContentIdea,
  draftValue: ApprovalDraft,
  dashboardUrl: string,
) {
  const idea = sanitizeApprovalIdea(ideaValue)
  const fallbackDraft = buildApprovalDraft(idea)
  const lines = [
    '*KadexAI · Onaylı İçerik Paketi*',
    '',
    `*${clean(draftValue.title || idea.baslik, 120)}*`,
    `${idea.kaynak.platform || draftValue.platform || fallbackDraft.platform} · ${idea.kategori || 'Genel'}`,
    '',
    `Kanca: ${clean(draftValue.hook || idea.kanca, 260)}`,
    `CTA: ${clean(draftValue.cta || idea.cta, 180)}`,
    `Hashtag: ${(draftValue.hashtags?.length ? draftValue.hashtags : fallbackDraft.hashtags).slice(0, 10).join(' ')}`,
    '',
    `Görsel brief: ${clean(draftValue.visualBrief || fallbackDraft.visualBrief, 360)}`,
  ]
  if (idea.kaynak.url) lines.push(`Kaynak: ${idea.kaynak.url}`)
  lines.push(`Düzenle / yayınlandı işaretle: ${dashboardUrl}`)
  return lines.join('\n').slice(0, 1800)
}
