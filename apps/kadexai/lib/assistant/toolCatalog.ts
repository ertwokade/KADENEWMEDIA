import { TOOL_CATEGORIES, TOOL_REGISTRY } from '@/lib/tools/registry'

/**
 * Asistanın bağlamına giren araç kataloğu. Eskiden yalnız son çalışmalar
 * gönderildiği için "hangi araçlar var?" sorusuna 8 araçlık eksik liste dönüyordu.
 */
export function assistantToolCatalog(includeOwner = false): string {
  const visible = TOOL_REGISTRY.filter((tool) => tool.enabled && !tool.comingSoon
    && (tool.permissions.includes('user') || (includeOwner && tool.category === 'owner')))
  const lines = TOOL_CATEGORIES
    .map((category) => {
      const names = visible.filter((tool) => tool.category === category.id).map((tool) => tool.name)
      return names.length ? `${category.label.charAt(0)}${category.label.slice(1).toLocaleLowerCase('tr-TR')} (${names.length}): ${names.join(', ')}` : ''
    })
    .filter(Boolean)
  return `KadexAI araç kataloğunun tamamı (${visible.length} araç):\n${lines.join('\n')}`
}
