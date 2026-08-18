import 'server-only'

/**
 * Reddit toplayici.
 * Bircok internet akimi once Reddit'te dogar, sonra TikTok/Reels'e sicrar.
 *
 * Not: Reddit'in .json ucu anonim isteklere 403 donuyor; herkese acik Atom
 * beslemeleri kullaniliyor. RSS begeni/yorum vermedigi icin metrikler
 * siralamadan tahmin edilir ve `tahmini: true` ile isaretlenir.
 */
import { getText, stripTags } from '../http'
import type { Collector, RawTrendItem } from '../types'

const SUBS = [
  { sub: 'popular', hint: 'genel gundem' },
  { sub: 'all', hint: 'genel gundem' },
  { sub: 'TikTokCringe', hint: 'tiktok akim video' },
  { sub: 'memes', hint: 'meme komedi mizah' },
  { sub: 'dankmemes', hint: 'meme komedi' },
  { sub: 'nextfuckinglevel', hint: 'etkileyici yetenek' },
  { sub: 'oddlysatisfying', hint: 'satisfying tatmin edici asmr' },
  { sub: 'interestingasfuck', hint: 'ilginc bilgi' },
  { sub: 'Damnthatsinteresting', hint: 'ilginc bilgi egitim' },
  { sub: 'food', hint: 'yemek tarif' },
  { sub: 'MakeupAddiction', hint: 'makyaj guzellik' },
  { sub: 'malefashionadvice', hint: 'moda kombin' },
  { sub: 'Fitness', hint: 'fitness spor antrenman' },
  { sub: 'gaming', hint: 'oyun gaming' },
  { sub: 'technology', hint: 'teknoloji' },
  { sub: 'artificial', hint: 'yapay zeka ai' },
  { sub: 'personalfinance', hint: 'para finans yatirim' },
  { sub: 'travel', hint: 'seyahat gezi' },
  { sub: 'aww', hint: 'hayvan sevimli kedi kopek' },
  { sub: 'DIY', hint: 'diy el isi kendin yap' },
  { sub: 'movies', hint: 'film dizi' },
  { sub: 'Music', hint: 'muzik sarki' },
  { sub: 'Turkey', hint: 'turkiye gundem haber' },
  { sub: 'KGBTR', hint: 'turkiye mizah komedi' },
]

interface AtomEntry {
  title: string
  link: string
  thumb: string | null
  author: string
  updated: string
  id: string
  content: string
}

function parseAtom(xml: string): AtomEntry[] {
  const entries: AtomEntry[] = []
  for (const block of xml.split(/<entry>/).slice(1)) {
    const pick = (tag: string) => {
      const m = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i'))
      return m ? stripTags(m[1].replace(/<!\[CDATA\[|\]\]>/g, '')).trim() : ''
    }
    const link = (block.match(/<link[^>]*href="([^"]+)"/i) || [])[1] ?? ''
    const thumb = (block.match(/<img src="([^"]+)"/i) || [])[1]?.replace(/&amp;/g, '&') ?? null
    const title = pick('title')
    if (!title) continue
    entries.push({
      title,
      link,
      thumb,
      author: pick('name'),
      updated: pick('updated') || pick('published'),
      id: (block.match(/<id>([\s\S]*?)<\/id>/) || [])[1]?.trim() ?? link,
      content: pick('content').slice(0, 400),
    })
  }
  return entries
}

async function fetchSub(entry: { sub: string; hint: string }, limit: number): Promise<RawTrendItem[]> {
  const res = await getText(`https://www.reddit.com/r/${entry.sub}/top/.rss?t=day`, {
    headers: { accept: 'application/atom+xml, application/xml, text/xml' },
    label: `reddit-${entry.sub}`,
  })
  if (!res.ok) throw new Error(res.error)

  const entries = parseAtom(res.data).slice(0, limit)
  if (!entries.length) throw new Error('RSS boş döndü')

  return entries.map((e, i) => ({
    platform: 'reddit',
    kind: 'topic',
    external_id: e.id.replace('t3_', ''),
    title: e.title,
    description: e.content,
    author: e.author || null,
    url: e.link,
    thumbnail: e.thumb,
    country: null,
    rank: i + 1,
    published_at: e.updated ? new Date(e.updated).toISOString() : null,
    hint: `${entry.hint} ${entry.sub}`,
    metrics: {
      // RSS begeni/yorum sayisi vermez; siralama konumundan kaba ilgi tahmini
      views: Math.round(200000 / (i + 1)),
      likes: Math.round(4000 / (i + 1)),
      extra: { subreddit: entry.sub, kaynak: 'rss', tahmini: true },
    },
    raw: { subreddit: entry.sub, source: 'rss' },
  }))
}

const reddit: Collector = {
  id: 'reddit',
  label: 'Reddit',
  platforms: ['reddit'],

  async collect({ limit }) {
    const items: RawTrendItem[] = []
    const errors: string[] = []
    for (const s of SUBS) {
      try {
        items.push(...(await fetchSub(s, Math.min(limit, 25))))
      } catch (e) {
        errors.push(`reddit/${s.sub}: ${(e as Error).message}`)
      }
    }
    return { items, errors: errors.slice(0, 6) }
  },
}

export default reddit
