import 'server-only'

/**
 * Icerik fikri ureteci.
 * Yuksek skorlu trendleri alir, kategori + format kaliplariyla birlestirip
 * cekime hazir brief uretir: kanca, kurgu iskeleti, hashtag seti, ses onerisi.
 *
 * Ölçülmüş trend verisi önce güvenli bir taslağa dönüşür; ardından küçük,
 * paralel AI grupları kanca, kurgu ve CTA'yı trende özel hâle getirir. Sağlayıcı
 * çalışmazsa kullanıcı boş kalmaz, doğrulanmış taslak döner.
 */
import { createClient } from '@/lib/supabase/server'
import { generateContent } from '@/lib/ai/provider'
import { parseStructuredOutput } from '@/lib/ai/structured'
import { normalizeGeneratedHashtags } from '@/lib/ai/hashtags'
import { normalizeIdeaOutput, runInBatches } from './ideaOutput'
import { structureFor } from './structures'
import { hasMeasuredVelocity } from './export'
import { CATEGORIES, FORMATS, STAGES, platformLabel } from './taxonomy'
import { extractHashtags, fmtCount, normalizeText } from './util'
import { queryTrends } from './store'
import { ayiklanmisTrendler } from './relevance'
import type { CurrentTrendRow, TrendFilters } from './types'

const HOOKS: Record<string, string[]> = {
  pov: ['POV: {konu} ile ilk kez karşılaşıyorsun', '{konu} yaşayan herkesin bildiği o an', 'POV: {konu} sana denk geldi'],
  ogretici: ['{konu} 30 saniyede: kimse böyle anlatmadı', '{konu} için 3 adım — 3. adımı kimse yapmıyor', 'Bunu bilseydim {konu} yıllar önce çözülürdü'],
  liste: ['{konu} hakkında 5 şey — sonuncusu şaşırtıyor', '{konu} için en iyi 3 seçim', 'Kimsenin söylemediği 4 {konu} detayı'],
  hikaye: ['{konu} yüzünden başıma gelenler', '{konu} ile ilgili itiraf ediyorum', 'Bu {konu} hikayesi hâlâ inanılmaz'],
  challenge: ['{konu} akımını denedim, sonuç beklenmedik', '7 gün boyunca {konu} yaptım', '{konu} challenge — kim daha iyi?'],
  test: ['{konu} gerçekten çalışıyor mu? Test ettim', 'Viral olan {konu} yöntemini denedim', '{konu} iddiasını kanıtladım'],
  onceSonra: ['{konu} öncesi vs sonrası — fark inanılmaz', '{konu} ile 30 günde değişim', 'Önce/sonra: {konu}'],
  tartisma: ['{konu} hakkında popüler olmayan görüşüm', 'Herkes {konu} konusunda yanılıyor', '{konu} abartılıyor mu?'],
  soru: ['{konu} neden herkesin dilinde?', '{konu} hakkında bunu biliyor muydunuz?', '{konu} sırrı nedir?'],
  edit: ['{konu} temalı hızlı kurgu', '{konu} anlarının en iyileri', '{konu} — ritim kurgusu'],
  gecis: ['{konu} geçişi: 3 saniyede dönüşüm', 'Müzik düştüğünde {konu}'],
  vlog: ['{konu} ile geçen bir günüm', '{konu} rutinim'],
  roportaj: ['Sokakta sorduk: {konu}', 'İnsanlara {konu} sordum, cevaplar şaşırttı'],
  duet: ['{konu} videosuna cevabım', '{konu} tepkisi'],
  asmr: ['{konu} ASMR — kulaklıkla izle', 'Tatmin edici {konu} anları'],
  unboxing: ['{konu} kutu açılımı — beklentiyi karşıladı mı?', '{konu} alışverişim'],
  skec: ['{konu} olsaydı nasıl olurdu', '{konu} tipleri — hangisisin?'],
  mikroDram: ['{konu} — Bölüm 1', '{konu} serisi başlıyor'],
  greenScreen: ['{konu} olayını anlatıyorum', '{konu} neden bu kadar konuşuluyor'],
  behindScenes: ['{konu} kamera arkası', '{konu} nasıl hazırlanıyor'],
}

