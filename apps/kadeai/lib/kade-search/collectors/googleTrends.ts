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
