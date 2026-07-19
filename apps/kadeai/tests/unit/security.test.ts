import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import { canAccessOwnedResource } from '../../lib/security/ownership'
import { isSettingsOwnerEmail, isSettingsOwnerOnlyRoute } from '../../lib/featureAccess'
import { distributedRateLimit } from '../../lib/rateLimit'

test('user A cannot access a resource owned by user B', () => {
  assert.equal(canAccessOwnedResource('user-a', 'user-a'), true)
  assert.equal(canAccessOwnedResource('user-a', 'user-b'), false)
  assert.equal(canAccessOwnedResource('', 'user-b'), false)
})

test('settings are restricted to the single account owner email', () => {
  assert.equal(isSettingsOwnerEmail('demirk314@gmail.com'), true)
  assert.equal(isSettingsOwnerEmail(' DEMIRK314@GMAIL.COM '), true)
  assert.equal(isSettingsOwnerEmail('another-owner@gmail.com'), false)
  assert.equal(isSettingsOwnerEmail(null), false)
  assert.equal(isSettingsOwnerOnlyRoute('/dashboard/settings'), true)
  assert.equal(isSettingsOwnerOnlyRoute('/api/env-status'), true)
  assert.equal(isSettingsOwnerOnlyRoute('/dashboard/title'), false)
})

test('latest RLS migration uses explicit operations and isolates payment ownership', async () => {
  const sql = await readFile(new URL('../../supabase/migrations/202607170002_explicit_rls_and_payments.sql', import.meta.url), 'utf8')
  assert.doesNotMatch(sql, /CREATE POLICY[\s\S][^;]+FOR ALL/i)
  assert.match(sql, /payment_orders_own_select[\s\S]+auth\.uid\(\) = user_id/)
  assert.doesNotMatch(sql, /CREATE POLICY payment_orders_own_insert/)
  assert.match(sql, /REVOKE INSERT, UPDATE, DELETE ON public\.payment_orders FROM anon, authenticated/)
  assert.match(sql, /REVOKE ALL ON public\.payment_events FROM anon, authenticated/)
})

test('distributed AI quota enforces cost, daily limit and idempotency locally', async () => {
  const identity = `unit-${Date.now()}-${Math.random()}`
  const now = 1_750_000_000_000
  const first = await distributedRateLimit('unit-ai', {
    identity,
    minuteLimit: 10,
    dailyLimit: 6,
    cost: 5,
    idempotencyKey: 'request-1',
    now,
  })
  assert.equal(first.allowed, true)
  const duplicate = await distributedRateLimit('unit-ai', {
    identity,
    minuteLimit: 10,
    dailyLimit: 6,
    cost: 5,
    idempotencyKey: 'request-1',
    now,
  })
  assert.equal(duplicate.status, 409)
  const dailyExceeded = await distributedRateLimit('unit-ai', {
    identity,
    minuteLimit: 10,
    dailyLimit: 6,
    cost: 2,
    idempotencyKey: 'request-2',
    now,
  })
  assert.equal(dailyExceeded.reason, 'daily_limit')
})

test('distributed quota fails closed in production without a backend', async () => {
  const previousNodeEnv = process.env.NODE_ENV
  const previousUrl = process.env.UPSTASH_REDIS_REST_URL
  const previousToken = process.env.UPSTASH_REDIS_REST_TOKEN
  Reflect.set(process.env, 'NODE_ENV', 'production')
  delete process.env.UPSTASH_REDIS_REST_URL
  delete process.env.UPSTASH_REDIS_REST_TOKEN
  try {
    const result = await distributedRateLimit('unit-production', { identity: 'user-1' })
    assert.equal(result.status, 503)
    assert.equal(result.reason, 'backend_unavailable')
  } finally {
    if (previousNodeEnv === undefined) Reflect.deleteProperty(process.env, 'NODE_ENV')
    else Reflect.set(process.env, 'NODE_ENV', previousNodeEnv)
    if (previousUrl === undefined) delete process.env.UPSTASH_REDIS_REST_URL
    else process.env.UPSTASH_REDIS_REST_URL = previousUrl
    if (previousToken === undefined) delete process.env.UPSTASH_REDIS_REST_TOKEN
    else process.env.UPSTASH_REDIS_REST_TOKEN = previousToken
  }
})