/** Trend turune gore mantikli format havuzu (bir sarkiya "test ettim" formati uymaz). */
const FORMATS_BY_KIND: Record<string, string[]> = {
  sound: ['edit', 'gecis', 'challenge', 'skec', 'pov', 'onceSonra'],
  hashtag: ['challenge', 'pov', 'liste', 'ogretici', 'hikaye'],
  creator: ['duet', 'tartisma', 'liste', 'roportaj'],
  topic: ['greenScreen', 'liste', 'tartisma', 'ogretici', 'soru'],
  keyword: ['greenScreen', 'ogretici', 'liste', 'soru'],
  video: ['ogretici', 'liste', 'pov', 'hikaye', 'test', 'tartisma'],
}

const SOUND_HOOKS = [
  '{konu} sesiyle çekilebilecek 3 sahne',
  '{konu} çalarken yapılacak en iyi geçiş',
  'Bu ses ({konu}) her yerde — işte farklı bir kullanım',
  '{konu} akımına kendi versiyonum',
]

const CTA = [
  'Kaydet, sonra lazım olacak',
  'Sence hangisi daha iyi? Yoruma yaz',
  'Bunu deneyen var mı? Etiketle',
  'Bölüm 2 gelsin mi?',
  'Katılmıyorsan yorumda tartışalım',
  'Profildeki serinin devamı var',
]

const POST_TIMES: Record<string, string[]> = {
  tiktok: ['12:00-14:00', '18:00-21:00', '21:00-23:00'],
  instagram: ['11:00-13:00', '19:00-21:00'],
  youtube_shorts: ['13:00-15:00', '20:00-22:00'],
  youtube: ['17:00-19:00', '20:00-22:00'],
}

function pick<T>(arr: T[], seed = 0): T | null {
  if (!arr?.length) return null
  return arr[Math.abs(seed) % arr.length]
}

function seedOf(s: string) {
  let h = 0
  for (const ch of String(s)) h = (h * 31 + ch.charCodeAt(0)) | 0
  return h
}

function difficultyOf(stage: string | null) {
  const map: Record<string, { level: string; note: string }> = {
    emerging: { level: 'Düşük', note: 'Rekabet az, ilk girenlerden olabilirsin' },
    rising: { level: 'Orta', note: 'Alan hâlâ açık, hızlı hareket et' },
    peak: { level: 'Yüksek', note: 'Çok içerik var — farklılaşmak şart' },
    plateau: { level: 'Yüksek', note: 'Doygun; yeni bir açı bulmadan girme' },
    declining: { level: 'Çok yüksek', note: 'Geç kalındı, sadece niş açı işe yarar' },
    dead: { level: 'Önerilmez', note: 'Trend bitmiş' },
  }
  return map[stage ?? 'rising'] ?? map.rising
}

export interface ContentIdea {
  uretim: 'ai' | 'sablon'
  trendId: string
  baslik: string
  kaynak: { platform: string; tur: string; url: string | null; skor: number; asama: string; hacim: string }
  kategori: string
  format: { anahtar: string; label: string; aciklama: string }
  kanca: string
  alternatifKancalar: string[]
  kurgu: string[]
  cta: string
  hashtagler: string[]
  sesOnerisi: { title: string; author: string | null; url: string | null; platform: string } | null
  alternatifFormatlar: string[]
  zorluk: { level: string; note: string }
  paylasimSaati: string[]
  neden: string
}

// Başlık kelimelerinden etiket türetirken bağlaç ve dolgu kelimeleri atlanır
// (#gibi, #olan, #the gibi etiketler aranmaz ve konuyu anlatmaz).
const TAG_STOPWORDS = new Set([
  've', 'ile', 'icin', 'gibi', 'olan', 'olarak', 'bir', 'bu', 'su', 'da', 'de', 'mi', 'mu', 'ne', 'nasil', 'neden',
  'cok', 'daha', 'en', 'her', 'hic', 'ama', 'veya', 'ise', 'kadar', 'sonra', 'once', 'bile', 'diye', 'yeni', 'ben', 'sen',
  'biz', 'siz', 'onlar', 'benim', 'senin', 'bunu', 'sunu', 'yok', 'var', 'oldu', 'olur', 'yapan', 'yapti', 'bolum',
  'the', 'and', 'for', 'with', 'you', 'your', 'this', 'that', 'what', 'how', 'why', 'are', 'was', 'from', 'shorts', 'short',
  'video', 'official', 'part', 'new', 'vs', 'amp',
])

