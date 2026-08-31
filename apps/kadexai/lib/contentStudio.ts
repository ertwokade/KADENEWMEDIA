export interface ContentStudioPackage {
  title: string
  sourceSummary: string
  thread: string[]
  linkedIn: string
  newsletter: { subject: string; body: string }
  captions: { instagram: string; tiktok: string; youtube: string }
  summary: string[]
  quotes: string[]
  evidence: Array<{ claim: string; evidence: string }>
  raw?: string
}

function clean(value: unknown, max: number) {
  return String(value ?? '')
    .replace(/[\u0000-\u001f\u007f]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max)
}

function cleanLong(value: unknown, max: number) {
  return String(value ?? '')
    .replace(/\u0000/g, '')
    .trim()
    .slice(0, max)
}

function cleanList(value: unknown, limit: number, max: number) {
  return (Array.isArray(value) ? value : [])
    .map((item) => cleanLong(item, max))
    .filter(Boolean)
    .slice(0, limit)
}

export function sanitizeSourceUrl(value: unknown) {
  const raw = clean(value, 1000)
  if (!raw) return null
  try {
    const parsed = new URL(raw)
    return ['https:', 'http:'].includes(parsed.protocol) ? parsed.toString() : null
  } catch {
    return null
  }
}

export function sanitizeVoiceSamples(value: unknown) {
  return cleanList(value, 3, 4000).filter((sample) => sample.length >= 30)
}

export function voiceStrength(samples: string[]) {
  const characters = samples.reduce((total, sample) => total + sample.length, 0)
  return Math.min(100, Math.round(samples.length * 20 + Math.min(40, characters / 50)))
}

export function normalizeContentStudioPackage(value: unknown, fallbackTitle: string): ContentStudioPackage {
  const raw = value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {}
  const newsletter = raw.newsletter && typeof raw.newsletter === 'object' && !Array.isArray(raw.newsletter)
    ? raw.newsletter as Record<string, unknown>
    : {}
  const captions = raw.captions && typeof raw.captions === 'object' && !Array.isArray(raw.captions)
    ? raw.captions as Record<string, unknown>
    : {}
  const evidence = (Array.isArray(raw.evidence) ? raw.evidence : []).flatMap((item) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return []
    const row = item as Record<string, unknown>
    const claim = clean(row.claim, 400)
    const sourceEvidence = clean(row.evidence, 700)
    return claim && sourceEvidence ? [{ claim, evidence: sourceEvidence }] : []
  }).slice(0, 12)

  return {
    title: clean(raw.title, 180) || clean(fallbackTitle, 180) || 'İçerik paketi',
    sourceSummary: cleanLong(raw.sourceSummary, 1800),
    thread: cleanList(raw.thread, 12, 600),
    linkedIn: cleanLong(raw.linkedIn, 5000),
    newsletter: {
      subject: clean(newsletter.subject, 180),
      body: cleanLong(newsletter.body, 8000),
    },
    captions: {
      instagram: cleanLong(captions.instagram, 2200),
      tiktok: cleanLong(captions.tiktok, 2200),
      youtube: cleanLong(captions.youtube, 5000),
    },
    summary: cleanList(raw.summary, 8, 500),
    quotes: cleanList(raw.quotes, 8, 500),
    evidence,
    raw: typeof raw.raw === 'string' ? cleanLong(raw.raw, 12_000) : undefined,
  }
}

export const CONTENT_STUDIO_SYSTEM_PROMPT = `Sen KadexAI İçerik Stüdyosu'nun kıdemli editörüsün.
Bir kaynak metni, kullanıcının marka sesini koruyarak farklı yayın formatlarına dönüştürürsün.

ZORUNLU KURALLAR:
- Yalnızca kaynak metinde bulunan gerçeklere dayan. Kaynakta olmayan sayı, isim, alıntı, sonuç veya iddia üretme.
- Emin olmadığın bilgiyi ekleme. Kaynak yetersizse bunu sourceSummary içinde açıkça belirt.
- Alıntıları kelimesi kelimesine kaynaktan seç; uydurma alıntı yazma.
- Kullanıcının ses örneklerinden yalnız üslup öğren; örneklerdeki olguları yeni içeriğe taşıma.
- Çıktı dili kaynak ve ses örneklerinin baskın dili olsun.
- Yanıtın yalnızca geçerli JSON nesnesi olsun; markdown kod bloğu veya açıklama ekleme.`

export function buildContentStudioPrompt(input: {
  sourceTitle: string
  sourceUrl: string | null
  sourceText: string
  voiceSamples: string[]
}) {
  const samples = input.voiceSamples.length
    ? input.voiceSamples.map((sample, index) => `SES ÖRNEĞİ ${index + 1}:\n${sample}`).join('\n\n')
    : 'Ses örneği verilmedi. Doğal, açık ve profesyonel Türkçe kullan.'

  return `KAYNAK BAŞLIĞI: ${input.sourceTitle || 'Başlıksız kaynak'}
KAYNAK URL: ${input.sourceUrl || 'Yok'}

KAYNAK METİN / DÖKÜM:
${input.sourceText}

MARKA SESİ:
${samples}

Bu kaynaktan yayınlanabilir bir haftalık içerik paketi üret.
JSON ŞEMASI:
{
  "title": "paketin kısa başlığı",
  "sourceSummary": "kaynağın dürüst özeti ve varsa eksik bağlam",
  "thread": ["X/Threads gönderisi 1", "gönderi 2"],
  "linkedIn": "LinkedIn gönderisi",
  "newsletter": { "subject": "konu satırı", "body": "bülten metni" },
  "captions": {
    "instagram": "Instagram açıklaması ve en fazla 8 ilgili hashtag",
    "tiktok": "TikTok açıklaması ve en fazla 6 ilgili hashtag",
    "youtube": "YouTube açıklaması ve CTA"
  },
  "summary": ["özet madde 1", "özet madde 2"],
  "quotes": ["kaynaktan birebir alıntı 1", "kaynaktan birebir alıntı 2"],
  "evidence": [
    { "claim": "çıktılarda kullanılan önemli iddia", "evidence": "kaynakta bunu destekleyen kısa ifade" }
  ]
}`
}

export function formatContentPackageWhatsApp(
  content: ContentStudioPackage,
  dashboardUrl: string,
) {
  const caption = content.captions.instagram || content.captions.tiktok || content.linkedIn
  const lines = [
    '*KadexAI · Haftalık İçerik Paketi*',
    '',
    `*${clean(content.title, 120)}*`,
    content.sourceSummary ? clean(content.sourceSummary, 320) : '',
    '',
    ...content.summary.slice(0, 4).map((item) => `• ${clean(item, 220)}`),
    '',
    caption ? `*İlk paylaşım*\n${cleanLong(caption, 650)}` : '',
    '',
    `Tüm formatları aç: ${dashboardUrl}`,
  ].filter(Boolean)
  return lines.join('\n').slice(0, 1800)
}
