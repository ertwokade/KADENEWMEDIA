import 'server-only'

/**
 * Google Trends toplayici.
 * Kisa video akimlarinin cogu once arama hacminde gorunur; erken sinyal kaynagidir.
 * Kaynak: trending RSS (herkese acik, anahtar gerekmez).
 */
import { getText, stripTags } from '../http'
import { parseCount } from '../util'
import type { Collector, RawTrendItem } from '../types'

interface RssItem {
  title: string
  traffic: string
  pubDate: string
  picture: string | null
  newsTitles: string[]
}

function parseRssItems(xml: string): RssItem[] {
  const items: RssItem[] = []
  for (const block of xml.split(/<item>/).slice(1)) {
    const pick = (tag: string) => {
      const m = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i'))
      if (!m) return ''
      return stripTags(m[1].replace(/<!\[CDATA\[|\]\]>/g, '')).trim()
    }
    const title = pick('title')
    if (!title) continue
    const newsTitles = [...block.matchAll(/<ht:news_item_title>([\s\S]*?)<\/ht:news_item_title>/g)].map((m) =>
      stripTags(m[1].replace(/<!\[CDATA\[|\]\]>/g, '')).trim()
    )
    items.push({
      title,
      traffic: pick('ht:approx_traffic'),
      pubDate: pick('pubDate'),
      picture: (block.match(/<ht:picture>([\s\S]*?)<\/ht:picture>/) || [])[1]?.trim() ?? null,
      newsTitles,
    })
  }
  return items
}

const googleTrends: Collector = {
  id: 'googleTrends',
  label: 'Google Trends',
  platforms: ['google'],

  async collect({ country }) {
    const errors: string[] = []
    const res = await getText(`https://trends.google.com/trending/rss?geo=${country}`, {
      label: `gtrends-rss-${country}`,
    })
    if (!res.ok) return { items: [], errors: [`google/rss/${country}: ${res.error}`] }

    const parsed = parseRssItems(res.data)
    if (!parsed.length) return { items: [], errors: [`google/rss/${country}: RSS boş döndü`] }

    const items: RawTrendItem[] = parsed.map((it, i) => ({
      platform: 'google',
      kind: 'topic',
      external_id: it.title,
      title: it.title,
      description: it.newsTitles.slice(0, 3).join(' | '),
      url: `https://www.google.com/search?q=${encodeURIComponent(it.title)}`,
      thumbnail: it.picture,
      country,
      rank: i + 1,
      published_at: it.pubDate ? new Date(it.pubDate).toISOString() : null,
      metrics: {
        views: parseCount(String(it.traffic).replace('+', '')) || 0,
        extra: { arama_hacmi: it.traffic },
      },
      hint: it.newsTitles.join(' '),
      raw: { source: 'trending-rss', traffic: it.traffic },
    }))

    return { items, errors }
  },
}

export default googleTrends

/**
 * Sorgu bazli canli Google aramasi (icerik bulucu icin).
 *
 * Trending RSS yalnizca "bugun ne yukseliyor" listesini verir, konu aramasi
 * yapmaz. Konu bazli taze sinyal icin Google Haberler RSS aramasi kullanilir:
 * anahtar gerektirmez, dil/ulke parametresi alir ve `when:<gun>d` ile donem
 * daraltilir. Tiklanma/izlenme sayisi vermedigi icin metrik uydurulmaz.
 */
export async function searchGoogleNow(opts: {
  query: string
  country: string
  language: string
  periodDays: number
  limit: number
}): Promise<{ items: RawTrendItem[]; source: 'live-web'; errors: string[] }> {
  const query = opts.query.trim().slice(0, 120)
  if (query.length < 2) return { items: [], source: 'live-web', errors: [] }
  const country = /^[A-Z]{2}$/.test(opts.country) ? opts.country : 'TR'
  const language = /^[a-z]{2}$/.test(opts.language) ? opts.language : 'tr'
  const days = Math.max(1, Math.min(Math.floor(opts.periodDays) || 7, 30))
  const limit = Math.max(1, Math.min(Math.floor(opts.limit) || 15, 25))
  const search = `${query} when:${days}d`
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(search)}`
    + `&hl=${language}-${country}&gl=${country}&ceid=${country}:${language}`

  const res = await getText(url, {
    headers: { accept: 'application/rss+xml, application/xml, text/xml' },
    label: `google-news-${country}`,
  })
  if (!res.ok) return { items: [], source: 'live-web', errors: [`google: ${res.error}`] }

  const items: RawTrendItem[] = []
  for (const block of res.data.split(/<item>/).slice(1, limit + 1)) {
    const pick = (tag: string) => {
      const m = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i'))
      return m ? stripTags(m[1].replace(/<!\[CDATA\[|\]\]>/g, '')).trim() : ''
    }
    const title = pick('title')
    const link = pick('link')
    if (!title || !/^https?:\/\//.test(link)) continue
    const pubDate = pick('pubDate')
    items.push({
      platform: 'google',
      kind: 'topic',
      external_id: pick('guid') || link,
      title,
      description: pick('source') || null,
      author: pick('source') || null,
      url: link,
      thumbnail: null,
      country,
      // Locale ile istendi; dil tespiti kisa baslikta "und" dondugu icin
      // dogru bilgiyi kaybetmemek adina acikca isaretlenir.
      language,
      rank: items.length + 1,
      published_at: pubDate && Number.isFinite(Date.parse(pubDate)) ? new Date(pubDate).toISOString() : null,
      hint: `google haber arama ${query}`,
      inferred: false,
      metrics: { extra: { kaynak: 'google-news-rss', olcum_yok: true } },
      raw: { source: 'news-rss', query: search },
    })
  }

  return { items, source: 'live-web', errors: [] }
}
