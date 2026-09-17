import test from 'node:test'
import assert from 'node:assert/strict'
import { assistantToolCatalog } from '../../lib/assistant/toolCatalog'
import { TOOL_REGISTRY } from '../../lib/tools/registry'

test('asistan kataloğu kullanıcıya açık bütün araçları kategorileriyle içerir', () => {
  const catalog = assistantToolCatalog()
  const userTools = TOOL_REGISTRY.filter((tool) => tool.enabled && !tool.comingSoon && tool.permissions.includes('user'))
  assert.ok(userTools.length > 20)
  for (const tool of userTools) assert.ok(catalog.includes(tool.name), tool.name)
  assert.match(catalog, new RegExp(`\\(${userTools.length} araç\\)`))
  assert.match(catalog, /Planlama \(\d+\):/)
})