function hashtag(value: unknown) {
  const clean = normalizeText(normalizeGeneratedHashtags(`#${String(value ?? '').replace(/^#/, '')}`).slice(1))
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 4)
    .join('')
    .slice(0, 32)
  return clean.length >= 2 ? `#${clean}` : ''
}

// Sağlayıcı katmanı her isteği 25 sn'de keser; 4 fikirlik JSON üretimi bu süreyi
// aşıyordu. İki fikirlik gruplar süre sınırının rahat altında kalır.
const PERSONALIZE_BATCH = 2

async function personalizeBatch(batch: ContentIdea[], request?: Request) {
  // Uzun UUID'ler modelde bozulabiliyordu; her fikir kısa, sıralı bir anahtarla gider.
  const byKey = new Map(batch.map((idea, index) => [`t${index + 1}`, idea]))
  const input = [...byKey].map(([key, idea]) => ({
    trendId: key,
    baslik: idea.baslik.replace(/^\S+\s/, ''),
    platform: idea.kaynak.platform,
    kategori: idea.kategori,
    asama: idea.kaynak.asama,
    hacim: idea.kaynak.hacim,
    format: idea.format.label,
  }))
  const result = await generateContent({
    model: 'auto',
    toolId: 'trend-radar',
    maxTokens: 1800,
    systemPrompt: `Sen Türkiye'deki içerik üreticileri için çalışan kıdemli kısa video stratejistisin.
Her trend için birbirinden farklı, doğrudan çekilebilir bir fikir üret. Başlığı bir kalıba yapıştırma.
Başlık yabancı dilde olsa bile konusunu Türk izleyiciye uyarlayan özgün bir açı bul; her trendId için mutlaka bir fikir döndür.
Hashtagleri yalnız konu ve içerikle doğrudan ilgili, küçük harfli ASCII biçiminde yaz.
Paylaşım saati ve CTA'yı platforma ve fikre göre seç. Saatler Europe/Istanbul saat diliminde öneridir; hesap analitiği veya ölçülmüş en iyi saat değildir.
Kaynakta olmayan deneyim, sayı veya başarı iddiası uydurma. Yanıt yalnızca geçerli JSON olsun.`,
    prompt: `Aşağıdaki ölçülmüş trendleri içerik briefine dönüştür. trendId değerlerini aynen geri yaz:
${JSON.stringify(input)}

JSON şeması:
{"ideas":[{"trendId":"t1","kanca":"","alternatifKancalar":["",""],"kurgu":["0-3 sn: ...","3-10 sn: ...","10-30 sn: ..."],"cta":"","hashtagler":["#etiket"],"zorluk":{"level":"Düşük|Orta|Yüksek|Çok yüksek","note":""},"paylasimSaati":["19:00-21:00"],"neden":"Bu fikrin bu trende neden uyduğunu tek cümlede açıkla"}]}`,
  }, request)
  const parsed = parseStructuredOutput(result.content)
  if (!Array.isArray(parsed.ideas)) throw new Error('invalid-output')
  for (const raw of parsed.ideas) {
    const item = normalizeIdeaOutput(raw)
    if (!item) continue
    const current = byKey.get(item.trendId)
    if (!current) continue
    current.kanca = item.kanca
    current.kurgu = item.kurgu
    current.cta = item.cta
    current.uretim = 'ai'
    if (item.alternatifKancalar.length) current.alternatifKancalar = item.alternatifKancalar
    if (item.hashtagler.length) current.hashtagler = item.hashtagler
    if (item.zorluk) current.zorluk = item.zorluk
    if (item.paylasimSaati.length) current.paylasimSaati = item.paylasimSaati
    if (item.neden) current.neden = item.neden
  }
}

export interface PersonalizationSummary {
  toplam: number
  ai: number
  sablon: number
  hatalar: Record<'zaman_asimi' | 'gecersiz_cikti' | 'saglayici', number>
}

