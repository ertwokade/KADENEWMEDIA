export const ADMIN_JSON_EXPORT_MAX_ROWS = 1000

export function buildAdminJsonExportMetadata(collectionCounts = {}) {
  const normalizedCounts = Object.fromEntries(
    Object.entries(collectionCounts).map(([name, value]) => [name, Math.max(0, Number(value) || 0)]),
  )

  return {
    kind: 'limited-admin-json',
    fullDatabase: false,
    includesAuthenticationData: false,
    maxRowsPerCollection: ADMIN_JSON_EXPORT_MAX_ROWS,
    collectionCount: Object.keys(normalizedCounts).length,
    truncatedCollections: Object.entries(normalizedCounts)
      .filter(([, count]) => count > ADMIN_JSON_EXPORT_MAX_ROWS)
      .map(([name]) => name),
  }
}
