import assert from 'node:assert/strict'
import { test } from 'node:test'
import { resolveKadePageTitle } from '@/lib/pageTitle'

test('KadeAI public root uses the Kade brand title', () => {
  assert.equal(resolveKadePageTitle('/kadeai'), 'KadeAI | Kade New Media')
})

test('KadeAI dashboard routes use the active tool name', () => {
  assert.equal(resolveKadePageTitle('/kadeai/dashboard/title'), 'Başlık Üretici | KadeAI')
})

test('KadeAI operation routes use the active operation view', () => {
  assert.equal(resolveKadePageTitle('/kadeai/dashboard/operations', '?view=banana'), 'Banana Studio | KadeAI')
  assert.equal(resolveKadePageTitle('/kadeai/dashboard/operations', '?view=radar'), 'AI Radar | KadeAI')
})
