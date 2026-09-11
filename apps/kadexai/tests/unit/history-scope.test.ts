import test from 'node:test'
import assert from 'node:assert/strict'
import { historyReplayEndpoint, mergeAccountHistory, type ScopedHistoryEntry } from '../../lib/client/history'

test('history excludes other accounts and unverified legacy local cache', () => {
  const local = [
    { id: 'local-own', owner_id: 'a', created_at: '2026-09-06' },
    { id: 'local-other', owner_id: 'b', created_at: '2026-09-06' },
    { id: 'local-unknown', created_at: '2026-09-06' },
  ]
  assert.deepEqual(mergeAccountHistory([], local, 'a').map(x => x.id), ['local-own'])
  assert.deepEqual(mergeAccountHistory([], local, ''), [])
})

test('acknowledged local copies do not duplicate their server records', () => {
  const remote: ScopedHistoryEntry[] = [{ id: 'server', created_at: '2026-09-06' }]
  assert.deepEqual(mergeAccountHistory(remote, [{ id: 'local-1', remote_id: 'server', owner_id: 'a', created_at: '2026-09-06' }], 'a'), remote)
})

test('image rerun uses image endpoint and removed/arbitrary routes are rejected', () => {
  assert.equal(historyReplayEndpoint('ai-thumbnail'), '/api/image')
  assert.equal(historyReplayEndpoint('title'), '/api/generate/title')
  assert.equal(historyReplayEndpoint('script'), null)
  assert.equal(historyReplayEndpoint('../payments'), null)
})