export async function personalizeIdeas(ideas: ContentIdea[], request?: Request) {
  // Bir grubun hatası diğer grupların AI çıktısını kaybettirmez; başarısız
  // gruptaki fikirler açıkça "hazır şablon" olarak kalır.
  const results = await runInBatches(ideas, PERSONALIZE_BATCH, (batch) => personalizeBatch(batch, request))
  const hatalar = { zaman_asimi: 0, gecersiz_cikti: 0, saglayici: 0 }
  for (const result of results) {
    if (result.status === 'fulfilled') continue
    const message = result.reason instanceof Error ? result.reason.message : ''
    if (/invalid-output/.test(message)) hatalar.gecersiz_cikti++
    else if (/yanıt vermedi|timeout|timed out|abort/i.test(message)) hatalar.zaman_asimi++
    else hatalar.saglayici++
  }
  const ai = ideas.filter((idea) => idea.uretim === 'ai').length
  const ozet: PersonalizationSummary = { toplam: ideas.length, ai, sablon: ideas.length - ai, hatalar }
  return { ideas, ozet }
}

/**
 * Icerik fikirleri uretir.
 * Hashtag ve ses onerileri icin kategori bazli en yuksek skorlu gercek kayitlar
 * kullanilir; bu yuzden tek seferde toplu cekilir (fikir basina sorgu acilmaz).
 */
