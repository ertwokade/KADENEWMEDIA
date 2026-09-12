import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  ADMIN_JSON_EXPORT_MAX_ROWS,
  buildAdminJsonExportMetadata,
} from '../../server/api/_lib/adminExport.js'

test('admin JSON export is explicitly limited and never presented as a full database backup', () => {
  const metadata = buildAdminJsonExportMetadata({ messages: 12, quotes: 1001, invalid: 'unknown' })

  assert.equal(metadata.kind, 'limited-admin-json')
  assert.equal(metadata.fullDatabase, false)
  assert.equal(metadata.includesAuthenticationData, false)
  assert.equal(metadata.maxRowsPerCollection, ADMIN_JSON_EXPORT_MAX_ROWS)
  assert.equal(metadata.collectionCount, 3)
  assert.deepEqual(metadata.truncatedCollections, ['quotes'])
})
