import assert from 'node:assert/strict'
import { test } from 'node:test'
import { resolveKadePageTitle } from '@/lib/pageTitle'

test('KadexAI public root uses the Kade brand title', () => {
  assert.equal(resolveKadePageTitle('/kadexai'), 'KadexAI | Kade New Media')
  assert.equal(resolveKadePageTitle('/kadexai-demo'), 'KadexAI Demo | AI Sosyal Medya ve İçerik Platformu')
})

test('KadexAI dashboard routes use the active tool name', () => {
  assert.equal(resolveKadePageTitle('/kadexai/dashboard/title'), 'Başlık Üretici | KadexAI')
})

test('KadexAI operation routes use the active operation view', () => {
  assert.equal(resolveKadePageTitle('/kadexai/dashboard/operations', '?view=banana'), 'Banana Studio | KadexAI')
  assert.equal(resolveKadePageTitle('/kadexai/dashboard/operations', '?view=calendar'), 'Yayın Takvimi | KadexAI')
  assert.equal(resolveKadePageTitle('/kadexai/dashboard/operations', '?view=clients'), 'Müşteri & Teslim | KadexAI')
})
