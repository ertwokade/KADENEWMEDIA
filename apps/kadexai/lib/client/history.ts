export interface ScopedHistoryEntry {
  id: string
  created_at: string
  owner_id?: string
  remote_id?: string
}

/** Do not flash another account's browser cache before authenticating the owner. */
export function mergeAccountHistory<T extends ScopedHistoryEntry>(remote: T[], local: T[], ownerId: string): T[] {
  const valid = (entry: T) => entry && typeof entry.id === 'string' && typeof entry.created_at === 'string'
  remote = remote.filter(valid)
  local = local.filter(valid)
  const ids = new Set(remote.map((entry) => entry.id))
  const ownLocal = ownerId ? local.filter((entry) => entry.id.startsWith('local-')
    && entry.owner_id === ownerId && !ids.has(entry.remote_id || entry.id)) : []
  return [...remote, ...ownLocal].sort((a, b) => b.created_at.localeCompare(a.created_at))
}

const REPLAYABLE = new Set('analytics bulk clickbait-detector viral-score title clips translate hook thread text-generator performance tts bio-link trends collab-mail ideas social-audit carousel content-plan hashtag description comment-analysis competitor faq quote-extractor retention-analysis youtube-seo channel-audit'.split(' '))

export function historyReplayEndpoint(tool: string) {
  if (tool === 'ai-thumbnail') return '/api/image'
  return REPLAYABLE.has(tool) ? `/api/generate/${tool}` : null
}
