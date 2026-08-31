import 'server-only'

/**
 * Icerik fikri ureteci.
 * Yuksek skorlu trendleri alir, kategori + format kaliplariyla birlestirip
 * cekime hazir brief uretir: kanca, kurgu iskeleti, hashtag seti, ses onerisi.
 *
 * Yapay zeka cagrisi YOKTUR: ciktinin tamami olculmus trend verisinden ve
 * taksonomiden turer, bu yuzden hizli ve tekrarlanabilirdir.
 */
import { createClient } from '@/lib/supabase/server'
import { CATEGORIES, FORMATS, STAGES, platformLabel } from './taxonomy'
import { fmtCount, normalizeText } from './util'
import { queryTrends } from './store'
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

const STRUCTURES = {
  kisa: [
    '0-2 sn: Kanca (metin + hareket aynı anda)',
    '2-6 sn: Vaadi netleştir (ne öğrenecek/görecek)',
    '6-20 sn: Ana içerik, her 3 saniyede görsel değişim',
    '20-27 sn: Doruk nokta / sonuç',
    '27-30 sn: CTA — "kaydet" veya "yorumda söyle"',
  ],
  orta: [
    '0-3 sn: Kanca + soru',
    '3-10 sn: Bağlam ve neden önemli',
    '10-40 sn: 3 bölümlü ana anlatım',
    '40-55 sn: Özet + sürpriz detay',
    '55-60 sn: CTA + seriye bağlama',
  ],
}

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

/**
 * Icerik fikirleri uretir.
 * Hashtag ve ses onerileri icin kategori bazli en yuksek skorlu gercek kayitlar
 * kullanilir; bu yuzden tek seferde toplu cekilir (fikir basina sorgu acilmaz).
 */
export async function generateIdeas(
  opts: TrendFilters & { format?: string } = {}
): Promise<ContentIdea[]> {
  const supabase = await createClient()
  const trends = await queryTrends({
    limit: opts.limit ?? 15,
    category: opts.category,
    platform: opts.platform,
    stage: opts.stage,
    minScore: opts.minScore ?? 0,
    sort: opts.sort ?? 'score',
    sinceHours: opts.sinceHours ?? 24 * 14,
  })
  if (!trends.length) return []

  const categories = [...new Set(trends.map((t) => t.category).filter((c): c is string => Boolean(c)))]

  // Kategori -> populer hashtag'ler
  const hashtagsByCategory = new Map<string, string[]>()
  const soundByCategory = new Map<string, { title: string; author: string | null; url: string | null; platform: string }>()

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

    const { data: soundRows } = await supabase
      .from('kade_trend_current')
      .select('title, author, url, platform, category, score')
      .eq('kind', 'sound')
      .in('category', categories)
      .order('score', { ascending: false, nullsFirst: false })
      .limit(200)
    for (const row of soundRows ?? []) {
      if (!row.category || soundByCategory.has(row.category)) continue
      soundByCategory.set(row.category, {
        title: row.title,
        author: row.author,
        url: row.url,
        platform: platformLabel(row.platform),
      })
    }
  }

  const suggestHashtags = (t: CurrentTrendRow) => {
    const tags = new Set<string>()
    const base = normalizeText(t.title).replace(/[^a-z0-9]/g, '')
    if (t.kind === 'hashtag') tags.add(t.title.replace(/^#/, ''))
    else if (base.length > 2 && base.length < 25) tags.add(base)

    const cat = t.category ? CATEGORIES[t.category] : undefined
    if (cat) {
      for (const kw of cat.keywords.slice(0, 4)) {
        const tag = normalizeText(kw).replace(/[^a-z0-9]/g, '')
        if (tag.length > 2 && tag.length < 20) tags.add(tag)
      }
    }
    for (const tag of hashtagsByCategory.get(t.category ?? '') ?? []) tags.add(tag)
    for (const tag of ['kesfet', 'fyp', 'trend', 'viral']) tags.add(tag)
    return [...tags].slice(0, 12).map((tag) => `#${tag}`)
  }

  return trends.map((t, i) => {
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
      .slice(seed % 3, (seed % 3) + 2)

    return {
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
      kurgu: (t.duration_sec ?? 0) > 60 ? STRUCTURES.orta : STRUCTURES.kisa,
      cta: pick(CTA, seed + 3) ?? CTA[0],
      hashtagler: suggestHashtags(t),
      sesOnerisi: soundByCategory.get(t.category ?? '') ?? null,
      alternatifFormatlar: alt.map((f) => FORMATS[f]?.label).filter(Boolean),
      zorluk: difficultyOf(t.stage),
      paylasimSaati: POST_TIMES[t.platform] ?? POST_TIMES.tiktok,
      neden: `${stage.desc}. ${t.velocity != null ? `Günlük büyüme ~%${Math.round(t.velocity * 100)}.` : ''} ${
        t.link_count ? `${t.link_count} platformda karşılığı var.` : ''
      }`.trim(),
    }
  })
}

/** Kategori bazli hizli ozet: her kategoride su an ne calisiyor. */
export async function categoryPulse(limit = 5) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('kade_trend_current')
    .select('id, title, platform, kind, url, score, stage, views, posts, category')
    .gte('last_seen', new Date(Date.now() - 7 * 86400e3).toISOString())
    .order('score', { ascending: false, nullsFirst: false })
    .limit(1200)

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
