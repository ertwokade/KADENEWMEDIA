import 'server-only'

import googleTrends from './googleTrends'
import tiktok from './tiktok'
import youtube from './youtube'
import musicCharts from './musicCharts'
import reddit from './reddit'
import instagram from './instagram'
import type { Collector, SourceId } from '../types'

export const COLLECTORS: Record<SourceId, Collector> = {
  googleTrends,
  tiktok,
  youtube,
  musicCharts,
  reddit,
  instagram,
}

// Instagram ve TikTok, digerlerinin verisine dayanabildigi icin en sona birakilir
export const SOURCE_ORDER: SourceId[] = ['googleTrends', 'youtube', 'musicCharts', 'reddit', 'tiktok', 'instagram']

export function availableSources() {
  return SOURCE_ORDER.map((id) => ({
    id,
    label: COLLECTORS[id].label,
    platforms: COLLECTORS[id].platforms,
    // Ulkeye bagli olmayan kaynaklar tek ulke icin calisir
    countryAware: id !== 'reddit',
    configured:
      id === 'youtube' ? Boolean(process.env.YOUTUBE_API_KEY?.trim())
      : id === 'tiktok' ? Boolean(process.env.TIKTOK_COOKIE?.trim())
      : id === 'instagram' ? Boolean(process.env.INSTAGRAM_SESSION_ID?.trim())
      : true,
  }))
}
