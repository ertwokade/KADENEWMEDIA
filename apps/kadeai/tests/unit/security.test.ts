import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import { adminAuthEmail, isLoginIdentifier } from '../../lib/auth/adminIdentity'
import { canAccessOwnedResource } from '../../lib/security/ownership'
import {
  isAllowedOwnerUser,
  isKadeAdminUser,
  isSettingsOwnerEmail,
  isSettingsOwnerOnlyRoute,
  isSettingsOwnerUser,
} from '../../lib/featureAccess'
import { countedDistributedRateLimit, distributedRateLimit } from '../../lib/rateLimit'

test('user A cannot access a resource owned by user B', () => {
  assert.equal(canAccessOwnedResource('user-a', 'user-a'), true)
  assert.equal(canAccessOwnedResource('user-a', 'user-b'), false)
  assert.equal(canAccessOwnedResource('', 'user-b'), false)
})

test('settings are restricted to the single account owner email', () => {
  assert.equal(isSettingsOwnerEmail('thekademedia@gmail.com'), true)
  assert.equal(isSettingsOwnerEmail(' THEKADEMEDIA@GMAIL.COM '), true)
  assert.equal(isSettingsOwnerEmail('demirk314@gmail.com'), false)
  assert.equal(isSettingsOwnerEmail('another-owner@gmail.com'), false)
  assert.equal(isSettingsOwnerEmail(null), false)
  assert.equal(isSettingsOwnerOnlyRoute('/dashboard/settings'), true)
  assert.equal(isSettingsOwnerOnlyRoute('/api/env-status'), true)
  assert.equal(isSettingsOwnerOnlyRoute('/dashboard/title'), false)
})

test('service-role-issued admin identities receive KadeAI owner access', () => {
  const bridgedAdmin = {
    email: 'admin-account@sso.kadenewmedia.com',
    app_metadata: {
      kade_admin_id: '11111111-1111-1111-1111-111111111111',
      kade_admin_role: 'admin',
    },
  }
  const forgedEditor = {
    email: 'editor@sso.kadenewmedia.com',
    app_metadata: {
      kade_admin_id: '22222222-2222-2222-2222-222222222222',
      kade_admin_role: 'editor',
    },
  }

  assert.equal(isKadeAdminUser(bridgedAdmin), true)
  assert.equal(isSettingsOwnerUser(bridgedAdmin), true)
  assert.equal(isAllowedOwnerUser(bridgedAdmin), true)
  assert.equal(isKadeAdminUser(forgedEditor), false)
  assert.equal(isSettingsOwnerUser(forgedEditor), false)
})

test('admin login identifiers and bridged auth emails are normalized safely', () => {
  assert.equal(isLoginIdentifier('kadir_demir'), true)
  assert.equal(isLoginIdentifier('admin@example.com'), true)
  assert.equal(isLoginIdentifier('invalid username'), false)
  assert.equal(isLoginIdentifier('not-an-email@'), false)

  assert.equal(
    adminAuthEmail({ id: 'ADMIN-ID', email: ' ADMIN@EXAMPLE.COM ' }),
    'admin@example.com',
  )
  assert.equal(
    adminAuthEmail({ id: 'ADMIN-ID', email: null }),
    'admin-admin-id@sso.kadenewmedia.com',
  )
})

test('latest RLS migration uses explicit operations and isolates payment ownership', async () => {
  const sql = await readFile(new URL('../../supabase/migrations/202607170002_explicit_rls_and_payments.sql', import.meta.url), 'utf8')
  assert.doesNotMatch(sql, /CREATE POLICY[\s\S][^;]+FOR ALL/i)
  assert.match(sql, /payment_orders_own_select[\s\S]+auth\.uid\(\) = user_id/)
  assert.doesNotMatch(sql, /CREATE POLICY payment_orders_own_insert/)
  assert.match(sql, /REVOKE INSERT, UPDATE, DELETE ON public\.payment_orders FROM anon, authenticated/)
  assert.match(sql, /REVOKE ALL ON public\.payment_events FROM anon, authenticated/)
})

test('proxy forwards server request headers to route handlers', async () => {
  const source = await readFile(new URL('../../proxy.ts', import.meta.url), 'utf8')
  assert.match(source, /new Headers\(request\.headers\)/)
  assert.match(source, /NextResponse\.next\(\{ request: \{ headers: requestHeaders \} \}\)/)
  assert.doesNotMatch(source, /NextResponse\.next\(\{ request \}\)/)
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

test('Supabase history counts provide conservative distributed quota fallback', () => {
  const allowed = countedDistributedRateLimit({ identity: 'user-1', minuteLimit: 30, dailyLimit: 500 }, 4, 42)
  assert.equal(allowed.allowed, true)
  assert.equal(allowed.remaining, 25)

  const minuteLimited = countedDistributedRateLimit({ identity: 'user-1', minuteLimit: 5, dailyLimit: 500 }, 5, 42)
  assert.equal(minuteLimited.allowed, false)
  assert.equal(minuteLimited.reason, 'minute_limit')

  const dailyLimited = countedDistributedRateLimit({ identity: 'user-1', minuteLimit: 30, dailyLimit: 50 }, 1, 50)
  assert.equal(dailyLimited.allowed, false)
  assert.equal(dailyLimited.reason, 'daily_limit')
})