export async function generateIdeas(
  opts: TrendFilters & { format?: string } = {},
  request?: Request,
): Promise<{ ideas: ContentIdea[]; ozet: PersonalizationSummary | null }> {
  const supabase = await createClient()
  const queriedTrends = ayiklanmisTrendler(await queryTrends({
    // Eski yanlış dil etiketli kayıtlar ayıklanınca istenen sayıya ulaşmak
    // için daha geniş bir aday havuzu oku; kullanıcıya yine yalnız limiti dön.
    limit: Math.min((opts.limit ?? 15) * 4, 100),
    category: opts.category,
    platform: opts.platform,
    kind: opts.kind,
    q: opts.q,
    country: opts.country,
    language: opts.language,
    stage: opts.stage,
    minScore: opts.minScore ?? 0,
    sort: opts.sort ?? 'score',
    sinceHours: opts.sinceHours ?? 24 * 14,
  }))
  // Dil filtresi veritabanı sorgusunda uygulanır. Başlığı ikinci kez sezgisel
  // bir Türkçe filtreden geçirmek, doğru dil meta verisi taşıyan kayıtları eliyordu.
  const trends = queriedTrends.slice(0, opts.limit ?? 15)
  if (!trends.length) return { ideas: [], ozet: null }

  const categories = [...new Set(trends.map((t) => t.category).filter((c): c is string => Boolean(c)))]

  // Kategori -> populer hashtag'ler
  const hashtagsByCategory = new Map<string, string[]>()

  if (categories.length) {
    const { data: tagRows } = await supabase
      .from('kade_trend_current')
      .select('title, category, score')
      .eq('kind', 'hashtag')
      .in('category', categories)
      .order('score', { ascending: false, nullsFirst: false })
      .limit(200)
    for (const row of tagRows ?? []) {
      if (!row.category) continue
      const list = hashtagsByCategory.get(row.category) ?? []
      if (list.length < 6) list.push(String(row.title).replace(/^#/, ''))
      hashtagsByCategory.set(row.category, list)
    }

  }

  const suggestHashtags = (t: CurrentTrendRow) => {
    const tags = new Set<string>()
    for (const found of extractHashtags(t.title)) tags.add(found)
    const words = normalizeText(t.title)
      .split(/[^a-z0-9]+/)
      .filter((word) => word.length >= 3 && word.length <= 18 && !/^\d+$/.test(word) && !TAG_STOPWORDS.has(word))
    for (const word of words.slice(0, 3)) tags.add(word)
    const categoryTags = hashtagsByCategory.get(t.category ?? '') ?? []
    for (const tag of categoryTags) {
      if (words.some((word) => normalizeText(tag).includes(word))) tags.add(tag)
    }
    return [...tags].map(hashtag).filter(Boolean).slice(0, 10)
  }

  const ideas: ContentIdea[] = trends.map((t, i) => {
    const seed = seedOf(t.id) + i
    const cat = (t.category ? CATEGORIES[t.category] : undefined) ?? CATEGORIES.diger
    // Muzik kategorisindeki her sey (klip videosu dahil) ses mantigiyla ele alinir
    const musicLike = t.kind === 'sound' || t.category === 'muzik'
    const kindPool = musicLike ? FORMATS_BY_KIND.sound : FORMATS_BY_KIND[t.kind] ?? FORMATS_BY_KIND.video
    const detected =
      (t.formats ?? []).find((f) => kindPool.includes(f)) ??
      (t.kind === 'video' && !musicLike ? t.formats?.[0] : null)
    const preferredFormat = opts.format ?? detected ?? pick(kindPool, seed) ?? 'ogretici'
    const fmtDef = FORMATS[preferredFormat] ?? FORMATS.ogretici
    const konu = t.kind === 'hashtag' ? t.title.replace(/^#/, '') : t.title
    const hookPool = musicLike ? SOUND_HOOKS : HOOKS[preferredFormat] ?? HOOKS.ogretici
    const hookTemplate = pick(hookPool, seed) ?? hookPool[0]
    const stage = STAGES[t.stage ?? 'rising'] ?? STAGES.rising
    const alt = Object.keys(FORMATS)
      .filter((f) => f !== preferredFormat)
      .slice(Math.abs(seed) % 3, (Math.abs(seed) % 3) + 2)

    return {
      uretim: 'sablon',
      trendId: t.id,
      baslik: `${cat.emoji} ${konu}`,
      kaynak: {
        platform: platformLabel(t.platform),
        tur: t.kind,
        url: t.url,
        skor: t.score ?? 0,
        asama: `${stage.emoji} ${stage.label}`,
        hacim: fmtCount(t.views || t.posts || 0),
      },
      kategori: cat.label,
      format: { anahtar: preferredFormat, label: fmtDef.label, aciklama: fmtDef.desc },
      kanca: hookTemplate.replace(/\{konu\}/g, konu),
      alternatifKancalar: hookPool
        .filter((h) => h !== hookTemplate)
        .slice(0, 2)
        .map((h) => h.replace(/\{konu\}/g, konu)),
      kurgu: structureFor(preferredFormat, konu, (t.duration_sec ?? 0) > 60),
      cta: pick(CTA, seed + 3) ?? CTA[0],
      hashtagler: suggestHashtags(t),
      sesOnerisi: t.kind === 'sound' ? {
        title: t.title,
        author: t.author,
        url: t.url,
        platform: platformLabel(t.platform),
      } : null,
      alternatifFormatlar: alt.map((f) => FORMATS[f]?.label).filter(Boolean),
      zorluk: hasMeasuredVelocity(t) ? difficultyOf(t.stage) : { level: 'Belirsiz', note: 'Yeterli ölçüm yok; rekabet düzeyi doğrulanamadı.' },
      paylasimSaati: POST_TIMES[t.platform] ?? POST_TIMES.tiktok,
      neden: `${hasMeasuredVelocity(t) ? `${stage.desc}. ` : ''}${hasMeasuredVelocity(t) ? `Günlük büyüme ~%${Math.round((t.velocity ?? 0) * 100)}.` : 'Hız için en az 30 dakika aralıklı, karşılaştırılabilir ölçümler gerekli.'} ${
        t.link_count ? `${t.link_count} platformda karşılığı var.` : ''
      }`.trim(),
    }
  })
  return personalizeIdeas(ideas, request)
}

/** Kategori bazli hizli ozet: her kategoride su an ne calisiyor. */
export async function categoryPulse(limit = 5) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('kade_trend_current')
    .select('id, title, platform, kind, url, score, stage, views, posts, category')
    .gte('last_seen', new Date(Date.now() - 7 * 86400e3).toISOString())
    .order('score', { ascending: false, nullsFirst: false })
    .limit(1200)
  if (error) throw new Error('Kategori özeti alınamadı.')

  const byCategory = new Map<string, typeof data>()
  for (const row of data ?? []) {
    const key = row.category ?? 'diger'
    const list = byCategory.get(key) ?? []
    if (list.length < limit) list.push(row)
    byCategory.set(key, list)
  }

  return [...byCategory.entries()]
    .map(([key, rows]) => {
      const def = CATEGORIES[key] ?? CATEGORIES.diger
      const list = rows ?? []
      return {
        kategori: key,
        label: def.label,
        emoji: def.emoji,
        ortalamaSkor: Number((list.reduce((s, r) => s + (r.score ?? 0), 0) / Math.max(list.length, 1)).toFixed(1)),
        trendler: list,
      }
    })
    .sort((a, b) => b.ortalamaSkor - a.ortalamaSkor)
}
