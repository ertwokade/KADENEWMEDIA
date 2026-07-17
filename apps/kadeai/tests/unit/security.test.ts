import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import { canAccessOwnedResource } from '../../lib/security/ownership'

test('user A cannot access a resource owned by user B', () => {
  assert.equal(canAccessOwnedResource('user-a', 'user-a'), true)
  assert.equal(canAccessOwnedResource('user-a', 'user-b'), false)
  assert.equal(canAccessOwnedResource('', 'user-b'), false)
})

test('latest RLS migration uses explicit operations and isolates payment ownership', async () => {
  const sql = await readFile(new URL('../../supabase/migrations/202607170002_explicit_rls_and_payments.sql', import.meta.url), 'utf8')
  assert.doesNotMatch(sql, /CREATE POLICY[\s\S][^;]+FOR ALL/i)
  assert.match(sql, /payment_orders_own_select[\s\S]+auth\.uid\(\) = user_id/)
  assert.doesNotMatch(sql, /CREATE POLICY payment_orders_own_insert/)
  assert.match(sql, /REVOKE INSERT, UPDATE, DELETE ON public\.payment_orders FROM anon, authenticated/)
  assert.match(sql, /REVOKE ALL ON public\.payment_events FROM anon, authenticated/)
})
